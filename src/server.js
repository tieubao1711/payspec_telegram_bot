const express = require('express');
const { registerNotifyRoutes } = require('./http/routes/notify');

function createApp({ config, bot, orderStore }) {
  const app = express();

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  registerNotifyRoutes({ app, config, bot, orderStore });

  return app;
}

module.exports = { createApp };
