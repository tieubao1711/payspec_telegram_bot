const {
  createCallbackToken,
  createWithdrawalTransactionId,
} = require('../../services/payspec/transactionId');
const { formatVnd } = require('../../utils/money');
const { bold, code } = require('../../utils/telegram');

const MIN_WITHDRAWAL = 10000;
const MAX_WITHDRAWAL = 300000000;

function parseWithdrawalAmount(text) {
  const parts = text.trim().split(/\s+/);
  const rawAmount = parts[1];

  if (!rawAmount) {
    return { error: 'Vui long nhap so tien. Vi du: /ruttien 50000' };
  }

  if (parts.length > 2) {
    return { error: 'Lenh khong hop le. Vi du dung: /ruttien 50000' };
  }

  const normalized = rawAmount.replace(/[,.]/g, '');
  if (!/^\d+$/.test(normalized)) {
    return { error: 'So tien khong hop le. Vi du dung: /ruttien 50000' };
  }

  const amount = Number(normalized);
  if (!Number.isSafeInteger(amount) || amount < MIN_WITHDRAWAL || amount > MAX_WITHDRAWAL) {
    return {
      error: `So tien rut phai tu ${formatVnd(MIN_WITHDRAWAL)} den ${formatVnd(MAX_WITHDRAWAL)}.`,
    };
  }

  return { amount };
}

function buildWithdrawalDraftMessage(order, formUrl) {
  return [
    bold('YEU CAU RUT TIEN'),
    '',
    `So tien: ${bold(formatVnd(order.amount))}`,
    `Ma yeu cau: ${code(order.transactionId)}`,
    '',
    'Mo link ben duoi de nhap ngan hang, so tai khoan va ten chu tai khoan.',
    formUrl,
  ].join('\n');
}

function registerWithdrawCommand({ bot, config, orderStore }) {
  bot.command('ruttien', async (ctx) => {
    const messageText = ctx.message && ctx.message.text ? ctx.message.text : '';
    const parsed = parseWithdrawalAmount(messageText);

    if (parsed.error) {
      await ctx.reply(parsed.error);
      return;
    }

    const transactionId = createWithdrawalTransactionId(ctx.from.id);
    const callbackToken = createCallbackToken();
    const order = await orderStore.upsert({
      transactionId,
      kind: 'withdrawal',
      status: 'draft',
      telegramUserId: ctx.from.id,
      chatId: ctx.chat.id,
      amount: parsed.amount,
      callbackToken,
    });
    const formUrl = `${config.appBaseUrl.replace(/\/$/, '')}/withdraw/${order.callbackToken}`;

    await ctx.reply(buildWithdrawalDraftMessage(order, formUrl), {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  });
}

module.exports = { registerWithdrawCommand };
