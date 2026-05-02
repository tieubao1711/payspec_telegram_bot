const { getStatsRange } = require('../../utils/dateRange');
const { formatVnd } = require('../../utils/money');
const { bold } = require('../../utils/telegram');

const PERIOD_LABELS = {
  today: 'hom nay',
  week: 'tuan nay',
  month: 'thang nay',
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
  const lines = [
    bold(`Thong ke doanh thu ${PERIOD_LABELS[period]}`),
    '',
    `Doanh thu: ${bold(formatVnd(stats.revenue))}`,
    `Lenh nap thanh cong: ${stats.count}`,
  ];

  if (period !== 'today' && stats.days.length > 0) {
    lines.push('', bold('Theo ngay'));
    for (const day of stats.days) {
      lines.push(`${day.date}: ${formatVnd(day.revenue)} (${day.count} lenh)`);
    }
  }

  return lines.join('\n');
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
    const stats = await orderStore.getDepositRevenueStats(range);

    await ctx.reply(buildStatsMessage(parsed.period, stats), {
      parse_mode: 'HTML',
    });
  });
}

module.exports = { registerStatsCommand };
