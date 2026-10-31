import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculateEnergyAndEmissions } from '@/lib/energy';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'readings';

  let csvContent = '';
  let filename = `serversense_${type}_${Date.now()}.csv`;

  if (type === 'readings') {
    const readings = store.getAllReadings();
    csvContent = 'ID,Timestamp,DeviceID,Temperature_C,Gas_ADC,Humidity_Percent,Source,Overall_Status\n';
    for (const r of readings) {
      csvContent += `"${r.id}","${r.timestamp}","${r.deviceId}",${r.temperatureC},${r.gasAdc},${r.humidityPercent},"${r.source}","${r.overallStatus}"\n`;
    }
  } else if (type === 'alerts') {
    const incidents = store.getIncidents();
    csvContent = 'ID,DeviceID,Sensor_Type,Severity,Measured_Value,Threshold,Message,First_Seen_At,Last_Seen_At,Status,Acknowledged_At,Resolved_At\n';
    for (const inc of incidents) {
      csvContent += `"${inc.id}","${inc.deviceId}","${inc.sensorType}","${inc.severity}",${inc.measuredValue},${inc.threshold},"${inc.message.replace(/"/g, '""')}","${inc.firstSeenAt}","${inc.lastSeenAt}","${inc.status}","${inc.acknowledgedAt || ''}","${inc.resolvedAt || ''}"\n`;
    }
  } else if (type === 'energy') {
    const settings = store.getSettings();
    const estimate = calculateEnergyAndEmissions({
      powerWatts: settings.powerRatingWatts,
      durationHours: 24,
      emissionFactorKgPerKwh: settings.gridEmissionFactorKgPerKwh,
    });
    csvContent = 'Metric,Value,Unit,Calculation_Method,Data_Source\n';
    csvContent += `Power_Rating,${estimate.powerWatts},Watts,"Configured Server Rack Load","Model Estimate"\n`;
    csvContent += `Duration,${estimate.durationHours},Hours,"Daily Window","Model Parameter"\n`;
    csvContent += `Energy_Consumption,${estimate.energyKwh},kWh,"P(W) * Time(h) / 1000","Calculated"\n`;
    csvContent += `Carbon_Emissions,${estimate.carbonKgCo2e},kg CO2e,"Energy(kWh) * Factor","Calculated"\n`;
    csvContent += `Grid_Emission_Factor,${estimate.emissionFactor},kg CO2e/kWh,"Regional Average Grid Intensity","Model Parameter"\n`;
    csvContent += `Disclaimer,"${estimate.limitations.replace(/"/g, '""')}","N/A","Engineering Notice","ServerSense AI"\n`;
  } else if (type === 'temperature') {
    const readings = store.getAllReadings();
    csvContent = 'Timestamp,Temperature_C,Warning_Threshold,Critical_Threshold,Status,Source\n';
    const settings = store.getSettings();
    for (const r of readings) {
      csvContent += `"${r.timestamp}",${r.temperatureC},${settings.temperatureWarning},${settings.temperatureCritical},"${r.overallStatus}","${r.source}"\n`;
    }
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
