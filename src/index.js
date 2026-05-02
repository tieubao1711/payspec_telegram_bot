const { createApp } = require('./server');
const { createBot } = require('./bot');
const { config } = require('./config');
const { createOrderStore } = require('./storage/orderStore');
const { createPayspecClient } = require('./services/payspec/client');

async function main() {
  const orderStore = createOrderStore(config.dataDir);
  await orderStore.init();

  const payspecClient = createPayspecClient(config.payspec);
  const bot = createBot({ config, payspecClient, orderStore });
  const app = createApp({ config, bot, orderStore });

  await bot.launch();

  app.listen(config.port, () => {
    console.log(`HTTP server listening on port ${config.port}`);
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
