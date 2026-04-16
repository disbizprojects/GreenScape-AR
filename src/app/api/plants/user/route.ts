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