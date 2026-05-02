require('dotenv').config();

const requiredEnv = [
  'TELEGRAM_BOT_TOKEN',
  'PAYSPEC_API_KEY',
  'PAYSPEC_SECRET_KEY',
  'PAYSPEC_CALLBACK_URL',
  'APP_BASE_URL',
  'MONGODB_URI',
];

function getMissingEnv() {
  return requiredEnv.filter((key) => !process.env[key]);
}

const missingEnv = getMissingEnv();

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const config = {
  port: Number(process.env.PORT || 3000),
  dataDir: process.env.DATA_DIR || './data',
  appBaseUrl: process.env.APP_BASE_URL || '',
  mongodbUri: process.env.MONGODB_URI,
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
  payspec: {
    apiKey: process.env.PAYSPEC_API_KEY,
    secretKey: process.env.PAYSPEC_SECRET_KEY,
    baseUrl: process.env.PAYSPEC_API_BASE_URL || 'https://payspec.club',
    callbackUrl: process.env.PAYSPEC_CALLBACK_URL,
    paymentType: process.env.PAYSPEC_PAYMENT_TYPE || 'bank',
    typeBank: process.env.PAYSPEC_TYPE_BANK || '0',
  },
};

module.exports = { config };
