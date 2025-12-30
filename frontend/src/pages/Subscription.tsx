import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { plans } from "../assets/assets";
import api from '../utils/api';
const Subscription = () => {
  const { user, loading, refreshPlan } = useAuth();
  const navigate = useNavigate();
    const [plan, setPlan] = useState<string | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
    useEffect(() => {
  const fetchPlan = async () => {
    if (!user?.id) return;

    try {
      setLoadingPlan(true);
      const res = await api.get(
        `/payments/plan/${user.id}`,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setPlan(res.data.plan);
      }
    } catch (err) {
      console.error("Failed to fetch credits", err);
    } finally {
      setLoadingPlan(false);
    }
  };

  fetchPlan();
}, [user?.id]);
  const initPay = (order: any) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "LifeLong",
      description: "Subscription Payment",
      order_id: order.id,
      receipt: order.receipt,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        // contact: user?.phone || "", // ✅ PHONE USED
      },
      method: {
      card: false,        // ❌ DISABLE CARDS
      upi: true,          // ✅ ENABLE UPI
      netbanking: true,   // ✅ ENABLE NETBANKING
      wallet: true,
      paylater: true,
    },
      handler: async (response: any) => {
        try {
          const { data } = await api.post(
            "/payments/verify",
            response,
            { withCredentials: true }
          );

          if (data.success) {
            await refreshPlan()
            toast.success("Subscription Activated 🎉");
            navigate("/");
          }
        } catch (err: any) {
          toast.error("Payment verification failed");
        }
      },

      theme: {
        color: "#2563eb",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const subscribe = async (planId: string) => {
  if (!user) {
    toast.info("Please login to continue");
    navigate("/login");
    return;
  }
  if (plan) {
    toast.info("You already have an active plan");
    navigate("/dashboard")
    return;
  }
  try {
    const res = await api.post(
      "/payments/pay",
      { userId: user.id, planId },
      { withCredentials: true }
    );

    console.log("FULL RESPONSE:", res);
    console.log("RESPONSE DATA:", res.data);
    console.log("SUCCESS:", res.data?.success);
    console.log("ORDER:", res.data?.order);

    // TEMP: call initPay even if success flag is missing
    if (res.data?.order) {
      initPay(res.data.order);
    } else {
      toast.error("Order not received from backend");
    }

  } catch (err: any) {
    console.error("PAY ERROR:", err);
    toast.error("Unable to initiate payment");
  }
};


  if (loading) return null;

  return (
    <motion.div
      className="min-h-[80vh] text-center pt-14 mb-10"
      initial={{ opacity: 0.2, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Trial Banner */}
      <div className="max-w-3xl mx-auto mb-8 bg-green-100 text-green-800 px-6 py-3 rounded-lg">
        🎉 You have a <b>2-day free trial</b>. Subscribe to continue uninterrupted.
      </div>

      <h1 className="text-3xl font-medium mb-10">Choose a Subscription</h1>

      <div className="flex flex-wrap justify-center gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border rounded-xl shadow-sm px-8 py-10 w-72 hover:scale-105 transition"
          >
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-gray-500 text-sm">{plan.desc}</p>

            <p className="mt-6 text-3xl font-bold">
              ₹{plan.price}
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / {plan.duration}
              </span>
            </p>

            <button
              onClick={() => subscribe(plan.id)}
              className="mt-8 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Subscription;
