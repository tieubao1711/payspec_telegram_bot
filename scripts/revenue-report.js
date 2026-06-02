require('dotenv').config();

const mongoose = require('mongoose');
const { PaymentOrder } = require('../src/models/paymentOrder');
const { formatVnd } = require('../src/utils/money');

async function getRevenueReport() {
  const rows = await PaymentOrder.aggregate([
    {
      $match: {
        kind: 'deposit',
        status: '1',
      },
    },
    {
      $addFields: {
        grossAmount: {
          $convert: {
            input: { $ifNull: ['$confirmedAmount', '$amount'] },
            to: 'double',
            onError: 0,
            onNull: 0,
          },
        },
        netAmount: {
          $convert: {
            input: { $ifNull: ['$realAmount', { $ifNull: ['$confirmedAmount', '$amount'] }] },
            to: 'double',
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        grossRevenue: { $sum: '$grossAmount' },
        netRevenue: { $sum: '$netAmount' },
      },
    },
  ]);

  const report = rows[0] || {
    count: 0,
    grossRevenue: 0,
    netRevenue: 0,
  };

  return {
    ...report,
    fee: report.grossRevenue - report.netRevenue,
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  const report = await getRevenueReport();

  console.log('BÁO CÁO DOANH THU TOÀN BỘ');
  console.log('');
  console.log(`Lệnh nạp thành công: ${report.count}`);
  console.log(`Tổng tiền chuyển: ${formatVnd(report.grossRevenue)}`);
  console.log(`Tổng phí: ${formatVnd(report.fee)}`);
  console.log(`Doanh thu thực nhận: ${formatVnd(report.netRevenue)}`);
}

main()
  .catch((error) => {
    console.error(`Không thể lấy báo cáo doanh thu: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
