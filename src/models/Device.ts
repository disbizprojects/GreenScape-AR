import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IDevice extends Document {
  serialNumber: string; // The unique ID burned into the ESP32 code
  userId: string;       // The user who claimed it
  name: string;         // e.g., "Living Room Sensor Hub"
  linkedPlantId?: mongoose.Types.ObjectId; // The specific plant it is currently watering
  telemetry: {
    temperature: number;
    humidity: number;
    lightLevel: number; // in lux
    soilMoisture: number;
    lastUpdated: Date;
  }
}

const DeviceSchema = new Schema<IDevice>({
  serialNumber: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, default: 'New Smart Sensor' },
  linkedPlantId: { type: Schema.Types.ObjectId, ref: 'UserPlant' },
  telemetry: {
    temperature: { type: Number, default: 0 },
    humidity: { type: Number, default: 0 },
    lightLevel: { type: Number, default: 0 },
    soilMoisture: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, { timestamps: true });

const Device = models.Device || model<IDevice>('Device', DeviceSchema);
export default Device;