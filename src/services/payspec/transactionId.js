const crypto = require('crypto');

function createPartnerTransactionId(userId) {
  const timestamp = Date.now();
  const suffix = crypto.randomBytes(4).toString('hex');
  return `TG${userId}${timestamp}${suffix}`;
}

module.exports = { createPartnerTransactionId };
