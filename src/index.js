const { createApp } = require('./server');
const { createBot } = require('./bot');
const { config } = require('./config');
const { createOrderStore } = require('./storage/orderStore');
const { createPayspecClient } = require('./services/payspec/client');
const { connectMongo, disconnectMongo } = require('./db/mongoose');

async function main() {
  await connectMongo(config.mongodbUri, {
    retries: config.mongodbConnectRetries,
    retryMs: config.mongodbConnectRetryMs,
  });

  const orderStore = createOrderStore();

  const payspecClient = createPayspecClient(config.payspec);
  const bot = createBot({ config, payspecClient, orderStore });
  const app = createApp({ config, bot, payspecClient, orderStore });

  app.listen(config.port, () => {
    console.log(`HTTP server listening on port ${config.port}`);
  });

  await bot.launch();
  console.log('Telegram bot polling started');

  process.once('SIGINT', () => {
    bot.stop('SIGINT');
    disconnectMongo().finally(() => {});
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    disconnectMongo().finally(() => {});
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
