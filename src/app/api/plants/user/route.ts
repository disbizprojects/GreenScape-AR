import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import UserPlant from '@/models/UserPlant';

export async function GET() {
  try {
    // 1. Connect to the database
    await connectToDatabase();

    // 2. Fetch the user's plants. 
    // Note: If you have NextAuth fully set up, you would get the session here 
    // and filter by { userId: session.user.id }. For now, we will fetch all.
    const plants = await UserPlant.find({}).sort({ createdAt: -1 });

    // 3. Return the data as proper JSON
    return NextResponse.json({ plants }, { status: 200 });

  } catch (error) {
    console.error('Error fetching user plants:', error);
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 });
  }
}

// CREATE A NEW MANUAL PLANT
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const newPlant = await UserPlant.create({
      name: body.name,
      isManual: true,
      waterAmount: body.waterAmount,
      frequencyDays: Number(body.frequencyDays),
      // Set the first watering date to right now, or in the future
      nextWateringDate: new Date(Date.now() + Number(body.frequencyDays) * 24 * 60 * 60 * 1000),
      userId: "111111111111111111111111", // Dummy user ID for testing
    });

    return NextResponse.json({ success: true, plant: newPlant }, { status: 201 });
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json({ error: 'Failed to create plant' }, { status: 500 });
  }
}

// RESET THE COUNTDOWN TIMER (MARK AS WATERED)
export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { plantId, frequencyDays } = await req.json();

    // Calculate the next watering date based on their custom frequency
    const nextDate = new Date(Date.now() + frequencyDays * 24 * 60 * 60 * 1000);

    await UserPlant.findByIdAndUpdate(plantId, {
      nextWateringDate: nextDate
    });

    return NextResponse.json({ success: true, nextWateringDate: nextDate }, { status: 200 });
  } catch (error) {
    console.error('Error updating plant:', error);
    return NextResponse.json({ error: 'Failed to update plant' }, { status: 500 });
  }
}