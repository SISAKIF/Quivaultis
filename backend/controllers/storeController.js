import Game from "../models/Game.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
const defaultGames = [
  { title: "Cyberpunk 2077", genre: "RPG", playtime: "Long", basePrice: 59.99, discount: 35, rating: 4.8, difficulty: "Medium", description: "Futuristic open-world RPG with hacking and combat.", tags: ["Open World", "Sci-Fi", "Story Rich", "Action RPG"], moodTags: ["story", "adventure", "energy"], colors: ["#00d4ff", "#0f766e"] },
  { title: "God of War", genre: "Action", playtime: "Medium", basePrice: 49.99, discount: 20, rating: 4.9, difficulty: "Medium", description: "Cinematic action adventure with Kratos and Atreus.", tags: ["Action", "Adventure", "Story Rich"], moodTags: ["story", "challenge", "adventure"], colors: ["#ef4444", "#7c2d12"] },
  { title: "God of War Ragnarök", genre: "Action", playtime: "Long", basePrice: 69.99, discount: 15, rating: 4.9, difficulty: "Medium", description: "Epic Norse mythology combat and boss fights.", tags: ["Action", "Mythology", "Story Rich"], moodTags: ["story", "challenge", "adventure"], colors: ["#38bdf8", "#1d4ed8"] },
  { title: "Clair Obscur: Expedition 33", genre: "RPG", playtime: "Long", basePrice: 59.99, discount: 10, rating: 4.8, difficulty: "Medium", description: "Stylish turn-based RPG with mystery and tactics.", tags: ["Turn-Based", "Fantasy", "Party RPG"], moodTags: ["story", "brain", "focus"], colors: ["#f59e0b", "#9333ea"] },
  { title: "Elden Ring", genre: "RPG", playtime: "Long", basePrice: 59.99, discount: 25, rating: 4.9, difficulty: "Hard", description: "Dark fantasy RPG with exploration and challenge.", tags: ["Soulslike", "Fantasy", "Open World"], moodTags: ["challenge", "adventure", "hard"], colors: ["#a3e635", "#14532d"] },
  { title: "Resident Evil 4", genre: "Horror", playtime: "Medium", basePrice: 49.99, discount: 22, rating: 4.8, difficulty: "Medium", description: "Survival horror with tense combat and atmosphere.", tags: ["Horror", "Survival", "Action", "Story"], moodTags: ["horror", "stress", "story"], colors: ["#6b7280", "#111827"] },
  { title: "Forza Horizon 5", genre: "Racing", playtime: "Short", basePrice: 39.99, discount: 30, rating: 4.7, difficulty: "Easy", description: "Fast racing game with cars and open-world driving.", tags: ["Racing", "Cars", "Arcade", "Open World"], moodTags: ["energy", "relaxed", "competitive"], colors: ["#f97316", "#ea580c"] },
  { title: "Baldur's Gate 3", genre: "RPG", playtime: "Long", basePrice: 59.99, discount: 5, rating: 4.9, difficulty: "Medium", description: "Deep party RPG with choices, story, and tactics.", tags: ["RPG", "Turn-Based", "Party", "Story Rich"], moodTags: ["story", "brain", "focus"], colors: ["#8b5cf6", "#1e1b4b"] },
  { title: "DOOM Eternal", genre: "Shooter", playtime: "Short", basePrice: 29.99, discount: 45, rating: 4.8, difficulty: "Hard", description: "Fast aggressive shooter with intense combat.", tags: ["Shooter", "Fast-Paced", "FPS", "Action"], moodTags: ["energy", "challenge", "competitive"], colors: ["#ef4444", "#111827"] },
  { title: "Minecraft", genre: "Creative", playtime: "Long", basePrice: 29.99, discount: 10, rating: 4.7, difficulty: "Easy", description: "Creative sandbox game for building and exploring.", tags: ["Creative", "Sandbox", "Build", "Relaxed"], moodTags: ["creative", "relaxed"], colors: ["#22c55e", "#14532d"] },
  { title: "Portal 2", genre: "Puzzle", playtime: "Short", basePrice: 19.99, discount: 50, rating: 4.9, difficulty: "Medium", description: "Puzzle game based on logic, portals, and creativity.", tags: ["Puzzle", "Brain", "Funny", "Co-op"], moodTags: ["brain", "focus", "coop"], colors: ["#38bdf8", "#1d4ed8"] },
  { title: "Stardew Valley", genre: "Simulation", playtime: "Long", basePrice: 14.99, discount: 20, rating: 4.8, difficulty: "Easy", description: "Relaxing farming, crafting, fishing, and village life.", tags: ["Cozy", "Farming", "Relaxed", "Creative"], moodTags: ["relaxed", "creative"], colors: ["#84cc16", "#166534"] },
  { title: "It Takes Two", genre: "Adventure", playtime: "Medium", basePrice: 39.99, discount: 35, rating: 4.8, difficulty: "Easy", description: "Co-op adventure built around teamwork and fun puzzles.", tags: ["Co-op", "Adventure", "Puzzle", "Funny"], moodTags: ["coop", "creative", "relaxed"], colors: ["#ec4899", "#7e22ce"] },
  { title: "Sekiro: Shadows Die Twice", genre: "Action", playtime: "Medium", basePrice: 39.99, discount: 35, rating: 4.9, difficulty: "Hard", description: "Precision combat action game with parries and mastery.", tags: ["Action", "Hard", "Samurai", "Boss"], moodTags: ["challenge", "focus", "hard"], colors: ["#fb7185", "#431407"] },
  { title: "Outlast", genre: "Horror", playtime: "Short", basePrice: 19.99, discount: 40, rating: 4.5, difficulty: "Medium", description: "Pure horror experience with fear, tension, and survival.", tags: ["Horror", "Scary", "Survival"], moodTags: ["horror", "stress"], colors: ["#64748b", "#020617"] },
  { title: "Civilization VI", genre: "Strategy", playtime: "Long", basePrice: 59.99, discount: 60, rating: 4.6, difficulty: "Medium", description: "Turn-based empire building strategy game.", tags: ["Strategy", "Turn-Based", "Brain"], moodTags: ["brain", "focus", "challenge"], colors: ["#facc15", "#92400e"] },
  { title: "Helldivers 2", genre: "Shooter", playtime: "Medium", basePrice: 39.99, discount: 12, rating: 4.7, difficulty: "Medium", description: "Co-op sci-fi shooter chaos with missions and teamwork.", tags: ["Shooter", "Co-op", "Sci-Fi", "Action"], moodTags: ["coop", "energy", "competitive"], colors: ["#06b6d4", "#1e3a8a"] },
  { title: "The Witcher 3", genre: "RPG", playtime: "Long", basePrice: 39.99, discount: 50, rating: 4.9, difficulty: "Medium", description: "Fantasy RPG full of quests, monsters, and choices.", tags: ["Fantasy", "Open World", "Story Rich", "RPG"], moodTags: ["story", "adventure"], colors: ["#22c55e", "#166534"] },
  { title: "Spider-Man 2", genre: "Action", playtime: "Medium", basePrice: 69.99, discount: 12, rating: 4.8, difficulty: "Easy", description: "Fast superhero combat and web-swinging action.", tags: ["Superhero", "Action", "Adventure"], moodTags: ["energy", "adventure", "relaxed"], colors: ["#ef4444", "#1d4ed8"] },
  { title: "Among Us", genre: "Social", playtime: "Short", basePrice: 9.99, discount: 15, rating: 4.3, difficulty: "Easy", description: "Social deduction multiplayer game with friends.", tags: ["Multiplayer", "Social", "Party"], moodTags: ["social", "coop", "relaxed"], colors: ["#f43f5e", "#991b1b"] },
];

