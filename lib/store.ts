import { AlertIncident, DashboardStats, DeviceInfo, MonitoringSettings, SensorReading, Severity, SimulationScenario } from './types';
import { evaluateReading, processIncidents } from './alert-engine';
import { createInitialSimulationState, generateNextReading, generateSeedHistory, SimulationState } from './simulation';

export const DEFAULT_SETTINGS: MonitoringSettings = {
  temperatureWarning: 30.0,
  temperatureCritical: 35.0,
  gasWarning: 400,
  humidityLow: 30.0,
  humidityHigh: 70.0,
  refreshIntervalSeconds: 2,
  simulationScenario: 'normal',
  timeFormat: '24h',
  soundEnabled: true,
  powerRatingWatts: 2400.0, // 2.4 kW typical 42U rack load
  gridEmissionFactorKgPerKwh: 0.475, // standard grid factor
};

export const DEVICE_METADATA: DeviceInfo = {
  id: 'server-room-01',
  name: 'Rack-Alpha Primary Environmental Telemetry',
  boardType: 'Arduino UNO R3',
  connectionType: 'USB Serial (9600 baud via Gateway)',
  baudRate: 9600,
  source: 'simulation',
  connectionStatus: 'SIMULATING',
  lastSeenAt: null,
  firmwareVersion: '1.2.4-senser',
  pinout: [
    { component: 'TMP36 Temp Sensor', pin: 'A3', type: 'Analog', description: 'Measures ambient rack temperature (°C = (Vout - 0.5) * 100)' },
    { component: 'MQ Gas Sensor', pin: 'A0', type: 'Analog', description: 'Raw ADC reading (0-1023) representing combustible gas / smoke conductivity' },
    { component: 'Humidity Potentiometer', pin: 'A1', type: 'Analog', description: 'Simulated humidity input (0-100%) mapped from analog voltage' },
    { component: 'Red Alert LED', pin: 'D2', type: 'Digital', description: 'Active HIGH on WARNING or CRITICAL conditions' },
    { component: 'Green Status LED', pin: 'D3', type: 'Digital', description: 'Active HIGH when all environmental parameters are NORMAL' },
    { component: 'Piezo Buzzer', pin: 'D4', type: 'Digital', description: 'Pulsed alarm on CRITICAL overheating (>=35°C) or gas hazard (>=400 ADC)' },
    { component: '16x2 Character LCD', pin: 'D5, D6, D8, D9, D10, D11', type: 'Digital', description: 'Local readout for temperature, gas, and system status' },
  ],
};

class DataStore {
  private settings: MonitoringSettings = { ...DEFAULT_SETTINGS };
  private readings: SensorReading[] = [];
  private incidents: AlertIncident[] = [];
  private device: DeviceInfo = { ...DEVICE_METADATA };
  private simState: SimulationState = createInitialSimulationState('normal');
  private lastHardwarePing: number | null = null;
  private readonly MAX_HISTORY = 1200;
  private startTime = Date.now();

  constructor() {
    // Populate seed history so the dashboard is immediately rich with realistic trend data
    this.readings = generateSeedHistory(45, this.settings.refreshIntervalSeconds, this.settings);
    this.simState.stepCount = 45;
    if (this.readings.length > 0) {
      this.simState.lastReading = this.readings[this.readings.length - 1];
    }
  }

