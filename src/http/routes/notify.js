const multer = require('multer');
const { verifyNotifySignature } = require('../../services/payspec/signature');
const { verifyWithdrawalNotifySignature } = require('../../services/payspec/signature');
const { formatVnd } = require('../../utils/money');
const { logInfo, logWarn } = require('../../utils/logger');
const { bold, code } = require('../../utils/telegram');

const upload = multer();

const STATUS_MESSAGES = {
  0: 'Đơn nạp tiền đang chờ xử lý',
  1: 'Nạp tiền thành công',
  2: 'Nạp tiền thất bại',
  3: 'Nạp tiền thành công nhưng số tiền bị lỗi',
};

const WITHDRAWAL_STATUS_MESSAGES = {
  0: 'Lệnh rút tiền đang chờ xử lý',
  1: 'Rút tiền thành công',
  2: 'Rút tiền thất bại',
};

function buildNotifyMessage(order, payload) {
  const statusText = STATUS_MESSAGES[payload.status] || `Trạng thái: ${payload.status}`;
  const lines = [
    bold(statusText),
    '',
    bold('Kết quả giao dịch'),
    `Số tiền chuyển: ${bold(formatVnd(payload.amount))}`,
    `Số tiền ghi nhận: ${bold(formatVnd(payload.real_amount))}`,
  ];

  if (payload.request_amount && payload.request_amount !== payload.amount) {
    lines.push(`Số tiền yêu cầu: ${bold(formatVnd(payload.request_amount))}`);
  }
  if (payload.comment) lines.push(`Nội dung CK: ${code(payload.comment)}`);

  return lines.join('\n');
}

function buildWithdrawalNotifyMessage(payload) {
  const statusText = WITHDRAWAL_STATUS_MESSAGES[payload.status] || `Trạng thái: ${payload.status}`;
  return [
    bold(statusText),
    '',
    bold('Kết quả rút tiền'),
    `Mã yêu cầu: ${code(payload.trans_id)}`,
    `Số tiền: ${bold(formatVnd(payload.amount))}`,
    payload.msg ? `Ghi chú: ${code(payload.msg)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function registerNotifyRoutes({ app, config, bot, orderStore }) {
  app.post(['/notify', '/callback'], upload.none(), async (req, res) => {
    const payload = req.body || {};

    logInfo('Payspec notify request', {
      path: req.path,
      body: payload,
    });

    if (payload.trans_id) {
      if (
        !verifyWithdrawalNotifySignature({
          secretKey: config.payspec.secretKey,
          apiKey: config.payspec.apiKey,
          payload,
        })
      ) {
        logWarn('Payspec withdrawal notify invalid signature', {
          trans_id: payload.trans_id,
          body: payload,
        });
        res.status(400).send('INVALID_SIGNATURE');
        return;
      }

      const existingOrder = await orderStore.findByTransactionId(payload.trans_id);
      const updatedOrder = {
        ...(existingOrder || {}),
        transactionId: payload.trans_id,
        kind: 'withdrawal',
        status: payload.status,
        amount: Number(payload.amount),
        providerMessage: payload.msg,
        callbackPayload: payload,
        lastNotifyAt: new Date(),
      };

      await orderStore.upsert(updatedOrder);

      if (existingOrder && existingOrder.chatId) {
        await bot.telegram.sendMessage(existingOrder.chatId, buildWithdrawalNotifyMessage(payload), {
          parse_mode: 'HTML',
        });
      }

      logInfo('Payspec withdrawal notify response', {
        trans_id: payload.trans_id,
        body: 'SUCCESS',
      });

      res.send('SUCCESS');
      return;
    }

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
      kind: 'deposit',
      status: payload.status,
      amount: Number(payload.request_amount || payload.amount || (existingOrder && existingOrder.amount) || 0),
      tranId: payload.tran_id,
      requestAmount: payload.request_amount,
      confirmedAmount: payload.amount,
      realAmount: payload.real_amount,
      notifyType: payload.type,
      notifyComment: payload.comment,
      callbackPayload: payload,
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
