import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const device = store.getDevice();
  const isConnected = store.isHardwareConnected();

  return NextResponse.json({
    success: true,
    data: {
      device,
      isConnected,
      guidance: {
        serialPortRecommended: 'COM3 (Windows) or /dev/ttyUSB0 (Linux/macOS)',
        baudRate: 9600,
        gatewayStatus: isConnected ? 'ACTIVE' : 'IDLE / LISTENING',
        lastPacket: device.lastSeenAt,
      },
    },
  });
}
