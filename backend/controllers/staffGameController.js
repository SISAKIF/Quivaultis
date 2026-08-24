import Game from "../models/Game.js";

const staffOnly = (req, res) => {
  if (req.user.role !== "staff" && req.user.role !== "admin") {
    res.status(403).json({ message: "Staff only" });
    return false;
  }
  return true;
};

export const getStaffGames = async (req, res) => {
  try {
    if (!staffOnly(req, res)) return;

    const games = await Game.find().sort({ createdAt: -1 });
    res.status(200).json(games);
  } catch (error) {
    res.status(500).json({ message: "Failed to load games", error: error.message });
  }
};

export const createStaffGame = async (req, res) => {
  try {
    if (!staffOnly(req, res)) return;

    const {
      title,
      studio,
      genre,
      platform,
      playtime,
      basePrice,
      discount,
      rating,
      difficulty,
      stock,
      sold,
      image,
      description,
      tags,
      moodTags,
    } = req.body;

    if (!title || !genre || !basePrice) {
      return res.status(400).json({ message: "Title, genre and price are required" });
    }

    const game = await Game.create({
      title,
      studio,
      genre,
      platform,
      playtime,
      basePrice: Number(basePrice),
      discount: Number(discount || 0),
      rating: Number(rating || 4.5),
      difficulty,
      stock: Number(stock || 0),
      sold: Number(sold || 0),
      image: image || "",
      description,
      tags: Array.isArray(tags) ? tags : [],
      moodTags: Array.isArray(moodTags) ? moodTags : [],
    });

    res.status(201).json({ message: "Game created", game });
  } catch (error) {
    res.status(500).json({ message: "Failed to create game", error: error.message });
  }
};

export const updateStaffGame = async (req, res) => {
  try {
    if (!staffOnly(req, res)) return;

    const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.status(200).json({ message: "Game updated", game });
  } catch (error) {
    res.status(500).json({ message: "Failed to update game", error: error.message });
  }
};

export const deleteStaffGame = async (req, res) => {
  try {
    if (!staffOnly(req, res)) return;

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    await game.deleteOne();

    res.status(200).json({ message: "Game deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete game", error: error.message });
  }
};

export const updateStaffGameStock = async (req, res) => {
  try {
    if (!staffOnly(req, res)) return;

    const { stock, sold, discount } = req.body;

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (stock !== undefined) game.stock = Number(stock);
    if (sold !== undefined) game.sold = Number(sold);
    if (discount !== undefined) game.discount = Number(discount);

    await game.save();

    res.status(200).json({ message: "Game stock updated", game });
  } catch (error) {
    res.status(500).json({ message: "Failed to update stock", error: error.message });
  }
};