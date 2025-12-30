const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  credits: { type: Number, required: true },
  duration: {type: String, required: true},
  // ✅ PLAN LIFECYCLE (IMPORTANT FOR BUSINESS LOGIC)
  startDate: {
    type: Date,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  razorpayOrderId: {          // ✅ ADD THIS
    type: String,
    index: true,
  },

  payment: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const transactionModel =
  mongoose.models.transaction ||
  mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;
