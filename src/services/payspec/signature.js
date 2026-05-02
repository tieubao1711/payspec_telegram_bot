const crypto = require('crypto');

function md5(value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex');
}

function createDepositSignature({ secretKey, apiKey, type, amount, transactionId }) {
  return md5([secretKey, apiKey, type, amount, transactionId].join('|'));
}

function createNotifySignature(secretKey, payload) {
  return md5(
    [
      secretKey,
      payload.status,
      payload.comment,
      payload.tran_id,
      payload.type,
      payload.request_amount,
      payload.amount,
      payload.real_amount,
      payload.transaction_id,
    ].join('|')
  );
}

function verifyNotifySignature(secretKey, payload) {
  if (!payload || !payload.signature) return false;

  const expected = createNotifySignature(secretKey, payload);
  const received = String(payload.signature);

  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

module.exports = {
  createDepositSignature,
  createNotifySignature,
  verifyNotifySignature,
};
