import { z } from 'zod';

export const SensorReadingInputSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required').default('server-room-01'),
  temperatureC: z.number().min(-40, 'Temperature too low').max(125, 'Temperature exceeds physical limit of TMP36'),
  gasAdc: z.number().int().min(0, 'Gas ADC minimum is 0').max(1023, 'Gas ADC maximum is 1023'),
  humidityPercent: z.number().min(0, 'Humidity minimum is 0%').max(100, 'Humidity maximum is 100%'),
  source: z.enum(['simulation', 'hardware']).default('hardware'),
  timestamp: z.string().datetime({ message: 'Must be a valid ISO-8601 timestamp' }).optional(),
});

export const MonitoringSettingsSchema = z.object({
  temperatureWarning: z.number().min(15).max(70),
  temperatureCritical: z.number().min(20).max(90),
  gasWarning: z.number().int().min(50).max(1023),
  humidityLow: z.number().min(10).max(50),
  humidityHigh: z.number().min(50).max(95),
  refreshIntervalSeconds: z.number().int().min(1).max(30),
  simulationScenario: z.enum(['normal', 'heatwave_hvac', 'gas_leak', 'humidity_drift']),
  timeFormat: z.enum(['24h', '12h']),
  soundEnabled: z.boolean().default(true),
  powerRatingWatts: z.number().min(100).max(50000),
  gridEmissionFactorKgPerKwh: z.number().min(0.01).max(2.0),
}).refine((data) => data.temperatureCritical > data.temperatureWarning, {
  message: 'Critical temperature threshold must be strictly greater than warning threshold',
  path: ['temperatureCritical'],
}).refine((data) => data.humidityHigh > data.humidityLow, {
  message: 'Upper humidity threshold must be strictly greater than lower humidity threshold',
  path: ['humidityHigh'],
});

export const AlertIncidentUpdateSchema = z.object({
  action: z.enum(['acknowledge', 'resolve']),
});

export type ValidatedSensorReading = z.infer<typeof SensorReadingInputSchema>;
export type ValidatedSettings = z.infer<typeof MonitoringSettingsSchema>;
