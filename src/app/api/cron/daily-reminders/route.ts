import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import UserPlant from '@/models/UserPlant';
import User from '@/models/User'; // Assuming you have a User model with { email, name }
import { sendWateringReminderEmail, sendCareReminderEmail } from '@/lib/email';

export async function GET(req: Request) {
  try {
    // SECURITY: Ensure this route is only triggered by Vercel's secure Cron system
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();
    const now = new Date();

    // Find all plants where ANY task is overdue AND we haven't sent an email in the last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const plantsOverdue = await UserPlant.find({
      $or: [
        // Manual watering overdue
        { isManual: true, nextWateringDate: { $lte: now }, 'remindersSent.watering': { $not: { $gte: yesterday } } },
        // ESP32 Plant dangerously dry (current moisture is 15% below ideal)
        { isManual: false, $expr: { $lt: ["$currentMoisture", { $subtract: ["$idealMoisture", 15] }] }, 'remindersSent.watering': { $not: { $gte: yesterday } } },
        // Fertilizing overdue
        { nextFertilizingDate: { $lte: now }, 'remindersSent.fertilizing': { $not: { $gte: yesterday } } },
        // Pruning overdue
        { nextPruningDate: { $lte: now }, 'remindersSent.pruning': { $not: { $gte: yesterday } } }
      ]
    });

    let emailsSent = 0;

    for (const plant of plantsOverdue) {
      // Find the user to get their email address
      const user = await User.findById(plant.userId);
      if (!user) continue;

      // 1. Check Watering (Manual OR ESP32)
      const needsManualWater = plant.isManual && plant.nextWateringDate <= now;
      const needsESP32Water = !plant.isManual && plant.currentMoisture < (plant.idealMoisture - 15);
      
      if ((needsManualWater || needsESP32Water) && (!plant.remindersSent?.watering || plant.remindersSent.watering < yesterday)) {
        await sendWateringReminderEmail(user.email, user.name || "Plant Parent", plant.name);
        plant.remindersSent = { ...plant.remindersSent, watering: now };
        emailsSent++;
      }

      // 2. Check Fertilizing
      if (plant.nextFertilizingDate && plant.nextFertilizingDate <= now && (!plant.remindersSent?.fertilizing || plant.remindersSent.fertilizing < yesterday)) {
        await sendCareReminderEmail(user.email, user.name || "Plant Parent", plant.name, "Fertilize");
        plant.remindersSent = { ...plant.remindersSent, fertilizing: now };
        emailsSent++;
      }

      // 3. Check Pruning
      if (plant.nextPruningDate && plant.nextPruningDate <= now && (!plant.remindersSent?.pruning || plant.remindersSent.pruning < yesterday)) {
        await sendCareReminderEmail(user.email, user.name || "Plant Parent", plant.name, "Prune");
        plant.remindersSent = { ...plant.remindersSent, pruning: now };
        emailsSent++;
      }

      await plant.save(); // Save the updated reminder timestamps
    }

    return NextResponse.json({ success: true, processed: plantsOverdue.length, emailsSent });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}