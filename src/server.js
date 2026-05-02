const express = require('express');
const { registerNotifyRoutes } = require('./http/routes/notify');
const { registerWithdrawRoutes } = require('./http/routes/withdraw');

function createApp({ config, bot, payspecClient, orderStore }) {
  const app = express();

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  registerNotifyRoutes({ app, config, bot, orderStore });
  registerWithdrawRoutes({ app, config, bot, payspecClient, orderStore });

  return app;
}

module.exports = { createApp };
