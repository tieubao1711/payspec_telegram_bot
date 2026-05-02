const crypto = require('crypto');

function createPartnerTransactionId(userId) {
  const timestamp = Date.now();
  const suffix = crypto.randomBytes(4).toString('hex');
  return `TG${userId}${timestamp}${suffix}`;
}

function createWithdrawalTransactionId(userId) {
  const timestamp = Date.now();
  const suffix = crypto.randomBytes(4).toString('hex');
  return `RT${userId}${timestamp}${suffix}`;
}

function createCallbackToken() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = {
  createPartnerTransactionId,
  createWithdrawalTransactionId,
  createCallbackToken,
};
