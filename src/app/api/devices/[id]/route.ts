import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';

// DELETE /api/devices/[id] -> Unclaim a device
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    // In production, verify the session userId matches the device's userId!
    const deviceId = params.id; 

    // Find the device and delete it entirely from the user's account
    const deletedDevice = await Device.findByIdAndDelete(deviceId);

    if (!deletedDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Now, that ESP32's hardcoded serial number is free in the database.
    // If another user buys it, they can successfully claim it!
    return NextResponse.json({ success: true, message: 'Device unclaimed successfully' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to unclaim device' }, { status: 500 });
  }
}