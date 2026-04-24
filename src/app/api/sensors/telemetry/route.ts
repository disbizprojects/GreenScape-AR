import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Device from '@/models/Device';
import UserPlant from '@/models/UserPlant';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    // The ESP32 sends its hardcoded serial number and the 4 metrics
    const { serialNumber, temp, humidity, light, moisture } = data;

    if (!serialNumber) {
      return NextResponse.json({ error: 'Unauthorized: No Serial Number' }, { status: 401 });
    }

    // 1. SECURITY CHECK: Does this device exist and belong to a user?
    const device = await Device.findOne({ serialNumber });
    if (!device) {
      // If it's not claimed, we reject the data!
      return NextResponse.json({ error: 'Device not registered to any account' }, { status: 403 });
    }

    // 2. Update the Device's environmental dashboard data
    device.telemetry = {
      temperature: temp,
      humidity: humidity,
      lightLevel: light,
      soilMoisture: moisture,
      lastUpdated: new Date()
    };
    await device.save();

    // 3. WATERING SCHEDULE LINK: Auto-sync moisture to the Watering Schedule
    // This finds the plant linked to this specific ESP32 and updates it. 
    // If it doesn't exist yet, 'upsert: true' automatically creates it!
    await UserPlant.findOneAndUpdate(
      { sensorDeviceId: serialNumber }, 
      {
        currentMoisture: moisture,
        lastSensorSync: new Date(),
        $setOnInsert: {
          name: `${device.name} (Auto-Linked)`,
          isManual: false,
          idealMoisture: 60,
          nextWateringDate: new Date(),
          userId: "111111111111111111111111", // Dummy user ID for testing
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'Telemetry securely logged' }, { status: 200 });
  } catch (error) {
    console.error('Telemetry Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}