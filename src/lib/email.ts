import nodemailer from "nodemailer";

type OrderLineItem = {
  title: string;
  quantity: number;
  unitPrice: number;
};

type OrderEmailPayload = {
  userEmail: string;
  userName: string;
  orderId: string;
  total: number;
  items: OrderLineItem[];
};

function createTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    throw new Error(
      "Gmail credentials not configured. Set GMAIL_USER and GMAIL_PASSWORD in environment."
    );
  }

  return {
    gmailUser,
    transporter: nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    }),
  };
}

function renderOrderItems(items: OrderLineItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0;">${item.title}</td>
          <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; text-align: right;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");
}

async function sendEmail(subject: string, html: string, userEmail: string) {
  const { gmailUser, transporter } = createTransporter();
  await transporter.sendMail({
    from: gmailUser,
    to: userEmail,
    subject,
    html,
  });
}

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

  await sendEmail(`🌱 Watering Schedule Created for ${plantName}`, emailContent, userEmail);
}

/**
 * Send a watering reminder email
 */
export async function sendWateringReminderEmail(
  userEmail: string,
  userName: string,
  plantName: string
) {
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

  await sendEmail(`💧 Time to Water: ${plantName}`, emailContent, userEmail);
}

export async function sendOrderStatusUpdateEmail(
  payload: OrderEmailPayload & { statusLabel: string; note?: string }
) {
  const { userEmail, userName, orderId, total, items, statusLabel, note } = payload;
  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">Order update: ${statusLabel}</h1>
          </div>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your order <strong>#${orderId.slice(-8)}</strong> has been updated to <strong>${statusLabel}</strong>.</p>
          ${note ? `<p>${note}</p>` : ""}
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="border-bottom: 1px solid #e5e7eb; text-align: left;">
                <th style="padding: 8px 0;">Item</th>
                <th style="padding: 8px 0; text-align: center;">Qty</th>
                <th style="padding: 8px 0; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${renderOrderItems(items)}</tbody>
          </table>
          <p style="text-align: right; font-size: 18px; font-weight: 700;">Total: $${total.toFixed(2)}</p>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">GreenScape AR system notification</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail(`Order #${orderId.slice(-8)} updated to ${statusLabel}`, emailContent, userEmail);
}

export async function sendPaymentReceiptEmail(payload: OrderEmailPayload) {
  const { userEmail, userName, orderId, total, items } = payload;
  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0f766e; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">Payment successful</h1>
          </div>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>We received your payment for order <strong>#${orderId.slice(-8)}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="border-bottom: 1px solid #e5e7eb; text-align: left;">
                <th style="padding: 8px 0;">Item</th>
                <th style="padding: 8px 0; text-align: center;">Qty</th>
                <th style="padding: 8px 0; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${renderOrderItems(items)}</tbody>
          </table>
          <p style="text-align: right; font-size: 18px; font-weight: 700;">Paid: $${total.toFixed(2)}</p>
          <p style="margin-top: 24px; color: #666; font-size: 12px;">This email serves as your payment receipt.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail(`Payment receipt for order #${orderId.slice(-8)}`, emailContent, userEmail);
}

/**
 * Send a generic care reminder email (Fertilizing, Pruning, etc.)
 */
export async function sendCareReminderEmail(
  userEmail: string,
  userName: string,
  plantName: string,
  careType: "Fertilize" | "Prune" | "Seasonal Care"
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPassword },
  });

  // Assign colors and emojis based on the task
  const styles = {
    "Fertilize": { color: "#f59e0b", emoji: "🧪", text: "Time to feed" },
    "Prune": { color: "#8b5cf6", emoji: "✂️", text: "Time to trim" },
    "Seasonal Care": { color: "#ec4899", emoji: "🍂", text: "Seasonal checkup for" }
  };
  const style = styles[careType];

  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${style.color}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px;">${style.emoji} ${careType} Reminder</h1>
          </div>
          
          <p>Hi <strong>${userName}</strong>,</p>
          <p>${style.text} your <strong>${plantName}</strong>!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${style.color}; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;">Regular ${careType.toLowerCase()}ing ensures your plant grows strong and healthy. Log into your GreenScape dashboard to mark this task as complete!</p>
          </div>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px;">
            Best regards,<br/><strong>GreenScape AR Team</strong>
          </p>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: gmailUser,
    to: userEmail,
    subject: `${style.emoji} Time to ${careType}: ${plantName}`,
    html: emailContent,
  });
}

/**
 * Send an order confirmation and digital invoice
 */
export async function sendOrderConfirmationEmail(
  userEmail: string,
  userName: string,
  orderId: string,
  items: { name: string; quantity: number; price: number }[],
  totalAmount: number,
  paymentMethod: string // e.g., "Mock bKash" or "Mock Stripe"
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_PASSWORD;

  if (!gmailUser || !gmailPassword) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPassword },
  });

  // Generate the list of items for the email HTML
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} x${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const emailContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🧾 Payment Successful!</h1>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for your purchase! Your payment via <strong>${paymentMethod}</strong> was successful. We are getting your plants ready for shipment.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Invoice #${orderId.slice(-6).toUpperCase()}</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 12px 8px; font-weight: bold;">Total Paid</td>
                  <td style="padding: 12px 8px; font-weight: bold; text-align: right; color: #059669;">৳${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 14px; color: #666;">You can track your order status from your GreenScape dashboard.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"GreenScape AR" <${gmailUser}>`,
    to: userEmail,
    subject: `Receipt for Order #${orderId.slice(-6).toUpperCase()}`,
    html: emailContent,
  });
}