import express from "express";
import {
  getMarketplaceSummary,
  getListings,
  getMyListings,
  getInventory,
  createListing,
  buyListing,
  sendOffer,
  delistListing,
  getTransactions,
} from "../controllers/marketplaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getMarketplaceSummary);
router.get("/listings", protect, getListings);
router.get("/my-listings", protect, getMyListings);
router.get("/inventory", protect, getInventory);
router.get("/transactions", protect, getTransactions);

router.post("/listings", protect, createListing);
router.post("/buy", protect, buyListing);
router.post("/offer", protect, sendOffer);
router.patch("/delist", protect, delistListing);

export default router;