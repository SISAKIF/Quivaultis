import express from "express";
import {
  createTicket,
  getMyTickets,
  getTicketStats,
  deleteTicket,
  addTicketReply,
  reopenTicket,
  getAllTicketsForStaff,
  updateTicketStatusByStaff,
  staffReplyTicket,
} from "../controllers/ticketController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTicket);
router.get("/", protect, getMyTickets);
router.get("/stats", protect, getTicketStats);

router.get("/staff/all", protect, getAllTicketsForStaff);
router.patch("/staff/:id/status", protect, updateTicketStatusByStaff);
router.post("/staff/:id/reply", protect, staffReplyTicket);

router.delete("/:id", protect, deleteTicket);
router.post("/:id/reply", protect, addTicketReply);
router.patch("/:id/reopen", protect, reopenTicket);

export default router;