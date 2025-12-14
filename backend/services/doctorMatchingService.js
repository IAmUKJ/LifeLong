const Doctor = require("../models/Doctor");

/**
 * @param {string[]} specializations
 * @returns {Promise<Array>}
 */
const findDoctorsBySpecialization = async (specializations) => {
  return Doctor.find({
    specialization: { $in: specializations },
    verified_by_admin: true
  }).sort({ rating: -1 });
};

module.exports = {
  findDoctorsBySpecialization
};
