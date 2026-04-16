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
      { _id: plantId }, // Search by the 24-character ID
      { 
        sensorDeviceId: deviceId,
        currentMoisture: moistureLevel,
        lastSensorSync: new Date(),
        // We add some default fallback data just in case it needs to create a brand new entry
        $setOnInsert: {
          name: "ESP32 Test Plant",
          idealMoisture: 60,
          userId: "111111111111111111111111", // Dummy user ID for testing
          plantId: "222222222222222222222222"  // Dummy catalog ID for testing
        }
      },
      { new: true, upsert: true } // UPSERT is the magic word here!
    );

    // If moisture is dangerously low, you could trigger your notification logic here

    return NextResponse.json({ success: true, message: 'Sensor data logged' }, { status: 200 });
  } catch (error) {
    console.error('Sensor webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}