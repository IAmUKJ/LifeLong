const transactionModel = require('../models/transactionModel');

const PLAN_DAYS = {
  '1 week': 7,
  '1 month': 30,
  '1 year': 365
};

module.exports = async function checkPatientPlan(patientId) {
  const txn = await transactionModel
    .findOne({ userId: patientId, payment: true })
    .sort({ date: -1 });

  if (!txn) return false;

  const days = PLAN_DAYS[txn.duration];
  if (!days) return false;

  const expiry = new Date(txn.date);
  expiry.setDate(expiry.getDate() + days);

  return new Date() <= expiry;
};
