import nodemailer from "nodemailer";

/**
 * Send a watering schedule notification email to the user
 */
export async function sendWateringScheduleEmail(
  userEmail: string,
  userName: string,
  plantName: string,
  nextWateringDate: string,
  location: { lat: number; lng: number }
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    throw new Error("Gmail credentials not configured. Set GMAIL_USER and GMAIL_PASSWORD in environment.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🌱 Watering Schedule Created</h1>
          </div>
          
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>Your watering schedule for <strong>${plantName}</strong> has been created!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #10b981;">Schedule Details</h3>
            <p><strong>Plant:</strong> ${plantName}</p>
            <p><strong>Next Watering Date:</strong> ${new Date(nextWateringDate).toLocaleString()}</p>
            <p><strong>Location:</strong> Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}</p>
          </div>
          
          <p>You'll receive reminders when it's time to water your plant. Make sure your location settings are accurate for the best recommendations.</p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px;">
            Best regards,<br/>
            <strong>GreenScape AR Team</strong>
          </p>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: gmailUser,
    to: userEmail,
    subject: `🌱 Watering Schedule Created for ${plantName}`,
    html: emailContent,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send a watering reminder email
 */
export async function sendWateringReminderEmail(
  userEmail: string,
  userName: string,
  plantName: string
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    throw new Error("Gmail credentials not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">💧 Time to Water Your Plant!</h1>
          </div>
          
          <p>Hi <strong>${userName}</strong>,</p>
          
          <p>It's time to water your <strong>${plantName}</strong>!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;">Based on your location and the current weather conditions, your ${plantName} needs watering now to stay healthy.</p>
          </div>
          
          <p>Check the app for personalized care recommendations!</p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px;">
            Best regards,<br/>
            <strong>GreenScape AR Team</strong>
          </p>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: gmailUser,
    to: userEmail,
    subject: `💧 Time to Water: ${plantName}`,
    html: emailContent,
  };

  await transporter.sendMail(mailOptions);
}
