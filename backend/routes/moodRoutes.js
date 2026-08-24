import express from "express";
import {
  getMyMoodPreference,
  rateMoodGame,
  saveMoodHistory,
  resetMoodPreference,
} from "../controllers/moodController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyMoodPreference);
router.post("/rate", protect, rateMoodGame);
router.post("/history", protect, saveMoodHistory);
router.delete("/reset", protect, resetMoodPreference);

export default router;