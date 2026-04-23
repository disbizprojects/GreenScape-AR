import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
// Assuming you have an Order model and User model
import Order from '@/models/Order'; 
import User from '@/models/User';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // 1. Get the cart data from the frontend
    const body = await req.json();
    const { userId, items, totalAmount, paymentMethod, shippingAddress } = body;

    // 2. Process the "Mock" Payment
    // (In the future, you will put your bKash/Stripe server-side verification here)
    const paymentStatus = "Completed"; 
    const transactionId = `MOCK_TXN_${Date.now()}`;

    // 3. Save the Order to the Database
    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      paymentMethod,
      transactionId,
      status: 'Processing',
      shippingAddress,
    });

    // 4. Fetch the User's email to send the receipt
    const user = await User.findById(userId);
    
    if (user && user.email) {
      // 5. Fire off the email! (We don't await this so the API responds faster)
      sendOrderConfirmationEmail(
        user.email,
        user.name || "Plant Lover",
        newOrder._id.toString(),
        items,
        totalAmount,
        paymentMethod
      ).catch(err => console.error("Failed to send receipt:", err));
    }

    // 6. Return success to the frontend
    return NextResponse.json({ 
      success: true, 
      message: 'Payment successful!',
      orderId: newOrder._id 
    }, { status: 201 });

  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}