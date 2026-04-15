import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
// Assuming you have a model for tracking user plants/sensors
import UserPlant from '@/models/UserPlant'; 


export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { deviceId, moistureLevel, plantId } = data;

    if (!deviceId || moistureLevel === undefined) {
      return NextResponse.json({ error: 'Missing sensor data' }, { status: 400 });
    }

    await connectToDatabase();

    // Update the specific plant's current moisture level and last sync time
    await UserPlant.findOneAndUpdate(
      { _id: plantId, sensorDeviceId: deviceId },
      { 
        currentMoisture: moistureLevel,
        lastSensorSync: new Date()
      },
      { new: true }
    );

    // If moisture is dangerously low, you could trigger your notification logic here

    return NextResponse.json({ success: true, message: 'Sensor data logged' }, { status: 200 });
  } catch (error) {
    console.error('Sensor webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}