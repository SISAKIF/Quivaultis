import User from "../models/User.js";

const calculateCompletion = (userData) => {
  let done = 0;

  if ((userData.fullName || "").trim()) done++;
  if ((userData.username || "").trim()) done++;
  if ((userData.email || "").trim()) done++;
  if ((userData.phone || "").trim()) done++;
  if ((userData.country || "").trim()) done++;
  if ((userData.city || "").trim()) done++;
  if ((userData.dob || "").trim()) done++;
  if ((userData.platform || "").trim()) done++;
  if ((userData.playtime || "").trim()) done++;
  if ((userData.bio || "").trim().length >= 10) done++;
  if (Array.isArray(userData.genres) && userData.genres.length >= 1) done++;

  return Math.round((done / 11) * 100);
};

const calculateRank = (completion) => {
  if (completion === 100) return "Elite";
  if (completion >= 80) return "Gold";
  if (completion >= 50) return "Silver";
  if (completion >= 20) return "Bronze";
  return "Starter";
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      phone,
      country,
      city,
      dob,
      platform,
      playtime,
      genres,
      tag,
      bio,
      avatar,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName ?? user.fullName;
    user.username = username ?? user.username;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    user.country = country ?? user.country;
    user.city = city ?? user.city;
    user.dob = dob ?? user.dob;
    user.platform = platform ?? user.platform;
    user.playtime = playtime ?? user.playtime;
    user.genres = genres ?? user.genres;
    user.tag = tag ?? user.tag;
    user.bio = bio ?? user.bio;
    user.avatar = avatar ?? user.avatar;

    const completion = calculateCompletion(user);

    user.completionPercentage = completion;
    user.profileCompleted = completion === 100;
    user.currentRank = calculateRank(completion);
    user.lastProfileUpdate = new Date();

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};