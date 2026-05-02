const mongoose = require('mongoose');

const paymentOrderSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['deposit', 'withdrawal'], required: true, index: true },
    status: { type: String, required: true, default: 'draft', index: true },
    telegramUserId: { type: Number, index: true },
    chatId: { type: Number, index: true },
    amount: { type: Number, required: true },
    providerTransactionId: { type: String },
    providerOrderId: { type: String },
    providerMessage: { type: String },
    callbackToken: { type: String, index: true },
    bank: { type: String },
    typeBank: { type: String },
    accountNumber: { type: String },
    accountName: { type: String },
    comment: { type: String },
    tranId: { type: String },
    qr: { type: String },
    qrBase64: { type: String },
    paymentUrl: { type: String },
    requestAmount: { type: String },
    confirmedAmount: { type: String },
    realAmount: { type: String },
    notifyType: { type: String },
    notifyComment: { type: String },
    lastNotifyAt: { type: Date },
    requestPayload: { type: mongoose.Schema.Types.Mixed },
    responsePayload: { type: mongoose.Schema.Types.Mixed },
    callbackPayload: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'payment_orders',
  }
);

const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema);

module.exports = { PaymentOrder };
