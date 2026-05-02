const fs = require('fs/promises');
const path = require('path');

function createOrderStore(dataDir) {
  const filePath = path.resolve(dataDir, 'orders.json');

  async function readAll() {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async function writeAll(orders) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(orders, null, 2)}\n`, 'utf8');
  }

  async function init() {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await writeAll([]);
    }
  }

  async function upsert(order) {
    const orders = await readAll();
    const index = orders.findIndex((item) => item.transactionId === order.transactionId);

    if (index >= 0) {
      orders[index] = { ...orders[index], ...order };
    } else {
      orders.push(order);
    }

    await writeAll(orders);
    return index >= 0 ? orders[index] : order;
  }

  async function findByTransactionId(transactionId) {
    const orders = await readAll();
    return orders.find((order) => order.transactionId === transactionId) || null;
  }

  return {
    init,
    upsert,
    findByTransactionId,
  };
}

module.exports = { createOrderStore };