const getFinalPrice = (game) => {
  return +(game.basePrice * (1 - game.discount / 100)).toFixed(2);
};

export const getGames = async (req, res) => {
  try {
    for (const game of defaultGames) {
      await Game.findOneAndUpdate(
        { title: game.title },
        { $set: game },
        { upsert: true, new: true }
      );
    }

    const games = await Game.find().sort({ createdAt: -1 });

    return res.status(200).json(games);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load games",
      error: error.message,
    });
  }
};

export const checkout = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];
    const gameIds = [];

    for (const item of items) {
      const game = await Game.findById(item.id);

      if (!game) continue;

      const qty = Number(item.qty) > 0 ? Number(item.qty) : 1;
      const price = getFinalPrice(game);

      totalAmount += price * qty;

      orderItems.push({
        game: game._id,
        title: game.title,
        price,
        qty,
      });

      gameIds.push(game._id);
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ message: "No valid games found" });
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: +totalAmount.toFixed(2),
      status: "paid",
    });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: {
        ownedGames: {
          $each: gameIds,
        },
      },
    });

    return res.status(201).json({
      message: "Checkout successful",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Checkout failed",
      error: error.message,
    });
  }
};

export const getMyOwnedGames = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("ownedGames");

    return res.status(200).json({
      ownedGames: user.ownedGames || [],
      count: user.ownedGames?.length || 0,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load owned games",
      error: error.message,
    });
  }
};