const crypto = require('crypto');

function md5(value) {
  return crypto.createHash('md5').update(value, 'utf8').digest('hex');
}

function hmacSha256(value, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(value, 'utf8').digest('hex');
}

function createDepositSignature({ secretKey, apiKey, type, amount, transactionId }) {
  return md5([secretKey, apiKey, type, amount, transactionId].join('|'));
}

function createWithdrawalSignature({
  secretKey,
  apiKey,
  accountNumber,
  accountName,
  bank,
  amount,
  transactionId,
  unixTime,
}) {
  return hmacSha256(
    [apiKey, accountNumber, accountName, bank, amount, transactionId, unixTime].join('|'),
    secretKey
  );
}

function createWithdrawalCallbackMd5Signature({ apiKey, status, amount, transactionId }) {
  return md5([apiKey, status, amount, transactionId].join('|'));
}

function createWithdrawalCallbackHmacSignature({ secretKey, apiKey, status, amount, transactionId }) {
  return hmacSha256([apiKey, status, amount, transactionId].join('|'), secretKey);
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

function verifyWithdrawalNotifySignature({ secretKey, apiKey, payload }) {
  if (!payload || !payload.signature) return false;

  const signatureInput = {
    apiKey,
    status: payload.status,
    amount: payload.amount,
    transactionId: payload.trans_id,
  };
  const expectedMd5 = createWithdrawalCallbackMd5Signature(signatureInput);
  const expectedHmac = createWithdrawalCallbackHmacSignature({
    ...signatureInput,
    secretKey,
  });
  const received = String(payload.signature);

  return [expectedMd5, expectedHmac].some((expected) => {
    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  });
}

module.exports = {
  createDepositSignature,
  createWithdrawalSignature,
  createNotifySignature,
  verifyNotifySignature,
  verifyWithdrawalNotifySignature,
};
