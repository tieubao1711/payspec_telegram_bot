const { Telegraf } = require('telegraf');
const { registerDepositCommand } = require('./commands/deposit');
const { registerWithdrawCommand } = require('./commands/withdraw');
const { registerStatsCommand } = require('./commands/stats');

function createBot({ config, payspecClient, orderStore }) {
  const bot = new Telegraf(config.telegram.token);

  bot.telegram
    .setMyCommands([
      { command: 'naptien', description: 'Tao lenh nap tien' },
      { command: 'ruttien', description: 'Tao lenh rut tien' },
      { command: 'thongke', description: 'Xem doanh thu nap tien' },
      { command: 'myid', description: 'Xem Telegram ID' },
    ])
    .catch((error) => {
      console.error('Failed to set Telegram commands:', error.message);
    });

  bot.start((ctx) => {
    ctx.reply(
      'Chao mung ban. Dung lenh /naptien amount de tao don nap tien. Vi du: /naptien 50000'
    );
  });

  bot.command('myid', (ctx) => {
    ctx.reply([`User ID cua ban: ${ctx.from.id}`, `Chat ID hien tai: ${ctx.chat.id}`].join('\n'));
  });

  registerDepositCommand({ bot, payspecClient, orderStore });
  registerWithdrawCommand({ bot, config, orderStore });
  registerStatsCommand({ bot, config, orderStore });

  bot.catch((error, ctx) => {
    console.error(`Telegram bot error for update ${ctx.update.update_id}:`, error);
  });

  return bot;
}

module.exports = { createBot };
