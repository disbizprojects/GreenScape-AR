const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["CUSTOMER", "VENDOR", "ADMIN"],
      default: "CUSTOMER",
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  const email = (process.env.ADMIN_EMAIL || "admin@greenscape.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Demo12345!";
  const name = process.env.ADMIN_NAME || "GreenScape Admin";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(mongoUri);

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      email,
      passwordHash,
      name,
      role: "ADMIN",
    });
    console.log(`Created admin account: ${email}`);
  } else {
    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.role = "ADMIN";
    await existing.save();
    console.log(`Updated admin account: ${email}`);
  }

  await mongoose.disconnect();
}

main()
  .catch(async (err) => {
    console.error("Failed to create admin:", err.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors.
    }
    process.exit(1);
  });
