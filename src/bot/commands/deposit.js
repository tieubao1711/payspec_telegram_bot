const { createPartnerTransactionId } = require('../../services/payspec/transactionId');
const { formatVnd } = require('../../utils/money');
const { bold, code, escapeHtml } = require('../../utils/telegram');

const MIN_DEPOSIT = 10000;
const MAX_DEPOSIT = 300000000;

function parseDepositAmount(text) {
  const parts = text.trim().split(/\s+/);
  const rawAmount = parts[1];

  if (!rawAmount) {
    return { error: 'Vui long nhap so tien. Vi du: /naptien 50000' };
  }

  if (parts.length > 2) {
    return { error: 'Lenh khong hop le. Vi du dung: /naptien 50000' };
  }

  const normalized = rawAmount.replace(/[,.]/g, '');
  if (!/^\d+$/.test(normalized)) {
    return { error: 'So tien khong hop le. Vi du dung: /naptien 50000' };
  }

  const amount = Number(normalized);
  if (!Number.isSafeInteger(amount) || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
    return {
      error: `So tien nap phai tu ${formatVnd(MIN_DEPOSIT)} den ${formatVnd(MAX_DEPOSIT)}.`,
    };
  }

  return { amount };
}

function buildPaymentMessage(order) {
  const lines = [
    `${bold('THÔNG TIN XÁC MINH')}`,
    '',
    `So tien: ${bold(formatVnd(order.amount))}`,
  ];

  if (order.typeBank) lines.push(`Ngân hàng: ${bold(String(order.typeBank).toUpperCase())}`);
  if (order.accountNumber) lines.push(`Số tài khoản: ${code(order.accountNumber)}`);
  if (order.accountName) lines.push(`Chủ tài khoản: ${bold(order.accountName)}`);

  if (order.comment) {
    lines.push(`${bold('Nội dung chuyển khoản')}`, code(order.comment));
  }

  lines.push(
    '',
    'Vui lòng chuyển đúng số tiền và nội dung trên.'
  );
  return lines.join('\n');
}

function getQrBuffer(qrBase64) {
  if (!qrBase64) return null;

  const normalized = qrBase64.includes(',') ? qrBase64.split(',').pop() : qrBase64;
  return Buffer.from(normalized, 'base64');
}

async function sendPaymentInstructions(ctx, order) {
  const qrBuffer = getQrBuffer(order.qrBase64);

  await ctx.reply(buildPaymentMessage(order), {
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  });

  if (qrBuffer) {
    await ctx.replyWithPhoto({ source: qrBuffer });
  }
}

function registerDepositCommand({ bot, payspecClient, orderStore }) {
  bot.command('naptien', async (ctx) => {
    const messageText = ctx.message && ctx.message.text ? ctx.message.text : '';
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const parsed = parseDepositAmount(messageText);

    if (parsed.error) {
      await ctx.reply(parsed.error);
      return;
    }

    const transactionId = createPartnerTransactionId(userId);

    try {
      const payment = await payspecClient.createDepositOrder({
        amount: String(parsed.amount),
        transactionId,
      });

      const order = {
        transactionId,
        telegramUserId: userId,
        chatId,
        amount: parsed.amount,
        status: payment.status === 'success' ? '0' : payment.status,
        tranId: payment.tran_id,
        typeBank: payment.type_bank,
        accountNumber: payment.stk,
        accountName: payment.name,
        comment: payment.comment,
        qr: payment.qr,
        qrBase64: payment.qr_base64,
        paymentUrl: payment.url_pay,
        providerMessage: payment.msg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await orderStore.upsert(order);

      await sendPaymentInstructions(ctx, order);
    } catch (error) {
      console.error('Create deposit order failed:', error);
      await ctx.reply(`Khong tao duoc don nap tien: ${error.message}`);
    }
  });
}

module.exports = { registerDepositCommand };
