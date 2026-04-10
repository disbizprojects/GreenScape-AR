import mongoose, { Schema, type Model, type Types } from "mongoose";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "ORDER_CONFIRMED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED";

export interface IOrderItem {
  plantId: Types.ObjectId;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface ITrackingEvent {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  shippingAddress: Record<string, unknown>;
  tracking: ITrackingEvent[];
  vendorNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: "Plant", required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const TrackingSchema = new Schema<ITrackingEvent>(
  {
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "ORDER_CONFIRMED",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      required: true,
    },
    at: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "ORDER_CONFIRMED",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING_PAYMENT",
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "FAILED"],
      default: "UNPAID",
    },
    stripeSessionId: String,
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    tracking: { type: [TrackingSchema], default: [] },
    vendorNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
