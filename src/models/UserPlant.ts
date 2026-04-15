import mongoose, { Schema, Document, models, model } from 'mongoose';

// Define the TypeScript interface for strict typing
export interface IUserPlant extends Document {
  userId: mongoose.Types.ObjectId;   // Links to the User who owns it
  plantId: mongoose.Types.ObjectId;  // Links to the main catalog Plant (for image/species data)
  name: string;                      // The user's custom nickname for the plant
  sensorDeviceId?: string;           // The ESP32 device ID sending the data
  currentMoisture: number;           // Real-time moisture (0-100)
  idealMoisture: number;             // Target moisture before watering is needed
  nextWateringDate: Date;            // Calculated prediction
  lastSensorSync?: Date;             // Timestamp of the last ESP32 ping
}

// Define the Mongoose Schema
const UserPlantSchema = new Schema<IUserPlant>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  plantId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Plant', 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    default: 'My Plant'
  },
  sensorDeviceId: { 
    type: String, 
    sparse: true, // Allows null, but must be unique if it exists
    unique: true  
  },
  currentMoisture: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  idealMoisture: { 
    type: Number, 
    default: 60, // Default to 60%, can be adjusted based on plant species
  },
  nextWateringDate: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days from now
  },
  lastSensorSync: { 
    type: Date 
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Check if the model already exists to prevent Next.js hot-reloading errors
const UserPlant = models.UserPlant || model<IUserPlant>('UserPlant', UserPlantSchema);

export default UserPlant;