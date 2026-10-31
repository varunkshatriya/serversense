import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { SensorReadingInputSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const tickParam = searchParams.get('tick');

  // Trigger deterministic simulation progression if requested
  if (tickParam === 'true') {
    store.tickSimulation();
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 60;
  const readings = store.getReadings(isNaN(limit) ? 60 : limit);
  const stats = store.getStats();
  const settings = store.getSettings();

  return NextResponse.json({
    success: true,
    data: {
      readings,
      stats,
      settings,
      simulationRunning: store.isSimulationRunning(),
      scenario: store.getSimulationScenario(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate payload with Zod
    const validationResult = SensorReadingInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: Invalid sensor reading payload',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const validData = validationResult.data;

    // Reject stale or malformed timestamps if provided
    if (validData.timestamp) {
      const parsedTime = Date.parse(validData.timestamp);
      if (isNaN(parsedTime)) {
        return NextResponse.json(
          { success: false, error: 'Timestamp is invalid' },
          { status: 400 }
        );
      }
      // If timestamp is more than 5 minutes in future or 24 hours in past
      const delta = Math.abs(Date.now() - parsedTime);
      if (delta > 24 * 3600 * 1000) {
        return NextResponse.json(
          { success: false, error: 'Timestamp is too far out of range (>24h)' },
          { status: 400 }
        );
      }
    }

    const newReading = store.addReading({
      deviceId: validData.deviceId,
      temperatureC: validData.temperatureC,
      gasAdc: validData.gasAdc,
      humidityPercent: validData.humidityPercent,
      source: validData.source || 'hardware',
      timestamp: validData.timestamp,
    });

    return NextResponse.json({
      success: true,
      message: 'Sensor reading ingested successfully',
      reading: newReading,
      stats: store.getStats(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to process reading', message: errorMsg },
      { status: 500 }
    );
  }
}
