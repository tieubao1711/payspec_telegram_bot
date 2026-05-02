const {
  createCallbackToken,
  createWithdrawalTransactionId,
} = require('../../services/payspec/transactionId');
const {
  createVerificationCode,
  hashVerificationCode,
} = require('../../services/security/verification');
const { formatVnd } = require('../../utils/money');
const { bold, code, escapeHtml } = require('../../utils/telegram');

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
    '',
    'Mo link ben duoi de nhap thong tin rut tien.',
    'Ma xac thuc da duoc gui cho quan tri vien.',
    formUrl,
  ].join('\n');
}

function buildApproverMessage({ ctx, order, verificationCode }) {
  const username = ctx.from.username ? `@${ctx.from.username}` : 'khong co username';

  return [
    bold('MA XAC THUC RUT TIEN'),
    '',
    `Ma xac thuc: ${code(verificationCode)}`,
    `So tien: ${bold(formatVnd(order.amount))}`,
    `Nguoi tao: ${escapeHtml(ctx.from.first_name || '')} ${escapeHtml(ctx.from.last_name || '')}`.trim(),
    `Telegram ID: ${code(ctx.from.id)}`,
    `Username: ${escapeHtml(username)}`,
    '',
    'Chi cung cap ma nay neu ban dong y cho yeu cau rut tien.',
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

    if (!config.withdrawalApproverChatId) {
      await ctx.reply('Chua cau hinh WITHDRAWAL_APPROVER_CHAT_ID nen khong the tao lenh rut tien.');
      return;
    }

    const transactionId = createWithdrawalTransactionId(ctx.from.id);
    const callbackToken = createCallbackToken();
    const verificationCode = createVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const order = await orderStore.upsert({
      transactionId,
      kind: 'withdrawal',
      status: 'draft',
      telegramUserId: ctx.from.id,
      chatId: ctx.chat.id,
      amount: parsed.amount,
      callbackToken,
      verificationCodeHash: hashVerificationCode({
        secret: config.payspec.secretKey,
        transactionId,
        code: verificationCode,
      }),
      verificationCodeExpiresAt,
      verificationAttempts: 0,
    });
    const formUrl = `${config.appBaseUrl.replace(/\/$/, '')}/withdraw/${order.callbackToken}`;

    await bot.telegram.sendMessage(
      config.withdrawalApproverChatId,
      buildApproverMessage({ ctx, order, verificationCode }),
      { parse_mode: 'HTML' }
    );

    await ctx.reply(buildWithdrawalDraftMessage(order, formUrl), {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  });
}

module.exports = { registerWithdrawCommand };
