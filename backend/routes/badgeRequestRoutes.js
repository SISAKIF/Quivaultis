import express from "express";
import {
  createBadgeRequest,
  getPendingBadgeRequests,
  getAllBadgeRequests,
  approveBadgeRequest,
  rejectBadgeRequest,
} from "../controllers/badgeRequestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const allowStaffAdmin = (req, res, next) => {
  if (req.user.role !== "staff" && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Staff or admin only.",
    });
  }

  next();
};

router.post("/", protect, createBadgeRequest);
router.get("/pending", protect, allowStaffAdmin, getPendingBadgeRequests);
router.get("/", protect, allowStaffAdmin, getAllBadgeRequests);
router.put("/:id/approve", protect, allowStaffAdmin, approveBadgeRequest);
router.put("/:id/reject", protect, allowStaffAdmin, rejectBadgeRequest);

export default router;