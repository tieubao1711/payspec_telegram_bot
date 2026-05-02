function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function code(value) {
  return `<code>${escapeHtml(value)}</code>`;
}

function bold(value) {
  return `<b>${escapeHtml(value)}</b>`;
}

module.exports = {
  bold,
  code,
  escapeHtml,
};
