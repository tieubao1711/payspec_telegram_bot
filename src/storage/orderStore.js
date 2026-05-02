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

  async function getDepositRevenueStats({ from, to }) {
    const rows = await PaymentOrder.aggregate([
      {
        $match: {
          kind: 'deposit',
          status: '1',
          lastNotifyAt: { $gte: from, $lt: to },
        },
      },
      {
        $addFields: {
          revenueAmount: {
            $convert: {
              input: { $ifNull: ['$realAmount', { $ifNull: ['$confirmedAmount', '$amount'] }] },
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
          day: {
            $dateToString: {
              date: '$lastNotifyAt',
              format: '%d/%m/%Y',
              timezone: 'Asia/Ho_Chi_Minh',
            },
          },
        },
      },
      {
        $group: {
          _id: '$day',
          revenue: { $sum: '$revenueAmount' },
          count: { $sum: 1 },
          firstAt: { $min: '$lastNotifyAt' },
        },
      },
      {
        $sort: { firstAt: 1 },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$revenue' },
          count: { $sum: '$count' },
          days: {
            $push: {
              date: '$_id',
              revenue: '$revenue',
              count: '$count',
            },
          },
        },
      },
    ]);

    const stats = rows[0] || {
      revenue: 0,
      count: 0,
      days: [],
    };

    return stats;
  }

  return {
    upsert,
    findByTransactionId,
    findByCallbackToken,
    getDepositRevenueStats,
  };
}

module.exports = { createOrderStore };
