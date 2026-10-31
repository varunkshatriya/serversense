import { MonitoringSettings, SensorReading, SimulationScenario } from './types';
import { evaluateReading } from './alert-engine';

export interface SimulationState {
  isRunning: boolean;
  scenario: SimulationScenario;
  stepCount: number;
  lastReading: SensorReading | null;
  baseTemp: number;
  baseGas: number;
  baseHumidity: number;
}

export function createInitialSimulationState(scenario: SimulationScenario = 'normal'): SimulationState {
  return {
    isRunning: true,
    scenario,
    stepCount: 0,
    lastReading: null,
    baseTemp: 23.8,
    baseGas: 115,
    baseHumidity: 48,
  };
}

/**
 * Deterministically generates the next simulated reading based on scenario and step count.
 */
export function generateNextReading(
  state: SimulationState,
  settings: MonitoringSettings,
  timestamp: string = new Date().toISOString()
): { reading: SensorReading; nextState: SimulationState } {
  const step = state.stepCount;
  let temp = state.baseTemp;
  let gas = state.baseGas;
  let humidity = state.baseHumidity;

  switch (state.scenario) {
    case 'normal':
      // Gentle natural fluctuation
      temp = 23.5 + Math.sin(step * 0.1) * 1.8 + Math.cos(step * 0.05) * 0.6;
      gas = Math.round(110 + Math.sin(step * 0.15) * 25 + Math.cos(step * 0.2) * 10);
      humidity = Math.round(48 + Math.sin(step * 0.08) * 4);
      break;

    case 'heatwave_hvac':
      // Simulates AC cooling compressor failure in server rack
      // Ramps from 26°C up to 37.5°C
      const tempProgression = Math.min(step * 0.45, 14); // Ramps up
      temp = 24.0 + tempProgression + Math.sin(step * 0.2) * 0.4;
      gas = Math.round(120 + (temp > 33 ? (temp - 33) * 15 : 0)); // Slight trace thermal outgassing
      humidity = Math.max(28, Math.round(45 - (temp - 24) * 1.2)); // Air dries as it heats
      break;

    case 'gas_leak':
      // Simulates battery venting / smoke or smoldering capacitor
      // Rapid spike in ADC
      temp = 25.0 + Math.sin(step * 0.1) * 1.0;
      if (step < 5) {
        gas = 130 + step * 10;
      } else {
        // Sudden steep spike reaching 450 - 680
        gas = Math.min(1023, Math.round(180 + Math.pow(step - 4, 1.8) * 22));
      }
      humidity = 47 + Math.round(Math.sin(step * 0.1) * 3);
      break;

    case 'humidity_drift':
      // Potentiometer simulated input drifting outside safe 30-70% zone
      temp = 24.2 + Math.sin(step * 0.1) * 0.8;
      gas = 115 + Math.round(Math.sin(step * 0.1) * 15);
      // Drifts down into ESD hazard (<30%), then up to condensation (>70%)
      humidity = Math.round(50 + Math.sin(step * 0.12) * 32); // oscillates between 18% and 82%
      break;
  }

  // Constrain to physical sensor bounds
  temp = Math.max(-10, Math.min(85, Math.round(temp * 10) / 10));
  gas = Math.max(0, Math.min(1023, Math.round(gas)));
  humidity = Math.max(0, Math.min(100, Math.round(humidity)));

  const evaluation = evaluateReading({ temperatureC: temp, gasAdc: gas, humidityPercent: humidity }, settings);

  const reading: SensorReading = {
    id: `sim-${Date.now()}-${step}`,
    timestamp,
    temperatureC: temp,
    gasAdc: gas,
    humidityPercent: humidity,
    source: 'simulation',
    deviceId: 'server-room-01',
    overallStatus: evaluation.overallStatus,
  };

  const nextState: SimulationState = {
    ...state,
    stepCount: step + 1,
    lastReading: reading,
  };

  return { reading, nextState };
}

/**
 * Pre-populates historical baseline readings (e.g. past 60 minutes)
 * for immediate visualization on startup.
 */
export function generateSeedHistory(
  count: number = 30,
  intervalSeconds: number = 2,
  settings: MonitoringSettings
): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  let simState = createInitialSimulationState('normal');

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * intervalSeconds * 1000).toISOString();
    const { reading, nextState } = generateNextReading(simState, settings, timestamp);
    readings.push(reading);
    simState = nextState;
  }

  return readings;
}
