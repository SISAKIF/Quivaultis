import mongoose from "mongoose";
import CommunityReview from "../models/CommunityReview.js";
import Game from "../models/Game.js";
import User from "../models/User.js";

const isSameId = (a, b) => String(a) === String(b);

const normalizeReview = (review) => {
  return {
    id: review._id,
    _id: review._id,
    gameId: review.game,
    gameName: review.gameName,
    userId: review.user,
    userName: review.userName,
    rating: review.rating,
    text: review.text,
    helpful: review.helpful || [],
    reactions: review.reactions || {
      fire: [],
      angry: [],
      sad: [],
      mind: [],
    },
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    editedAt: review.editedAt,
  };
};

export const getCommunityReviews = async (req, res) => {
  try {
    const reviews = await CommunityReview.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(reviews.map(normalizeReview));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load community reviews",
      error: error.message,
    });
  }
};

export const createCommunityReview = async (req, res) => {
  try {
    const { gameId, rating, text } = req.body;

    if (!gameId || !rating || !text) {
      return res.status(400).json({
        message: "Game, rating and review text are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({
        message: "Invalid game ID",
      });
    }

    const cleanText = String(text).trim();

    if (cleanText.length < 10) {
      return res.status(400).json({
        message: "Review must be at least 10 characters",
      });
    }

    if (cleanText.length > 400) {
      return res.status(400).json({
        message: "Review cannot be more than 400 characters",
      });
    }

    const cleanRating = Number(rating);

    if (cleanRating < 1 || cleanRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const ownsGame = user.ownedGames.some((ownedGameId) =>
      isSameId(ownedGameId, gameId)
    );

    if (!ownsGame) {
      return res.status(403).json({
        message: "You can only review games you own",
      });
    }

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        message: "Game not found",
      });
    }

    const existingReview = await CommunityReview.findOne({
      user: req.user.id,
      game: gameId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You already reviewed this game. Please edit your old review.",
      });
    }

    const review = await CommunityReview.create({
      game: game._id,
      gameName: game.title,
      user: user._id,
      userName: user.username,
      rating: cleanRating,
      text: cleanText,
      helpful: [],
      reactions: {
        fire: [],
        angry: [],
        sad: [],
        mind: [],
      },
    });

    return res.status(201).json({
      message: "Review posted successfully",
      review: normalizeReview(review),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create community review",
      error: error.message,
    });
  }
};

export const updateCommunityReview = async (req, res) => {
  try {
    const { gameId, rating, text } = req.body;

    const review = await CommunityReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (!isSameId(review.user, req.user.id)) {
      return res.status(403).json({
        message: "You can only edit your own review",
      });
    }

    if (!gameId || !rating || !text) {
      return res.status(400).json({
        message: "Game, rating and review text are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({
        message: "Invalid game ID",
      });
    }

    const cleanText = String(text).trim();

    if (cleanText.length < 10) {
      return res.status(400).json({
        message: "Review must be at least 10 characters",
      });
    }

    if (cleanText.length > 400) {
      return res.status(400).json({
        message: "Review cannot be more than 400 characters",
      });
    }

    const cleanRating = Number(rating);

    if (cleanRating < 1 || cleanRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const user = await User.findById(req.user.id);

    const ownsGame = user.ownedGames.some((ownedGameId) =>
      isSameId(ownedGameId, gameId)
    );

    if (!ownsGame) {
      return res.status(403).json({
        message: "You can only review games you own",
      });
    }

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({
        message: "Game not found",
      });
    }

    review.game = game._id;
    review.gameName = game.title;
    review.rating = cleanRating;
    review.text = cleanText;
    review.editedAt = new Date();

    await review.save();

    return res.status(200).json({
      message: "Review updated successfully",
      review: normalizeReview(review),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update community review",
      error: error.message,
    });
  }
};

export const deleteCommunityReview = async (req, res) => {
  try {
    const review = await CommunityReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (!isSameId(review.user, req.user.id)) {
      return res.status(403).json({
        message: "You can only delete your own review",
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete community review",
      error: error.message,
    });
  }
};

export const toggleHelpfulReview = async (req, res) => {
  try {
    const review = await CommunityReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    const userId = req.user.id;
    const alreadyHelpful = review.helpful.some((id) => isSameId(id, userId));

    if (alreadyHelpful) {
      review.helpful = review.helpful.filter((id) => !isSameId(id, userId));
    } else {
      review.helpful.push(userId);
    }

    await review.save();

    return res.status(200).json({
      message: alreadyHelpful ? "Helpful removed" : "Marked as helpful",
      review: normalizeReview(review),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update helpful status",
      error: error.message,
    });
  }
};

export const toggleReactionReview = async (req, res) => {
  try {
    const { type } = req.body;

    if (!["fire", "angry", "sad", "mind"].includes(type)) {
      return res.status(400).json({
        message: "Invalid reaction type",
      });
    }

    const review = await CommunityReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (!review.reactions) {
      review.reactions = {
        fire: [],
        angry: [],
        sad: [],
        mind: [],
      };
    }

    const userId = req.user.id;
    const currentList = review.reactions[type] || [];
    const alreadyReacted = currentList.some((id) => isSameId(id, userId));

    if (alreadyReacted) {
      review.reactions[type] = currentList.filter(
        (id) => !isSameId(id, userId)
      );
    } else {
      review.reactions[type].push(userId);
    }

    await review.save();

    return res.status(200).json({
      message: alreadyReacted ? "Reaction removed" : "Reaction added",
      review: normalizeReview(review),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update reaction",
      error: error.message,
    });
  }
};