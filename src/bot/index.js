const { Telegraf } = require('telegraf');
const { registerDepositCommand } = require('./commands/deposit');
const { registerWithdrawCommand } = require('./commands/withdraw');

function createBot({ config, payspecClient, orderStore }) {
  const bot = new Telegraf(config.telegram.token);

  bot.start((ctx) => {
    ctx.reply(
      'Chao mung ban. Dung lenh /naptien amount de tao don nap tien. Vi du: /naptien 50000'
    );
  });

  registerDepositCommand({ bot, payspecClient, orderStore });
  registerWithdrawCommand({ bot, config, orderStore });

  bot.catch((error, ctx) => {
    console.error(`Telegram bot error for update ${ctx.update.update_id}:`, error);
  });

  return bot;
}

module.exports = { createBot };
