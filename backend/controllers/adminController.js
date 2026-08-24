import User from "../models/User.js";
import Game from "../models/Game.js";
import Ticket from "../models/Ticket.js";
import BadgeRequest from "../models/BadgeRequest.js";

const adminOnly = (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403).json({ message: "Admin only" });
    return false;
  }
  return true;
};

export const getAdminOverview = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;

    const users = await User.countDocuments({ role: "customer" });
    const staff = await User.countDocuments({ role: "staff" });
    const admins = await User.countDocuments({ role: "admin" });
    const games = await Game.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $ne: "Completed" } });
    const pendingBadges = await BadgeRequest.countDocuments({ status: "pending" });
    const discountedGames = await Game.countDocuments({ discount: { $gt: 0 } });

    res.json({
      users,
      staff,
      admins,
      games,
      openTickets,
      pendingBadges,
      discountedGames,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin overview", error: error.message });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to load users", error: error.message });
  }
};

export const createAdminProfile = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;

    const { username, email, password, role, fullName, phone, country, city } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Username, email, password and role are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const exists = await User.findOne({ email: cleanEmail });

    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      username: String(username).trim(),
      email: cleanEmail,
      password: String(password).trim(),
      role,
      fullName: fullName || "",
      phone: phone || "",
      country: country || "",
      city: city || "",
      profileCompleted: true,
      completionPercentage: 100,
      currentRank: role === "staff" ? "Staff" : "Verified",
    });

    res.status(201).json({
      message: "Profile created by admin",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create profile", error: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ message: "Admin cannot delete own account" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};