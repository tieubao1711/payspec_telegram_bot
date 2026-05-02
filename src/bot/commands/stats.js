const { getStatsRange } = require('../../utils/dateRange');
const { formatVnd } = require('../../utils/money');
const { bold } = require('../../utils/telegram');

const PERIOD_LABELS = {
  today: 'HOM NAY',
  week: 'TUAN NAY',
  month: 'THANG NAY',
};

function parseStatsPeriod(text) {
  const parts = text.trim().split(/\s+/);
  const period = parts[1] || 'today';

  if (parts.length > 2 || !['today', 'week', 'month'].includes(period)) {
    return {
      error: 'Lenh khong hop le. Dung: /thongke, /thongke week hoac /thongke month',
    };
  }

  return { period };
}

function buildStatsMessage(period, stats) {
  return [
    bold(`THONG KE ${PERIOD_LABELS[period]}`),
    '',
    `Tien nap thanh cong: ${bold(formatVnd(stats.depositTotal))}`,
    `So don nap: ${stats.depositCount}`,
    '',
    `Tien rut thanh cong: ${bold(formatVnd(stats.withdrawalTotal))}`,
    `So don rut: ${stats.withdrawalCount}`,
    '',
    `Net: ${bold(formatVnd(stats.netTotal))}`,
  ].join('\n');
}

function registerStatsCommand({ bot, config, orderStore }) {
  bot.command('thongke', async (ctx) => {
    if (config.withdrawalApproverChatId && ctx.chat.id !== config.withdrawalApproverChatId) {
      await ctx.reply('Ban khong co quyen xem thong ke.');
      return;
    }

    const parsed = parseStatsPeriod(ctx.message && ctx.message.text ? ctx.message.text : '');
    if (parsed.error) {
      await ctx.reply(parsed.error);
      return;
    }

    const range = getStatsRange(parsed.period);
    const stats = await orderStore.getRevenueStats(range);

    await ctx.reply(buildStatsMessage(parsed.period, stats), {
      parse_mode: 'HTML',
    });
  });
}

module.exports = { registerStatsCommand };
