import mongoose from "mongoose";

const marketplaceInventorySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

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

    condition: {
      type: String,
      enum: ["new", "used", "gift", "account"],
      default: "used",
    },

    tags: { type: [String], default: [] },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("MarketplaceInventory", marketplaceInventorySchema);