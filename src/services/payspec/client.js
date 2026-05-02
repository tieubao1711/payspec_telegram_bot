const axios = require('axios');
const { createDepositSignature, createWithdrawalSignature } = require('./signature');
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

      return {
        ...data,
        requestPayload: payload,
        responsePayload: data,
      };
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

  async function createWithdrawalOrder({ amount, transactionId, bank, accountName, accountNumber }) {
    const unixTime = Math.floor(Date.now() / 1000).toString();
    const payload = {
      apikey: config.apiKey,
      amount: Number(amount),
      bank,
      name: accountName,
      account_number: accountNumber,
      trans_id: transactionId,
      unix_time: unixTime,
      signature: createWithdrawalSignature({
        secretKey: config.secretKey,
        apiKey: config.apiKey,
        accountNumber,
        accountName,
        bank,
        amount: Number(amount),
        transactionId,
        unixTime,
      }),
      url_callback: config.callbackUrl,
      callback_use_hmac: '1',
    };

    logInfo('Payspec create withdrawal request', {
      url: `${config.baseUrl}/chargingws/bank/v3`,
      body: payload,
    });

    try {
      const response = await http.post('/chargingws/bank/v3', payload);
      const data = response.data;

      logInfo('Payspec create withdrawal response', {
        statusCode: response.status,
        body: data,
      });

      if (!data || data.status !== 'success') {
        throw new Error(data && data.msg ? data.msg : 'Payspec returned an invalid withdrawal response');
      }

      return {
        requestPayload: payload,
        responsePayload: data,
      };
    } catch (error) {
      if (error.response) {
        logWarn('Payspec create withdrawal error response', {
          statusCode: error.response.status,
          body: error.response.data,
        });
      } else {
        logWarn('Payspec create withdrawal request failed', {
          message: error.message,
        });
      }

      throw error;
    }
  }

  return { createDepositOrder, createWithdrawalOrder };
}

module.exports = { createPayspecClient };
