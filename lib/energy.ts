import { EnergyEstimate } from './types';

export interface EnergyCalculationParams {
  powerWatts: number;
  durationHours: number;
  emissionFactorKgPerKwh: number;
  serverCount?: number;
  pue?: number; // Power Usage Effectiveness (default 1.25 for modern data center)
}

/**
 * Calculates energy consumption and estimated carbon emissions
 * based on standard engineering formulas:
 * Energy (kWh) = Power (W) * Time (hours) / 1000
 * Emissions (kg CO2e) = Energy (kWh) * Emission factor (kg CO2e/kWh)
 */
export function calculateEnergyAndEmissions(params: EnergyCalculationParams): EnergyEstimate {
  const {
    powerWatts,
    durationHours,
    emissionFactorKgPerKwh,
    serverCount = 1,
    pue = 1.25,
  } = params;

  // Total IT + facility cooling power (PUE adjusted)
  const totalPowerWatts = powerWatts * serverCount * pue;
  const energyKwh = (totalPowerWatts * durationHours) / 1000;
  const carbonKgCo2e = energyKwh * emissionFactorKgPerKwh;

  return {
    powerWatts: totalPowerWatts,
    durationHours,
    energyKwh: Math.round(energyKwh * 100) / 100,
    carbonKgCo2e: Math.round(carbonKgCo2e * 100) / 100,
    emissionFactor: emissionFactorKgPerKwh,
    isSimulatedEstimate: true,
    limitations:
      'NOTICE: The current Arduino UNO hardware circuit does not feature an inline current transformer (CT) or digital power meter IC. All displayed kWh and carbon figures are deterministic model estimates calculated using server rack load specifications and national grid carbon emission factors.',
  };
}

export function generateEnergyTimeline(
  powerWatts: number,
  emissionFactor: number,
  points: number = 24
) {
  const data = [];
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000).toISOString();
    // Introduce realistic daylight / workload compute variation (+/- 10%)
    const variation = 1 + Math.sin(i * 0.3) * 0.08;
    const currentWatts = powerWatts * variation;
    const energyKwh = (currentWatts * 1) / 1000;
    const emissionsKg = energyKwh * emissionFactor;

    data.push({
      timestamp,
      powerWatts: Math.round(currentWatts),
      energyKwh: Math.round(energyKwh * 100) / 100,
      carbonKgCo2e: Math.round(emissionsKg * 100) / 100,
    });
  }

  return data;
}
