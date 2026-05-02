const { formatVnd } = require('../../utils/money');

const BANK_OPTIONS = [
  'ACB',
  'VIETCOMBANK',
  'AGRIBANK',
  'BIDV',
  'SACOMBANK',
  'TECHCOMBANK',
  'TPBANK',
  'VPBANK',
  'MBBANK',
  'VIETINBANK',
  'VIB',
  'MOMO',
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageLayout({ title, body }) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      color: #14171a;
    }
    main {
      width: min(480px, calc(100% - 32px));
      margin: 32px auto;
      background: #fff;
      border: 1px solid #dde3ea;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(20, 23, 26, 0.08);
    }
    h1 { margin: 0 0 8px; font-size: 24px; }
    .amount { font-size: 28px; font-weight: 700; margin: 18px 0; }
    .muted { color: #5b6673; font-size: 14px; line-height: 1.5; }
    label { display: block; margin: 16px 0 6px; font-weight: 700; }
    input, select {
      width: 100%;
      height: 44px;
      padding: 0 12px;
      border: 1px solid #cbd5df;
      border-radius: 6px;
      font-size: 16px;
      background: #fff;
    }
    button {
      width: 100%;
      height: 46px;
      margin-top: 22px;
      border: 0;
      border-radius: 6px;
      background: #0f766e;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .error {
      padding: 12px;
      border-radius: 6px;
      background: #fff1f2;
      color: #be123c;
      margin: 14px 0;
    }
    .success {
      padding: 12px;
      border-radius: 6px;
      background: #ecfdf5;
      color: #047857;
      margin: 14px 0;
    }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function renderWithdrawalForm(order, error = '') {
  const bankOptions = BANK_OPTIONS.map(
    (bank) => `<option value="${bank}"${order.bank === bank ? ' selected' : ''}>${bank}</option>`
  ).join('');
  const errorHtml = error ? `<div class="error">${escapeHtml(error)}</div>` : '';

  return pageLayout({
    title: 'Rut tien',
    body: `
      <h1>Rut tien</h1>
      <p class="muted">Nhap dung thong tin tai khoan nhan tien.</p>
      <div class="amount">${escapeHtml(formatVnd(order.amount))}</div>
      ${errorHtml}
      <form method="post">
        <label for="bank">Ngan hang</label>
        <select id="bank" name="bank" required>${bankOptions}</select>

        <label for="accountNumber">So tai khoan</label>
        <input id="accountNumber" name="accountNumber" value="${escapeHtml(order.accountNumber)}" autocomplete="off" required>

        <label for="accountName">Ten chu tai khoan</label>
        <input id="accountName" name="accountName" value="${escapeHtml(order.accountName)}" autocomplete="name" required>

        <button type="submit">Tao lenh rut tien</button>
      </form>
      <p class="muted">Ma yeu cau: ${escapeHtml(order.transactionId)}</p>
    `,
  });
}

function renderSuccess(order) {
  return pageLayout({
    title: 'Da tao lenh rut tien',
    body: `
      <h1>Da tao lenh rut tien</h1>
      <div class="success">Yeu cau rut tien da duoc gui sang Payspec.</div>
      <div class="amount">${escapeHtml(formatVnd(order.amount))}</div>
      <p><strong>Ngan hang:</strong> ${escapeHtml(order.bank)}</p>
      <p><strong>So tai khoan:</strong> ${escapeHtml(order.accountNumber)}</p>
      <p><strong>Chu tai khoan:</strong> ${escapeHtml(order.accountName)}</p>
      <p class="muted">Trang thai se duoc gui ve Telegram khi Payspec callback.</p>
    `,
  });
}

function validateWithdrawalForm(body) {
  const bank = String(body.bank || '').trim().toUpperCase();
  const accountNumber = String(body.accountNumber || '').trim();
  const accountName = String(body.accountName || '').trim().replace(/\s+/g, ' ').toUpperCase();

  if (!bank) return { error: 'Vui long chon ngan hang.' };
  if (!/^[A-Z0-9 _-]{2,40}$/.test(bank)) return { error: 'Ma ngan hang khong hop le.' };
  if (!/^\d{4,30}$/.test(accountNumber)) return { error: 'So tai khoan khong hop le.' };
  if (accountName.length < 3 || accountName.length > 80) {
    return { error: 'Ten chu tai khoan khong hop le.' };
  }

  return { bank, accountNumber, accountName };
}

function registerWithdrawRoutes({ app, bot, payspecClient, orderStore }) {
  app.get('/withdraw/:token', async (req, res) => {
    const order = await orderStore.findByCallbackToken(req.params.token);

    if (!order || order.kind !== 'withdrawal') {
      res.status(404).send(pageLayout({ title: 'Khong tim thay', body: '<h1>Khong tim thay yeu cau</h1>' }));
      return;
    }

    if (order.status !== 'draft') {
      res.send(renderSuccess(order));
      return;
    }

    res.send(renderWithdrawalForm(order));
  });

  app.post('/withdraw/:token', async (req, res) => {
    const order = await orderStore.findByCallbackToken(req.params.token);

    if (!order || order.kind !== 'withdrawal') {
      res.status(404).send(pageLayout({ title: 'Khong tim thay', body: '<h1>Khong tim thay yeu cau</h1>' }));
      return;
    }

    if (order.status !== 'draft') {
      res.send(renderSuccess(order));
      return;
    }

    const parsed = validateWithdrawalForm(req.body || {});
    if (parsed.error) {
      res.status(400).send(renderWithdrawalForm({ ...order, ...req.body }, parsed.error));
      return;
    }

    try {
      const payout = await payspecClient.createWithdrawalOrder({
        amount: order.amount,
        transactionId: order.transactionId,
        bank: parsed.bank,
        accountName: parsed.accountName,
        accountNumber: parsed.accountNumber,
      });
      const responsePayload = payout.responsePayload;
      const updatedOrder = await orderStore.upsert({
        ...order,
        ...parsed,
        status: '0',
        providerOrderId: responsePayload.id_topup ? String(responsePayload.id_topup) : undefined,
        providerMessage: responsePayload.msg,
        requestPayload: payout.requestPayload,
        responsePayload,
      });

      if (order.chatId) {
        await bot.telegram.sendMessage(
          order.chatId,
          [
            '<b>DA GUI LENH RUT TIEN</b>',
            '',
            `So tien: <b>${formatVnd(updatedOrder.amount)}</b>`,
            `Ngan hang: <b>${escapeHtml(updatedOrder.bank)}</b>`,
            `So tai khoan: <code>${escapeHtml(updatedOrder.accountNumber)}</code>`,
            `Chu tai khoan: <b>${escapeHtml(updatedOrder.accountName)}</b>`,
            '',
            'Trang thai hien tai: dang cho xu ly.',
          ].join('\n'),
          { parse_mode: 'HTML' }
        );
      }

      res.send(renderSuccess(updatedOrder));
    } catch (error) {
      res.status(502).send(renderWithdrawalForm({ ...order, ...parsed }, error.message));
    }
  });
}

module.exports = { registerWithdrawRoutes };
