// MongoDB connection and schema setup
import mongoose from "mongoose";

// Load MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI as string;

// Validate MongoDB URI is provided
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
    referralCode: {
      type: String,
      default: "",
      index: true,
    },
    referredByCode: {
      type: String,
      default: "",
    },
    referralXp: {
      type: Number,
      default: 0,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const AuthNonceSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

const SessionSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

const PlayerSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    packageId: {
      type: String,
      enum: ["builder", "trader", "finance"],
      required: true,
    },
    packageSnapshot: {
      id: { type: String, enum: ["builder", "trader", "finance"], required: true },
      badge: { type: String, required: true },
      rarityLabel: { type: String, required: true },
      title: { type: String, required: true },
      summary: { type: String, required: true },
      bonusPercent: { type: Number, required: true, default: 0 },
      starterAgentType: {
        type: String,
        enum: ["builder", "trader", "finance"],
        required: true,
      },
      starterAgentLabel: { type: String, required: true },
      officeTier: {
        type: String,
        enum: ["standard", "luxury", "ultra"],
        required: true,
      },
      officeLabel: { type: String, required: true },
      agentLimit: { type: Number, required: true },
      incomePerMinute: { type: Number, required: true },
      priceBand: { type: String, required: true },
      landCards: { type: Number, required: true },
      essenceCards: { type: Number, required: true },
      ethPrice: { type: String, required: true },
      pathUsdPrice: { type: String, required: true },
      detail: { type: String, required: true },
      guaranteedItems: { type: [String], default: [] },
    },
    agents: {
      type: [
        {
          id: { type: String, required: true },
          type: {
            type: String,
            enum: ["builder", "trader", "finance"],
            required: true,
          },
          incomePerMinute: { type: Number, required: true },
          createdAt: { type: Number, required: true },
          label: { type: String, required: true },
          rarity: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
      default: [],
    },
    agentPositions: {
      type: [
        {
          agentId: { type: String, required: true },
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
      ],
      default: [],
    },
    acquiredAt: {
      type: Number,
      required: true,
    },
    lastCollectedAt: {
      type: Number,
      required: true,
    },
    lifetimeCollected: {
      type: Number,
      required: true,
      default: 0,
    },
    purchaseTxHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purchasePaymentToken: {
      type: String,
      enum: ["pathusd", "usdc"],
      default: "pathusd",
    },
    marketPurchases: {
      type: [
        {
          itemType: {
            type: String,
            enum: ["agent", "slot"],
            required: true,
          },
          itemId: { type: String, required: true },
          pathUsdPrice: { type: String, required: true },
          paymentToken: {
            type: String,
            enum: ["pathusd", "usdc"],
            default: "pathusd",
          },
          txHash: { type: String, required: true },
          purchasedAt: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent redefining the model upon hot-reloads
export const Whitelist = mongoose.models.Whitelist || mongoose.model("Whitelist", WhitelistSchema);
export const AuthNonce = mongoose.models.AuthNonce || mongoose.model("AuthNonce", AuthNonceSchema);
export const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);
export const Player = mongoose.models.Player || mongoose.model("Player", PlayerSchema);

export default dbConnect;
