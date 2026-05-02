const SENSITIVE_KEYS = new Set(['apikey', 'signature', 'qr_base64']);

function maskValue(value) {
  if (value === undefined || value === null) return value;

  const text = String(value);
  if (text.length <= 8) return '***';

  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function redact(value) {
  if (!value || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      SENSITIVE_KEYS.has(key) ? maskValue(entryValue) : redact(entryValue),
    ])
  );
}

function logInfo(label, payload) {
  console.log(`[${new Date().toISOString()}] ${label}`, redact(payload));
}

function logWarn(label, payload) {
  console.warn(`[${new Date().toISOString()}] ${label}`, redact(payload));
}

module.exports = {
  logInfo,
  logWarn,
  redact,
};
