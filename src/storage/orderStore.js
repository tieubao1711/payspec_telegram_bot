const { PaymentOrder } = require('../models/paymentOrder');

function toPlain(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...plain,
    id: String(plain._id),
  };
}

function createOrderStore() {
  async function upsert(order) {
    const { _id, id, createdAt, updatedAt, __v, ...updates } = order;
    const doc = await PaymentOrder.findOneAndUpdate(
      { transactionId: updates.transactionId },
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return toPlain(doc);
  }

  async function findByTransactionId(transactionId) {
    return toPlain(await PaymentOrder.findOne({ transactionId }));
  }

  async function findByCallbackToken(callbackToken) {
    return toPlain(await PaymentOrder.findOne({ callbackToken }));
  }

  return {
    upsert,
    findByTransactionId,
    findByCallbackToken,
  };
}

module.exports = { createOrderStore };
