import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import badgeRequestRoutes from "./routes/badgeRequestRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";
import dealsRoutes from "./routes/dealsRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import staffGameRoutes from "./routes/staffGameRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import communityReviewRoutes from "./routes/communityReviewRoutes.js";

dotenv.config({ path: "./.env" });

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/store", storeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/badge-requests", badgeRequestRoutes);
app.use("/api/mood-ai", moodRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/staff/games", staffGameRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/community-reviews", communityReviewRoutes);

app.get("/", (req, res) => {
  res.send("Quivaultis API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});