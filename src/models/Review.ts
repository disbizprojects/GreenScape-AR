import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IReview {
  userId: Types.ObjectId;
  plantId: Types.ObjectId;
  vendorId: Types.ObjectId;
  rating: number;
  comment?: string;
  photoUrls: string[];
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plantId: { type: Schema.Types.ObjectId, ref: "Plant", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    photoUrls: { type: [String], default: [] },
  },
  { timestamps: true }
);

ReviewSchema.index({ plantId: 1, userId: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
