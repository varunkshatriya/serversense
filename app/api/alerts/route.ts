import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const incidents = store.getIncidents();
  const activeAlerts = store.getActiveAlerts();
  const criticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'WARNING').length;

  return NextResponse.json({
    success: true,
    data: {
      incidents,
      activeAlerts,
      summary: {
        totalIncidents: incidents.length,
        activeCount: activeAlerts.length,
        criticalCount,
        warningCount,
      },
    },
  });
}
