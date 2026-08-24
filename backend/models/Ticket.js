import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: ["customer", "staff"],
      default: "customer",
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
    },

    issueType: {
      type: String,
      enum: ["key", "disk"],
      default: "key",
    },

    category: {
      type: String,
      required: true,
    },

    orderId: {
      type: String,
      required: true,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      default: "PS5",
    },

    region: {
      type: String,
      default: "BD",
    },

    priority: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    contactEmail: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed"],
      default: "Pending",
    },

    messages: {
      type: [ticketMessageSchema],
      default: [],
    },

    attachments: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);