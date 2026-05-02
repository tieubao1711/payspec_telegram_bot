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
- `PAYSPEC_API_BASE_URL`: mac dinh `https://payspec.club`.
- `PAYSPEC_PAYMENT_TYPE`: mac dinh `bank`.
- `PAYSPEC_TYPE_BANK`: mac dinh `0`. Neu Payspec cap ma ngan hang rieng, thay bang ma do.

## Lenh Telegram

```text
/naptien 50000
```

So tien hop le: 10,000 - 300,000,000 VND.

## Callback

Payspec goi `POST /notify` hoac `POST /callback` voi content type
`application/x-www-form-urlencoded`.

Bot xac thuc signature:

```text
MD5(secret_key|status|comment|tran_id|type|request_amount|amount|real_amount|transaction_id)
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
  services/payspec/     Payspec API client, signature, transaction id
  storage/              JSON order storage
  utils/                Shared helpers
```
