# Paysec Telegram Bot

Bot Telegram tao don nap tien qua Payspec.

## Cai dat

```bash
npm install
cp .env.example .env
npm start
```

## Chay bang PM2

App chi can mot process de chay ca Telegram bot va HTTP callback server.

```bash
npm install -g pm2
npm run pm2:start
npm run pm2:logs
```

Lenh quan ly:

```bash
npm run pm2:restart
npm run pm2:stop
pm2 status
```

Neu muon PM2 tu khoi dong lai sau khi server reboot:

```bash
pm2 startup
pm2 save
```

Can cau hinh cac bien trong `.env`:

- `TELEGRAM_BOT_TOKEN`: token bot Telegram.
- `PAYSPEC_API_KEY`: API key Payspec.
- `PAYSPEC_SECRET_KEY`: secret key dung de ky MD5.
- `PAYSPEC_CALLBACK_URL`: URL public tro ve endpoint `/notify`.
- `APP_BASE_URL`: domain public dung de tao link form rut tien.
- `MONGODB_URI`: connection string MongoDB.
- `WITHDRAWAL_APPROVER_CHAT_ID`: chat ID Telegram nhan ma xac thuc rut tien. Dung lenh `/myid` de lay ID.
- `PAYSPEC_API_BASE_URL`: mac dinh `https://payspec.club`.
- `PAYSPEC_PAYMENT_TYPE`: mac dinh `bank`.
- `PAYSPEC_TYPE_BANK`: mac dinh `0`. Neu Payspec cap ma ngan hang rieng, thay bang ma do.

## Lenh Telegram

```text
/naptien 50000
/ruttien 50000
/thongke
/thongke week
/thongke month
/chotdoanhthu
```

So tien hop le: 10,000 - 300,000,000 VND.

Lenh `/ruttien amount` tao mot yeu cau nhap trong MongoDB va gui link form
`/withdraw/:token` de nguoi dung nhap ngan hang, so tai khoan, ten chu tai
khoan. Bot gui ma xac thuc ve `WITHDRAWAL_APPROVER_CHAT_ID`; form phai nhap
dung ma nay moi goi API Payspec `/chargingws/bank/v3`.

Lenh `/thongke` chi cho `WITHDRAWAL_APPROVER_CHAT_ID` xem. Thong ke chi tinh
don nap tien callback thanh cong trong gio Viet Nam:

- `/thongke`: hom nay
- `/thongke week`: tuan nay, bat dau tu thu Hai
- `/thongke month`: thang nay

Lenh `/chotdoanhthu` luu moc chot vao MongoDB collection
`revenue_checkpoints`. Du lieu don trong `payment_orders` van giu nguyen,
nhung cac lenh `/thongke` sau do chi tinh doanh thu nap tien phat sinh sau moc
chot gan nhat.

## Bao cao doanh thu toan bo

Script nay doc truc tiep MongoDB va khong bi anh huong boi moc
`/chotdoanhthu`:

```bash
npm run report:revenue
```

## Callback

Payspec goi `POST /notify` hoac `POST /callback` voi content type
`application/x-www-form-urlencoded` cho nap tien, hoac `multipart/form-data`
cho rut tien.

Bot xac thuc signature:

```text
MD5(secret_key|status|comment|tran_id|type|request_amount|amount|real_amount|transaction_id)
```

Rut tien xac thuc callback bang MD5 hoac HMAC:

```text
MD5(apikey|status|amount|trans_id)
HMAC-SHA256(apikey|status|amount|trans_id, secret_key)
```

Neu hop le, server tra ve:

```text
SUCCESS
```

## Cau truc

```text
src/
  bot/                  Telegram commands
  config/               Environment configuration
  http/routes/          HTTP callback routes
  models/               MongoDB models
  services/payspec/     Payspec API client, signature, transaction id
  storage/              MongoDB repository
  utils/                Shared helpers
```
