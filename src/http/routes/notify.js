const { verifyNotifySignature } = require('../../services/payspec/signature');
const { formatVnd } = require('../../utils/money');
const { logInfo, logWarn } = require('../../utils/logger');
const { bold, code } = require('../../utils/telegram');

const STATUS_MESSAGES = {
  0: 'Don nap tien dang cho xu ly',
  1: 'Nap tien thanh cong',
  2: 'Nap tien that bai',
  3: 'Nap tien thanh cong nhung so tien bi loi',
};

function buildNotifyMessage(order, payload) {
  const statusText = STATUS_MESSAGES[payload.status] || `Trang thai: ${payload.status}`;
  const lines = [
    `${bold(statusText)}`,
    '',
    `${bold('Ket qua giao dich')}`,
    `Ma don: ${code(payload.transaction_id)}`,
    `Ma GD Payspec: ${code(payload.tran_id)}`,
    `So tien yeu cau: ${bold(formatVnd(payload.request_amount))}`,
    `So tien xac nhan: ${bold(formatVnd(payload.amount))}`,
    `Thuc nhan: ${bold(formatVnd(payload.real_amount))}`,
  ];

  if (payload.comment) lines.push(`Noi dung CK: ${code(payload.comment)}`);
  if (order && order.providerMessage) lines.push(`Ghi chu: ${code(order.providerMessage)}`);

  return lines.join('\n');
}

function registerNotifyRoutes({ app, config, bot, orderStore }) {
  app.post(['/notify', '/callback'], async (req, res) => {
    const payload = req.body || {};

    logInfo('Payspec notify request', {
      path: req.path,
      body: payload,
    });

    if (!verifyNotifySignature(config.payspec.secretKey, payload)) {
      logWarn('Payspec notify invalid signature', {
        transaction_id: payload.transaction_id,
        body: payload,
      });
      res.status(400).send('INVALID_SIGNATURE');
      return;
    }

    const existingOrder = await orderStore.findByTransactionId(payload.transaction_id);
    const updatedOrder = {
      ...(existingOrder || {}),
      transactionId: payload.transaction_id,
      status: payload.status,
      tranId: payload.tran_id,
      requestAmount: payload.request_amount,
      confirmedAmount: payload.amount,
      realAmount: payload.real_amount,
      notifyType: payload.type,
      notifyComment: payload.comment,
      lastNotifyAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await orderStore.upsert(updatedOrder);

    if (existingOrder && existingOrder.chatId) {
      await bot.telegram.sendMessage(existingOrder.chatId, buildNotifyMessage(existingOrder, payload), {
        parse_mode: 'HTML',
      });
    }

    logInfo('Payspec notify response', {
      transaction_id: payload.transaction_id,
      body: 'SUCCESS',
    });

    res.send('SUCCESS');
  });
}

module.exports = { registerNotifyRoutes };
