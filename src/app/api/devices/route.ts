import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';

// GET all devices claimed by the user (for the Dashboard)
export async function GET() {
  try {
    await connectToDatabase();
    // In production, get this from NextAuth session
    const userId = "111111111111111111111111"; 
    const devices = await Device.find({ userId });
    return NextResponse.json({ devices }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

// POST to claim a new device
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { serialNumber, name } = await req.json();
    const userId = "111111111111111111111111"; // Dummy user ID for now

    // Check if device is already claimed by someone else
    const existingDevice = await Device.findOne({ serialNumber });
    if (existingDevice) {
      return NextResponse.json({ error: 'Device already claimed!' }, { status: 400 });
    }

    // Register the device to this user
    const newDevice = await Device.create({
      serialNumber,
      userId,
      name: name || 'Smart Sensor',
    });

    return NextResponse.json({ success: true, device: newDevice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to claim device' }, { status: 500 });
  }
}