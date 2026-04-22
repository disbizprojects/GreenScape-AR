import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendWateringReminderEmail } from "@/lib/email";
import { addDays } from "date-fns";

export async function GET() {
  await connectDB();
  const now = new Date();

  const users = await User.find({ "carePlans.nextWaterAt": { $lte: now } });

  for (const user of users) {
    for (const plan of user.carePlans) {
      if (plan.nextWaterAt <= now) {
        try {
          await sendWateringReminderEmail(user.email, user.name || "Plant Lover", plan.plantName);
          plan.nextWaterAt = addDays(now, plan.frequencyDays);
          plan.lastWateredAt = now;
        } catch (error) {
          console.error("Reminder email failed:", error);
        }
      }
    }
    await user.save();
  }

  return NextResponse.json({ processed: users.length });
}