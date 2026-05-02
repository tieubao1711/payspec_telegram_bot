const axios = require('axios');
const { createDepositSignature } = require('./signature');
const { logInfo, logWarn } = require('../../utils/logger');

function createPayspecClient(config) {
  const http = axios.create({
    baseURL: config.baseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async function createDepositOrder({ amount, transactionId }) {
    const payload = {
      apikey: config.apiKey,
      type: config.paymentType,
      amount,
      transaction_id: transactionId,
      type_bank: config.typeBank,
      url_callback: config.callbackUrl,
      signature: createDepositSignature({
        secretKey: config.secretKey,
        apiKey: config.apiKey,
        type: config.paymentType,
        amount,
        transactionId,
      }),
    };

    logInfo('Payspec create deposit request', {
      url: `${config.baseUrl}/API/v2/transaction/create`,
      body: payload,
    });

    try {
      const response = await http.post('/API/v2/transaction/create', payload);
      const data = response.data;

      logInfo('Payspec create deposit response', {
        statusCode: response.status,
        body: data,
      });

      if (!data || data.status !== 'success') {
        throw new Error(data && data.msg ? data.msg : 'Payspec returned an invalid response');
      }

      return data;
    } catch (error) {
      if (error.response) {
        logWarn('Payspec create deposit error response', {
          statusCode: error.response.status,
          body: error.response.data,
        });
      } else {
        logWarn('Payspec create deposit request failed', {
          message: error.message,
        });
      }

      throw error;
    }
  }

  return { createDepositOrder };
}

module.exports = { createPayspecClient };
