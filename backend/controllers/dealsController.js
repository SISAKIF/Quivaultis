import Game from "../models/Game.js";
import WatchedDeal from "../models/WatchedDeal.js";

export const getDeals = async (req, res) => {
  try {
    const games = await Game.find({ discount: { $gt: 0 } }).sort({
      discount: -1,
      rating: -1,
    });

    return res.status(200).json(games);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load deals",
      error: error.message,
    });
  }
};

export const getWatchedDeals = async (req, res) => {
  try {
    const watched = await WatchedDeal.find({ user: req.user.id })
      .populate("game")
      .sort({ createdAt: -1 });

    return res.status(200).json(watched);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load watched deals",
      error: error.message,
    });
  }
};

export const toggleWatchDeal = async (req, res) => {
  try {
    const { gameId } = req.body;

    if (!gameId) {
      return res.status(400).json({ message: "Game ID is required" });
    }

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    const existing = await WatchedDeal.findOne({
      user: req.user.id,
      game: gameId,
    });

    if (existing) {
      await WatchedDeal.findByIdAndDelete(existing._id);

      return res.status(200).json({
        message: "Removed from watched deals",
        watched: false,
      });
    }

    const watched = await WatchedDeal.create({
      user: req.user.id,
      game: gameId,
    });

    return res.status(201).json({
      message: "Added to watched deals",
      watched: true,
      item: watched,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update watched deal",
      error: error.message,
    });
  }
};

export const clearWatchedDeals = async (req, res) => {
  try {
    await WatchedDeal.deleteMany({ user: req.user.id });

    return res.status(200).json({
      message: "Watched deals cleared",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to clear watched deals",
      error: error.message,
    });
  }
};