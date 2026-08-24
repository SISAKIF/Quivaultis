import mongoose from "mongoose";

const marketplaceTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    kind: {
      type: String,
      enum: ["Purchase", "Sale", "Offer"],
      required: true,
    },

    title: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("MarketplaceTransaction", marketplaceTransactionSchema);