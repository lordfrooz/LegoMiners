// MongoDB connection and schema setup
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

declare global {
  var mongoose: any;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Whitelist Schema Definition
const WhitelistSchema = new mongoose.Schema(
  {
    twitterHandle: {
      type: String,
      required: true,
      unique: true,
    },
    walletAddress: {
      type: String,
      default: "",
    },
    completedTasks: {
      type: [String],
      default: [],
    },
    whitelistStep: {
      type: String,
      enum: ["twitter", "wallet", "tasks"],
      default: "twitter",
    },
    isWhitelistSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent redefining the model upon hot-reloads
export const Whitelist = mongoose.models.Whitelist || mongoose.model("Whitelist", WhitelistSchema);

export default dbConnect;
