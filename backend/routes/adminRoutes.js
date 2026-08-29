import express from "express";
import {
  getAdminOverview,
  getAdminUsers,
  createAdminProfile,
  deleteAdminUser,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", protect, getAdminOverview);
router.get("/users", protect, getAdminUsers);
router.post("/profiles", protect, createAdminProfile);
router.delete("/users/:id", protect, deleteAdminUser);

export default router;