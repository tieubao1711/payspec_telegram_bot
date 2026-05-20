const { formatVnd } = require('../../utils/money');
const { bold } = require('../../utils/telegram');

const START_OF_TIME = new Date(0);

function formatVietnamDateTime(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ensureAllowed(ctx, config) {
  return !config.withdrawalApproverChatId || ctx.from.id === config.withdrawalApproverChatId;
}

function buildCloseRevenueMessage({ checkpoint }) {
  return [
    bold('Đã chốt doanh thu'),
    '',
    `Doanh thu đã chốt: ${bold(formatVnd(checkpoint.revenue))}`,
    `Lệnh nạp thành công: ${checkpoint.count}`,
    '',
    `Từ: ${formatVietnamDateTime(checkpoint.from || START_OF_TIME)}`,
    `Đến: ${formatVietnamDateTime(checkpoint.to)}`,
    '',
    'Doanh thu sau thời điểm này sẽ được tính lại từ 0.',
  ].join('\n');
}

function registerCloseRevenueCommand({ bot, config, orderStore }) {
  bot.command('chotdoanhthu', async (ctx) => {
    if (!ensureAllowed(ctx, config)) {
      await ctx.reply('Bạn không có quyền chốt doanh thu.');
      return;
    }

    const lastCheckpoint = await orderStore.getLastRevenueCheckpoint();
    const from = lastCheckpoint ? new Date(lastCheckpoint.closedAt) : START_OF_TIME;
    const to = new Date();
    const stats = await orderStore.getDepositRevenueStats({ from, to });
    const checkpoint = await orderStore.createRevenueCheckpoint({
      closedAt: to,
      closedBy: ctx.from.id,
      chatId: ctx.chat.id,
      from,
      to,
      revenue: stats.revenue,
      count: stats.count,
    });

    await ctx.reply(buildCloseRevenueMessage({ checkpoint }), {
      parse_mode: 'HTML',
    });
  });
}

module.exports = { registerCloseRevenueCommand };
