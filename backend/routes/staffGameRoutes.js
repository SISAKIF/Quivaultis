import express from "express";
import {
  getStaffGames,
  createStaffGame,
  updateStaffGame,
  deleteStaffGame,
  updateStaffGameStock,
} from "../controllers/staffGameController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getStaffGames);
router.post("/", protect, createStaffGame);
router.put("/:id", protect, updateStaffGame);
router.delete("/:id", protect, deleteStaffGame);
router.patch("/:id/stock", protect, updateStaffGameStock);

export default router;