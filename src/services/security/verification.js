const crypto = require('crypto');

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashVerificationCode({ secret, transactionId, code }) {
  return crypto
    .createHash('sha256')
    .update([secret, transactionId, code].join('|'), 'utf8')
    .digest('hex');
}

function verifyCode({ secret, transactionId, code, expectedHash }) {
  if (!code || !expectedHash) return false;

  const receivedHash = hashVerificationCode({ secret, transactionId, code });
  if (receivedHash.length !== expectedHash.length) return false;

  return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
}

module.exports = {
  createVerificationCode,
  hashVerificationCode,
  verifyCode,
};
