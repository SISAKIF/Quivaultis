import mongoose from "mongoose";

const watchedDealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

watchedDealSchema.index({ user: 1, game: 1 }, { unique: true });

const WatchedDeal = mongoose.model("WatchedDeal", watchedDealSchema);

export default WatchedDeal;