import mongoose from "mongoose";

const moodPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    likes: {
      genres: {
        type: Map,
        of: Number,
        default: {},
      },
      tags: {
        type: Map,
        of: Number,
        default: {},
      },
    },

    dislikes: {
      genres: {
        type: Map,
        of: Number,
        default: {},
      },
      tags: {
        type: Map,
        of: Number,
        default: {},
      },
    },

    played: [
      {
        game: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Game",
        },
        playedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    notForMeGames: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game",
      },
    ],

    moodHistory: [
      {
        arch: String,
        mood: Object,
        pref: Object,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("MoodPreference", moodPreferenceSchema);