import express from "express";
import {
  getCommunityReviews,
  createCommunityReview,
  updateCommunityReview,
  deleteCommunityReview,
  toggleHelpfulReview,
  toggleReactionReview,
} from "../controllers/communityReviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCommunityReviews);
router.post("/", protect, createCommunityReview);
router.put("/:id", protect, updateCommunityReview);
router.delete("/:id", protect, deleteCommunityReview);
router.patch("/:id/helpful", protect, toggleHelpfulReview);
router.patch("/:id/reaction", protect, toggleReactionReview);

export default router;