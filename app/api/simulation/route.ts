import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { z } from 'zod';

const SimulationControlSchema = z.object({
  action: z.enum(['start', 'pause', 'reset', 'scenario']),
  scenario: z.enum(['normal', 'heatwave_hvac', 'gas_leak', 'humidity_drift']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SimulationControlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid simulation control payload', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { action, scenario } = validation.data;

    switch (action) {
      case 'start':
        store.setSimulationRunning(true);
        break;
      case 'pause':
        store.setSimulationRunning(false);
        break;
      case 'reset':
        store.resetSimulation();
        break;
      case 'scenario':
        if (scenario) {
          store.setSimulationScenario(scenario);
        }
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Simulation ${action} executed`,
      data: {
        isRunning: store.isSimulationRunning(),
        scenario: store.getSimulationScenario(),
        stats: store.getStats(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
