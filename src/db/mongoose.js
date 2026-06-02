const mongoose = require('mongoose');

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function connectMongo(uri, options = {}) {
  const retries = options.retries ?? 30;
  const retryMs = options.retryMs ?? 5000;

  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected');
      return;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      console.error(
        `MongoDB connection failed (${attempt}/${retries}): ${error.message}`
      );

      if (isLastAttempt) {
        throw error;
      }

      await wait(retryMs);
    }
  }
}

async function disconnectMongo() {
  await mongoose.disconnect();
}

module.exports = {
  connectMongo,
  disconnectMongo,
};
