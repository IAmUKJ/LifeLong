const redisClient = require("../utils/redis");
const Doctor = require("../models/Doctor");

/**
 * @param {string[]} specializations
 * @returns {Promise<Array>}
 */
const findDoctorsBySpecialization = async (specializations) => {
  // Normalize & build stable cache key
  const normalized = [...new Set(specializations)].sort();
  const cacheKey = `ai:doctors:specialization:${normalized.join("|")}`;

  // 1️⃣ Try Redis first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log("⚡ Doctors by specialization served from Redis");
    return JSON.parse(cached);
  }

  // 2️⃣ MongoDB query (source of truth)
  const doctors = await Doctor.find({
    specialization: { $in: normalized },
    verified_by_admin: true
  }).sort({ rating: -1 });

  // 3️⃣ Cache for SHORT time (2 minutes)
  await redisClient.setEx(
    cacheKey,
    120,
    JSON.stringify(doctors)
  );

  return doctors;
};

module.exports = {
  findDoctorsBySpecialization
};
