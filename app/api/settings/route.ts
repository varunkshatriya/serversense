import { NextRequest, NextResponse } from 'next/server';
import { store, DEFAULT_SETTINGS } from '@/lib/store';
import { MonitoringSettingsSchema } from '@/lib/validation';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: store.getSettings(),
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'restore_defaults') {
      const restored = store.updateSettings(DEFAULT_SETTINGS);
      return NextResponse.json({
        success: true,
        message: 'Settings restored to factory defaults',
        data: restored,
      });
    }

    const validation = MonitoringSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: Invalid settings configuration',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const updated = store.updateSettings(validation.data);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update settings', message: msg },
      { status: 500 }
    );
  }
}
