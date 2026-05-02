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

  async function getRevenueStats({ from, to }) {
    const rows = await PaymentOrder.aggregate([
      {
        $match: {
          status: '1',
          lastNotifyAt: { $gte: from, $lt: to },
          kind: { $in: ['deposit', 'withdrawal'] },
        },
      },
      {
        $addFields: {
          depositAmount: {
            $cond: [
              { $eq: ['$kind', 'deposit'] },
              {
                $convert: {
                  input: { $ifNull: ['$realAmount', { $ifNull: ['$confirmedAmount', '$amount'] }] },
                  to: 'double',
                  onError: 0,
                  onNull: 0,
                },
              },
              0,
            ],
          },
          withdrawalAmount: {
            $cond: [{ $eq: ['$kind', 'withdrawal'] }, '$amount', 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          depositTotal: { $sum: '$depositAmount' },
          withdrawalTotal: { $sum: '$withdrawalAmount' },
          depositCount: {
            $sum: { $cond: [{ $eq: ['$kind', 'deposit'] }, 1, 0] },
          },
          withdrawalCount: {
            $sum: { $cond: [{ $eq: ['$kind', 'withdrawal'] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = rows[0] || {
      depositTotal: 0,
      withdrawalTotal: 0,
      depositCount: 0,
      withdrawalCount: 0,
    };

    return {
      ...stats,
      netTotal: stats.depositTotal - stats.withdrawalTotal,
    };
  }

  return {
    upsert,
    findByTransactionId,
    findByCallbackToken,
    getRevenueStats,
  };
}

module.exports = { createOrderStore };
