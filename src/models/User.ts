import mongoose, { Schema, type Model, type Types } from "mongoose";

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

export interface IAddress {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface IVendorProfile {
  businessName: string;
  description?: string;
  verified: boolean;
  submittedAt?: Date;
}

export interface ICarePlan {
  plantId: Types.ObjectId;
  plantName: string;
  frequencyDays: number;
  nextWaterAt: Date;
  lastWateredAt?: Date;
}

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  image?: string;
  addresses: IAddress[];
  favoritePlantIds: Types.ObjectId[];
  vendorProfile?: IVendorProfile;
  carePlans: ICarePlan[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const VendorProfileSchema = new Schema<IVendorProfile>(
  {
    businessName: { type: String, required: true },
    description: String,
    verified: { type: Boolean, default: false },
    submittedAt: Date,
  },
  { _id: false }
);

const CarePlanSchema = new Schema<ICarePlan>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: "Plant", required: true },
    plantName: { type: String, required: true },
    frequencyDays: { type: Number, required: true },
    nextWaterAt: { type: Date, required: true },
    lastWateredAt: Date,
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["CUSTOMER", "VENDOR", "ADMIN"],
      default: "CUSTOMER",
    },
    image: String,
    addresses: { type: [AddressSchema], default: [] },
    favoritePlantIds: [{ type: Schema.Types.ObjectId, ref: "Plant" }],
    vendorProfile: VendorProfileSchema,
    carePlans: { type: [CarePlanSchema], default: [] },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
