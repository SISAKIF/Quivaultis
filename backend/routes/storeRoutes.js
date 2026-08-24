import express from "express";
import {
  getGames,
  checkout,
  getMyOwnedGames,
} from "../controllers/storeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/games", getGames);
router.post("/checkout", protect, checkout);
router.get("/owned", protect, getMyOwnedGames);

export default router;