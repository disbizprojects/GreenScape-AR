import mongoose, { Schema, type Model, type Types } from "mongoose";

export type SunlightNeed = "FULL_SUN" | "PARTIAL_SHADE" | "FULL_SHADE";

export interface IPlant {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrls: string[];
  /** glTF / GLB URL for AR and 3D preview */
  modelUrl: string;
  sunlightRequirement: SunlightNeed;
  tempMinC: number;
  tempMaxC: number;
  idealHumidityPct: number;
  waterFrequencyDays: number;
  /** Approximate scale factor per year for growth simulation (visual) */
  growthScalePerYear: number;
  category: string;
  co2KgPerYearEstimate: number;
  vendorId: Types.ObjectId;
  active: boolean;
  careTips?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlantSchema = new Schema<IPlant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    imageUrls: { type: [String], default: [] },
    modelUrl: { type: String, required: true },
    sunlightRequirement: {
      type: String,
      enum: ["FULL_SUN", "PARTIAL_SHADE", "FULL_SHADE"],
      required: true,
    },
    tempMinC: { type: Number, required: true },
    tempMaxC: { type: Number, required: true },
    idealHumidityPct: { type: Number, required: true },
    waterFrequencyDays: { type: Number, required: true, min: 1 },
    growthScalePerYear: { type: Number, default: 0.08 },
    category: { type: String, required: true },
    co2KgPerYearEstimate: { type: Number, default: 5 },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true },
    careTips: String,
  },
  { timestamps: true }
);

PlantSchema.index({ name: "text", description: "text", category: "text" });

const Plant: Model<IPlant> =
  mongoose.models.Plant || mongoose.model<IPlant>("Plant", PlantSchema);

export default Plant;
