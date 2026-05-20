const mongoose = require('mongoose');

const revenueCheckpointSchema = new mongoose.Schema(
  {
    closedAt: { type: Date, required: true, index: true },
    closedBy: { type: Number, required: true, index: true },
    chatId: { type: Number, required: true },
    revenue: { type: Number, required: true, default: 0 },
    count: { type: Number, required: true, default: 0 },
    from: { type: Date },
    to: { type: Date },
  },
  {
    timestamps: true,
    collection: 'revenue_checkpoints',
  }
);

const RevenueCheckpoint = mongoose.model('RevenueCheckpoint', revenueCheckpointSchema);

module.exports = { RevenueCheckpoint };
