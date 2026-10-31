export type Severity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type SensorType = 'TEMPERATURE' | 'GAS' | 'HUMIDITY' | 'SYSTEM';

export type ReadingSource = 'simulation' | 'hardware';

export type SimulationScenario = 'normal' | 'heatwave_hvac' | 'gas_leak' | 'humidity_drift';

export interface SensorReading {
  id: string;
  timestamp: string; // ISO-8601
  temperatureC: number;
  gasAdc: number; // 0 - 1023 raw analog
  humidityPercent: number; // 0 - 100% (potentiometer simulated)
  source: ReadingSource;
  deviceId: string;
  overallStatus: Severity;
}

export interface AlertIncident {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  severity: 'WARNING' | 'CRITICAL';
  measuredValue: number;
  threshold: number;
  message: string;
  firstSeenAt: string;
  lastSeenAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface DeviceInfo {
  id: string;
  name: string;
  boardType: string;
  connectionType: string;
  baudRate: number;
  source: ReadingSource;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'SIMULATING';
  lastSeenAt: string | null;
  firmwareVersion: string;
  pinout: {
    component: string;
    pin: string;
    type: 'Digital' | 'Analog' | 'PWM';
    description: string;
  }[];
}

export interface MonitoringSettings {
  temperatureWarning: number; // default 30
  temperatureCritical: number; // default 35
  gasWarning: number; // default 400
  humidityLow: number; // default 30
  humidityHigh: number; // default 70
  refreshIntervalSeconds: number; // default 2
  simulationScenario: SimulationScenario;
  timeFormat: '24h' | '12h';
  soundEnabled: boolean;
  powerRatingWatts: number; // default 2400W (server rack estimate)
  gridEmissionFactorKgPerKwh: number; // default 0.475
}

export interface EnergyEstimate {
  powerWatts: number;
  durationHours: number;
  energyKwh: number;
  carbonKgCo2e: number;
  emissionFactor: number;
  isSimulatedEstimate: boolean;
  limitations: string;
}

export interface DashboardStats {
  currentReading: SensorReading;
  previousReading: SensorReading | null;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  tempTrend: 'up' | 'down' | 'stable';
  gasTrend: 'up' | 'down' | 'stable';
  humidityTrend: 'up' | 'down' | 'stable';
  activeAlertCount: number;
  overallStatus: Severity;
  uptimeSeconds: number;
  isHardwareConnected: boolean;
  buzzerActive: boolean;
}
