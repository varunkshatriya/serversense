import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { AlertIncidentUpdateSchema } from '@/lib/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = AlertIncidentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "acknowledge" or "resolve".' },
        { status: 400 }
      );
    }

    const { action } = validation.data;
    let updated = null;

    if (action === 'acknowledge') {
      updated = store.acknowledgeAlert(id);
    } else if (action === 'resolve') {
      updated = store.resolveAlert(id);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Incident ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Incident ${id} ${action}d successfully`,
      incident: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update alert incident', message: msg },
      { status: 500 }
    );
  }
}