  public getSettings(): MonitoringSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<MonitoringSettings>): MonitoringSettings {
    this.settings = { ...this.settings, ...partial };
    // If scenario changed, update simulation state
    if (partial.simulationScenario && partial.simulationScenario !== this.simState.scenario) {
      this.simState.scenario = partial.simulationScenario;
      this.simState.stepCount = 0; // reset progression for new scenario
    }
    return this.getSettings();
  }

  public getReadings(limit: number = 60): SensorReading[] {
    return this.readings.slice(-limit);
  }

  public getAllReadings(): SensorReading[] {
    return [...this.readings];
  }

  public getLatestReading(): SensorReading | null {
    return this.readings.length > 0 ? this.readings[this.readings.length - 1] : null;
  }

  public getIncidents(): AlertIncident[] {
    return [...this.incidents];
  }

  public getActiveAlerts(): AlertIncident[] {
    return this.incidents.filter((i) => i.status === 'ACTIVE' || i.status === 'ACKNOWLEDGED');
  }

  public getDevice(): DeviceInfo {
    // Check hardware freshness
    const now = Date.now();
    let connStatus: DeviceInfo['connectionStatus'] = 'SIMULATING';

    if (this.lastHardwarePing) {
      const elapsedSeconds = (now - this.lastHardwarePing) / 1000;
      if (elapsedSeconds <= 10) {
        connStatus = 'CONNECTED';
      } else {
        // Stale / disconnected hardware: strictly never show connected
        connStatus = 'DISCONNECTED';
      }
    }

    return {
      ...this.device,
      connectionStatus: connStatus,
    };
  }

  public isHardwareConnected(): boolean {
    if (!this.lastHardwarePing) return false;
    return (Date.now() - this.lastHardwarePing) <= 10000;
  }

  public acknowledgeAlert(id: string): AlertIncident | null {
    const incident = this.incidents.find((i) => i.id === id);
    if (!incident) return null;
    if (incident.status === 'ACTIVE') {
      incident.status = 'ACKNOWLEDGED';
      incident.acknowledgedAt = new Date().toISOString();
    }
    return { ...incident };
  }

  public resolveAlert(id: string): AlertIncident | null {
    const incident = this.incidents.find((i) => i.id === id);
    if (!incident) return null;
    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date().toISOString();
    return { ...incident };
  }

  public addReading(rawReading: {
    deviceId?: string;
    temperatureC: number;
    gasAdc: number;
    humidityPercent: number;
    source: 'simulation' | 'hardware';
    timestamp?: string;
  }): SensorReading {
    const timestamp = rawReading.timestamp || new Date().toISOString();
    const evaluation = evaluateReading(rawReading, this.settings);

    const reading: SensorReading = {
      id: `rd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      temperatureC: Math.round(rawReading.temperatureC * 10) / 10,
      gasAdc: Math.round(rawReading.gasAdc),
      humidityPercent: Math.round(rawReading.humidityPercent),
      source: rawReading.source,
      deviceId: rawReading.deviceId || 'server-room-01',
      overallStatus: evaluation.overallStatus,
    };

    if (rawReading.source === 'hardware') {
      this.lastHardwarePing = Date.now();
      this.device.lastSeenAt = timestamp;
      this.device.source = 'hardware';
    }

    // Add reading
    this.readings.push(reading);
    if (this.readings.length > this.MAX_HISTORY) {
      this.readings.shift();
    }

    // Process incidents
    this.incidents = processIncidents(this.incidents, evaluation, reading.deviceId, timestamp);

    return reading;
  }

  public tickSimulation(): SensorReading | null {
    if (!this.simState.isRunning) {
      return null;
    }

    // If real hardware is currently streaming, don't generate simulated overlay
    if (this.isHardwareConnected()) {
      return null;
    }

    const { reading, nextState } = generateNextReading(this.simState, this.settings);
    this.simState = nextState;

    this.addReading(reading);
    return reading;
  }

  public setSimulationRunning(running: boolean) {
    this.simState.isRunning = running;
  }

  public isSimulationRunning(): boolean {
    return this.simState.isRunning;
  }

  public getSimulationScenario(): SimulationScenario {
    return this.simState.scenario;
  }

  public setSimulationScenario(scenario: SimulationScenario) {
    this.simState.scenario = scenario;
    this.simState.stepCount = 0;
    this.settings.simulationScenario = scenario;
  }

  public resetSimulation() {
    this.simState = createInitialSimulationState(this.settings.simulationScenario);
    this.readings = generateSeedHistory(30, this.settings.refreshIntervalSeconds, this.settings);
    this.incidents = [];
    this.startTime = Date.now();
  }

  public getStats(): DashboardStats {
    const current = this.getLatestReading() || {
      id: 'init',
      timestamp: new Date().toISOString(),
      temperatureC: 24.0,
      gasAdc: 120,
      humidityPercent: 50,
      source: 'simulation',
      deviceId: 'server-room-01',
      overallStatus: 'NORMAL',
    };

    const previous = this.readings.length > 1 ? this.readings[this.readings.length - 2] : null;

    let minTemp = current.temperatureC;
    let maxTemp = current.temperatureC;
    let sumTemp = 0;

    for (const r of this.readings) {
      if (r.temperatureC < minTemp) minTemp = r.temperatureC;
      if (r.temperatureC > maxTemp) maxTemp = r.temperatureC;
      sumTemp += r.temperatureC;
    }

    const avgTemp = this.readings.length > 0 ? sumTemp / this.readings.length : current.temperatureC;

    const tempTrend: 'up' | 'down' | 'stable' =
      previous ? (current.temperatureC > previous.temperatureC ? 'up' : current.temperatureC < previous.temperatureC ? 'down' : 'stable') : 'stable';

    const gasTrend: 'up' | 'down' | 'stable' =
      previous ? (current.gasAdc > previous.gasAdc ? 'up' : current.gasAdc < previous.gasAdc ? 'down' : 'stable') : 'stable';

    const humidityTrend: 'up' | 'down' | 'stable' =
      previous ? (current.humidityPercent > previous.humidityPercent ? 'up' : current.humidityPercent < previous.humidityPercent ? 'down' : 'stable') : 'stable';

    const activeAlerts = this.getActiveAlerts();
    const isHw = this.isHardwareConnected();
    const buzzerActive = current.overallStatus === 'CRITICAL';

    return {
      currentReading: current,
      previousReading: previous,
      minTemp: Math.round(minTemp * 10) / 10,
      maxTemp: Math.round(maxTemp * 10) / 10,
      avgTemp: Math.round(avgTemp * 10) / 10,
      tempTrend,
      gasTrend,
      humidityTrend,
      activeAlertCount: activeAlerts.length,
      overallStatus: current.overallStatus,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      isHardwareConnected: isHw,
      buzzerActive,
    };
  }
}

// Global singleton for Next.js dev server & production preservation across route invocations
declare global {
  // eslint-disable-next-line no-var
  var __SERVER_SENSE_STORE__: DataStore | undefined;
}

export const store: DataStore = global.__SERVER_SENSE_STORE__ || new DataStore();
if (process.env.NODE_ENV !== 'production') {
  global.__SERVER_SENSE_STORE__ = store;
}
