import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';

// DELETE /api/devices/[id] -> Unclaim a device
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Update the type to a Promise
) {
  try {
    await connectToDatabase();
    
    // 2. Await the params before trying to read the ID
    const resolvedParams = await params;
    const deviceId = resolvedParams.id; 

    // Find the device and delete it entirely from the user's account
    const deletedDevice = await Device.findByIdAndDelete(deviceId);

    if (!deletedDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Device unclaimed successfully' }, { status: 200 });

  } catch (error) {
    console.error("Delete Device Error:", error);
    return NextResponse.json({ error: 'Failed to unclaim device' }, { status: 500 });
  }
}