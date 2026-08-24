import Ticket from "../models/Ticket.js";

const makeTicketCode = async () => {
  const year = new Date().getFullYear();
  const count = await Ticket.countDocuments();
  return `GS-${year}-${String(count + 1).padStart(4, "0")}`;
};

export const createTicket = async (req, res) => {
  try {
    const {
      issueType,
      category,
      orderId,
      productName,
      platform,
      region,
      priority,
      description,
      contactEmail,
      attachment,
    } = req.body;

    if (!orderId || !productName || !description || !category) {
      return res.status(400).json({
        message: "Order ID, product name, category and description are required",
      });
    }

    const code = await makeTicketCode();

    const ticket = await Ticket.create({
      user: req.user.id,
      code,
      issueType,
      category,
      orderId,
      productName,
      platform,
      region,
      priority,
      description,
      contactEmail,
      attachments: attachment ? [attachment] : [],
      messages: [],
      status: "Pending",
    });

    return res.status(201).json({ message: "Ticket submitted", ticket });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(tickets);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load tickets",
      error: error.message,
    });
  }
};

export const getTicketStats = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id });

    return res.status(200).json({
      total: tickets.length,
      pending: tickets.filter((t) => t.status === "Pending").length,
      processing: tickets.filter((t) => t.status === "Processing").length,
      completed: tickets.filter((t) => t.status === "Completed").length,
      open: tickets.filter((t) => t.status !== "Completed").length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load ticket stats",
      error: error.message,
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.deleteOne();

    return res.status(200).json({ message: "Ticket deleted" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
};

export const addTicketReply = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.messages.push({
      from: "customer",
      text: text.trim(),
    });

    await ticket.save();

    return res.status(200).json({
      message: "Reply sent",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send reply",
      error: error.message,
    });
  }
};

export const reopenTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = "Pending";
    ticket.messages.push({
      from: "customer",
      text: "I requested to reopen this ticket.",
    });

    await ticket.save();

    return res.status(200).json({
      message: "Reopen requested",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reopen ticket",
      error: error.message,
    });
  }
};

export const getAllTicketsForStaff = async (req, res) => {
  try {
    if (req.user.role !== "staff" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Staff only" });
    }

    const tickets = await Ticket.find()
      .populate("user", "username email fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json(tickets);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load all tickets",
      error: error.message,
    });
  }
};

export const updateTicketStatusByStaff = async (req, res) => {
  try {
    if (req.user.role !== "staff" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Staff only" });
    }

    const { status } = req.body;

    if (!["Pending", "Processing", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = status;

    ticket.messages.push({
      from: "staff",
      text: `Ticket status updated to ${status}.`,
    });

    await ticket.save();

    return res.status(200).json({
      message: "Ticket status updated",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update ticket status",
      error: error.message,
    });
  }
};

export const staffReplyTicket = async (req, res) => {
  try {
    if (req.user.role !== "staff" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Staff only" });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply is required" });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.messages.push({
      from: "staff",
      text: text.trim(),
    });

    await ticket.save();

    return res.status(200).json({
      message: "Reply sent",
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reply ticket",
      error: error.message,
    });
  }
};