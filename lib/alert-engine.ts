import { AlertIncident, MonitoringSettings, SensorReading, SensorType, Severity } from './types';

export interface AlertEvaluationResult {
  overallStatus: Severity;
  activeReasons: {
    sensorType: SensorType;
    severity: 'WARNING' | 'CRITICAL';
    measuredValue: number;
    threshold: number;
    message: string;
  }[];
}

/**
 * Evaluates a sensor reading against current thresholds.
 */
export function evaluateReading(
  reading: Pick<SensorReading, 'temperatureC' | 'gasAdc' | 'humidityPercent'>,
  settings: MonitoringSettings
): AlertEvaluationResult {
  const reasons: AlertEvaluationResult['activeReasons'] = [];

  // 1. Evaluate Temperature
  if (reading.temperatureC >= settings.temperatureCritical) {
    reasons.push({
      sensorType: 'TEMPERATURE',
      severity: 'CRITICAL',
      measuredValue: reading.temperatureC,
      threshold: settings.temperatureCritical,
      message: `Critical server room overheating detected: ${reading.temperatureC.toFixed(1)}°C exceeds threshold of ${settings.temperatureCritical}°C`,
    });
  } else if (reading.temperatureC >= settings.temperatureWarning) {
    reasons.push({
      sensorType: 'TEMPERATURE',
      severity: 'WARNING',
      measuredValue: reading.temperatureC,
      threshold: settings.temperatureWarning,
      message: `High temperature warning: ${reading.temperatureC.toFixed(1)}°C exceeds threshold of ${settings.temperatureWarning}°C`,
    });
  }

  // 2. Evaluate Gas Sensor
  if (reading.gasAdc >= settings.gasWarning) {
    reasons.push({
      sensorType: 'GAS',
      severity: 'CRITICAL',
      measuredValue: reading.gasAdc,
      threshold: settings.gasWarning,
      message: `Combustible gas / smoke hazard detected: Raw ADC ${reading.gasAdc} reaches critical threshold of ${settings.gasWarning}`,
    });
  }

  // 3. Evaluate Humidity (Potentiometer input)
  if (reading.humidityPercent < settings.humidityLow) {
    reasons.push({
      sensorType: 'HUMIDITY',
      severity: 'WARNING',
      measuredValue: reading.humidityPercent,
      threshold: settings.humidityLow,
      message: `Low humidity warning (ESD electrostatic risk): ${reading.humidityPercent.toFixed(0)}% is below safe minimum of ${settings.humidityLow}%`,
    });
  } else if (reading.humidityPercent > settings.humidityHigh) {
    reasons.push({
      sensorType: 'HUMIDITY',
      severity: 'WARNING',
      measuredValue: reading.humidityPercent,
      threshold: settings.humidityHigh,
      message: `High humidity warning (condensation risk): ${reading.humidityPercent.toFixed(0)}% exceeds safe maximum of ${settings.humidityHigh}%`,
    });
  }

  // Determine overall status
  let overallStatus: Severity = 'NORMAL';
  if (reasons.some((r) => r.severity === 'CRITICAL')) {
    overallStatus = 'CRITICAL';
  } else if (reasons.some((r) => r.severity === 'WARNING')) {
    overallStatus = 'WARNING';
  }

  return { overallStatus, activeReasons: reasons };
}

/**
 * Reconciles the incident list:
 * - If an active incident for a sensor exists, updates lastSeenAt and measuredValue.
 * - If condition is new, opens a new incident.
 * - If a previous condition cleared, auto-resolves or marks resolved.
 */
export function processIncidents(
  currentIncidents: AlertIncident[],
  evaluation: AlertEvaluationResult,
  deviceId: string,
  timestamp: string
): AlertIncident[] {
  const updatedIncidents = [...currentIncidents];
  const activeSensorTypes = new Set(evaluation.activeReasons.map((r) => r.sensorType));

  // Update existing active or acknowledged incidents for continuing conditions
  for (const reason of evaluation.activeReasons) {
    const existingIndex = updatedIncidents.findIndex(
      (inc) => inc.sensorType === reason.sensorType && (inc.status === 'ACTIVE' || inc.status === 'ACKNOWLEDGED')
    );

    if (existingIndex >= 0) {
      // Continuing condition: update value and time
      const existing = updatedIncidents[existingIndex];
      updatedIncidents[existingIndex] = {
        ...existing,
        measuredValue: reason.measuredValue,
        severity: reason.severity,
        message: reason.message,
        lastSeenAt: timestamp,
      };
    } else {
      // New condition: create new incident
      const newIncident: AlertIncident = {
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        deviceId,
        sensorType: reason.sensorType,
        severity: reason.severity,
        measuredValue: reason.measuredValue,
        threshold: reason.threshold,
        message: reason.message,
        firstSeenAt: timestamp,
        lastSeenAt: timestamp,
        acknowledgedAt: null,
        resolvedAt: null,
        status: 'ACTIVE',
      };
      updatedIncidents.unshift(newIncident);
    }
  }

  // Auto-resolve any ACTIVE or ACKNOWLEDGED incidents whose condition has returned to normal
  for (let i = 0; i < updatedIncidents.length; i++) {
    const inc = updatedIncidents[i];
    if ((inc.status === 'ACTIVE' || inc.status === 'ACKNOWLEDGED') && !activeSensorTypes.has(inc.sensorType)) {
      updatedIncidents[i] = {
        ...inc,
        resolvedAt: timestamp,
        status: 'RESOLVED',
      };
    }
  }

  return updatedIncidents;
}
