const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const userModel = require("../models/User");
const transactionModel = require("../models/transactionModel");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =======================
   HELPER: CALCULATE EXPIRY
======================= */
const getExpiryDate = (startDate, duration) => {
  const expiry = new Date(startDate);

  switch (duration) {
    case "1 week":
      expiry.setDate(expiry.getDate() + 7);
      break;
    case "1 month":
      expiry.setMonth(expiry.getMonth() + 1);
      break;
    case "1 year":
      expiry.setFullYear(expiry.getFullYear() + 1);
      break;
    default:
      expiry.setDate(expiry.getDate() + 7);
  }

  return expiry;
};

/* =======================
   CREATE PAYMENT ORDER
======================= */
router.post("/pay", auth, authorize("patient"), async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // 🚫 BLOCK IF ACTIVE PLAN EXISTS
    const activePlan = await transactionModel.findOne({
      userId,
      payment: true,
      expiresAt: { $gt: new Date() },
    });

    if (activePlan) {
      return res.json({
        success: false,
        message: "You already have an active plan",
      });
    }

    let plan, credits, amount, duration;

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        duration = "1 week";
        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        duration = "1 month";
        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        duration = "1 year";
        break;

      default:
        return res.json({ success: false, message: "Plan not found" });
    }

    const startDate = new Date();
    const expiresAt = getExpiryDate(startDate, duration);

    const transaction = await transactionModel.create({
      userId,
      plan,
      amount,
      credits,
      duration,
      startDate,
      expiresAt,
      payment: false,
    });

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY || "INR",
      receipt: transaction._id.toString(),
    };

    razorpayInstance.orders.create(options, async (err, order) => {
      if (err) {
        return res.json({ success: false, message: err.message });
      }

      await transactionModel.findByIdAndUpdate(transaction._id, {
        razorpayOrderId: order.id,
      });

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      });
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
});

/* =======================
   VERIFY PAYMENT
======================= */
router.post("/verify", auth, authorize("patient"), async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const transaction = await transactionModel.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!transaction || transaction.payment) {
      return res.json({
        success: false,
        message: "Transaction invalid or already processed",
      });
    }

    await transactionModel.findByIdAndUpdate(transaction._id, {
      payment: true,
    });

    await userModel.findByIdAndUpdate(transaction.userId, {
      $inc: { creditBalance: transaction.credits },
    });

    res.json({ success: true, message: "Payment verified & credits added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

/* =======================
   GET USER CREDITS
======================= */
router.get("/credits/:userId", auth, authorize("patient"), async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await transactionModel.aggregate([
      {
        $match: {
          userId,
          payment: true,
        },
      },
      {
        $group: {
          _id: "$userId",
          totalCredits: { $sum: "$credits" },
        },
      },
    ]);

    res.json({
      success: true,
      credits: result.length ? result[0].totalCredits : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credits",
    });
  }
});

/* =======================
   GET ACTIVE PLAN DETAILS
======================= */
router.get("/plan/:userId", auth, authorize("patient"), async (req, res) => {
  try {
    const { userId } = req.params;

    const plan = await transactionModel.findOne({
      userId,
      payment: true,
      expiresAt: { $gt: new Date() },
    }).sort({ expiresAt: -1 });

    if (!plan) {
      return res.json({
        success: true,
        plan: null,
        duration: null,
      });
    }

    res.json({
      success: true,
      plan: plan.plan,
      duration: plan.duration,
      credits: plan.credits,
      expiresAt: plan.expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plan details",
    });
  }
});

module.exports = router;
