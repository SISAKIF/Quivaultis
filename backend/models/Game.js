import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    studio: {
      type: String,
      default: "",
      trim: true,
    },

    genre: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      default: "PC",
      trim: true,
    },

    playtime: {
      type: String,
      default: "Medium",
      trim: true,
    },

    basePrice: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 4.5,
    },

    difficulty: {
      type: String,
      default: "Medium",
      trim: true,
    },

    stock: {
      type: Number,
      default: 10,
    },

    sold: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    moodTags: {
      type: [String],
      default: [],
    },

    colors: {
      type: [String],
      default: ["#06b6d4", "#7c3aed"],
    },
  },
  {
    timestamps: true,
  }
);

const Game = mongoose.model("Game", gameSchema);

export default Game;