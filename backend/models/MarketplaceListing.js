import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyerName: { type: String, default: "" },
    price: { type: Number, required: true },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

const marketplaceListingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerName: { type: String, default: "" },

    type: {
      type: String,
      enum: ["game", "skin"],
      default: "game",
    },

    platform: {
      type: String,
      enum: ["PC", "Steam", "Epic", "PS", "Xbox", "Mobile"],
      default: "PC",
    },

    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    condition: {
      type: String,
      enum: ["new", "used", "gift", "account"],
      default: "new",
    },

    tags: { type: [String], default: [] },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["active", "sold", "delisted"],
      default: "active",
    },

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    buyerName: { type: String, default: "" },

    offers: { type: [offerSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("MarketplaceListing", marketplaceListingSchema);