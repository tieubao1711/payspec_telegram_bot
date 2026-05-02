function formatVnd(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return `${value} VND`;
  }

  return `${new Intl.NumberFormat('vi-VN').format(number)} VND`;
}

module.exports = { formatVnd };
