import BadgeRequest from "../models/BadgeRequest.js";
import User from "../models/User.js";

export const createBadgeRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profileCompleted || user.completionPercentage < 100) {
      return res.status(400).json({
        message: "Profile must be 100% complete before requesting a badge",
      });
    }

    const existingPendingRequest = await BadgeRequest.findOne({
      user: user._id,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        message: "You already have a pending badge request",
      });
    }

    const badgeRequest = await BadgeRequest.create({
      user: user._id,
      requestedBadge: "Verified Badge",
      status: "pending",
      note: "Customer requested verified badge",
    });

    user.badgeStatus = "pending";
    await user.save();

    return res.status(201).json({
      message: "Badge request submitted successfully",
      request: badgeRequest,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create badge request",
      error: error.message,
    });
  }
};

export const getPendingBadgeRequests = async (req, res) => {
  try {
    const requests = await BadgeRequest.find({ status: "pending" })
      .populate("user", "username email fullName currentRank completionPercentage badgeStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Pending badge requests fetched successfully",
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pending badge requests",
      error: error.message,
    });
  }
};

export const approveBadgeRequest = async (req, res) => {
  try {
    const request = await BadgeRequest.findById(req.params.id).populate("user");

    if (!request) {
      return res.status(404).json({ message: "Badge request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: `This request is already ${request.status}`,
      });
    }

    request.status = "approved";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    const user = await User.findById(request.user._id);

    if (user) {
      user.badgeStatus = "approved";
      user.badgeName = "Verified Badge";
      await user.save();
    }

    return res.status(200).json({
      message: "Badge request approved successfully",
      request,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve badge request",
      error: error.message,
    });
  }
};

export const rejectBadgeRequest = async (req, res) => {
  try {
    const request = await BadgeRequest.findById(req.params.id).populate("user");

    if (!request) {
      return res.status(404).json({ message: "Badge request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: `This request is already ${request.status}`,
      });
    }

    request.status = "rejected";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    const user = await User.findById(request.user._id);

    if (user) {
      user.badgeStatus = "rejected";
      await user.save();
    }

    return res.status(200).json({
      message: "Badge request rejected successfully",
      request,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject badge request",
      error: error.message,
    });
  }
};

export const getAllBadgeRequests = async (req, res) => {
  try {
    const requests = await BadgeRequest.find({})
      .populate("user", "username email fullName currentRank completionPercentage badgeStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "All badge requests fetched successfully",
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch badge requests",
      error: error.message,
    });
  }
};