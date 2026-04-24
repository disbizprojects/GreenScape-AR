import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Order from '@/models/Order'; 
import User from '@/models/User';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { userId, items, totalAmount, paymentMethod, shippingAddress } = body;

    // 1. Format the cart items to perfectly match your IOrderItem schema
    const formattedItems = items.map((item: any) => ({
      plantId: item.plantId,
      title: item.name,        // Maps 'name' to 'title'
      quantity: item.quantity,
      unitPrice: item.price    // Maps 'price' to 'unitPrice'
    }));

    // 2. Save the Order to the Database using your exact schema fields
    const newOrder = await Order.create({
      userId,
      items: formattedItems,
      total: totalAmount,             // Schema uses 'total'
      status: 'ORDER_CONFIRMED',      // Must match your OrderStatus Enum
      paymentStatus: 'PAID',          // Must match your PaymentStatus Enum
      shippingAddress: { addressText: shippingAddress }, // Schema expects an Object (Mixed)
      tracking: [{
        status: 'ORDER_CONFIRMED',
        note: `Payment completed via ${paymentMethod}`,
        at: new Date()
      }]
    });

    // 3. Fetch the User's email to send the receipt
    const user = await User.findById(userId);
    
    if (user && user.email) {
      sendOrderConfirmationEmail(
        user.email,
        user.name || "Plant Lover",
        newOrder._id.toString(),
        items, // The email template still uses the original { name, price } structure
        totalAmount,
        paymentMethod
      ).catch(err => console.error("Failed to send receipt:", err));
    }

    // 4. Empty the user's cart (Assuming you have a Cart model to clear, optional step)
    // await Cart.findOneAndDelete({ userId }); 

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