import express from "express";
import {
  getDeals,
  getWatchedDeals,
  toggleWatchDeal,
  clearWatchedDeals,
} from "../controllers/dealsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getDeals);
router.get("/watched", protect, getWatchedDeals);
router.post("/watch", protect, toggleWatchDeal);
router.delete("/watched", protect, clearWatchedDeals);

export default router;