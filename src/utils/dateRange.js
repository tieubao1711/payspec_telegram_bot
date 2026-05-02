const VIETNAM_OFFSET_MINUTES = 7 * 60;

function zonedNowParts() {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + VIETNAM_OFFSET_MINUTES * 60 * 1000);

  return {
    year: vietnamTime.getUTCFullYear(),
    month: vietnamTime.getUTCMonth(),
    date: vietnamTime.getUTCDate(),
    day: vietnamTime.getUTCDay(),
  };
}

function vietnamLocalDateToUtc({ year, month, date }) {
  return new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - VIETNAM_OFFSET_MINUTES * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getStatsRange(period) {
  const now = zonedNowParts();
  let startDate = now.date;

  if (period === 'week') {
    const mondayBasedDay = now.day === 0 ? 6 : now.day - 1;
    startDate = now.date - mondayBasedDay;
  }

  if (period === 'month') {
    startDate = 1;
  }

  const from = vietnamLocalDateToUtc({
    year: now.year,
    month: now.month,
    date: startDate,
  });

  let to;
  if (period === 'month') {
    to = vietnamLocalDateToUtc({
      year: now.year,
      month: now.month + 1,
      date: 1,
    });
  } else if (period === 'week') {
    to = addDays(from, 7);
  } else {
    to = addDays(from, 1);
  }

  return { from, to };
}

module.exports = { getStatsRange };
