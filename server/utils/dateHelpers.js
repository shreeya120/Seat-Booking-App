const parseTimeToDate = (dateStr, timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
};

const computeBookingDatetimes = (bookingDate, startTime, endTime) => {
  const startDatetime = parseTimeToDate(bookingDate, startTime);
  let endDatetime = parseTimeToDate(bookingDate, endTime);
  const crossesMidnight = endTime <= startTime;
  if (crossesMidnight) endDatetime.setDate(endDatetime.getDate() + 1);
  const durationHours = (endDatetime - startDatetime) / (1000 * 60 * 60);
  return { startDatetime, endDatetime, crossesMidnight, durationHours };
};

const hasOverlap = (existingStart, existingEnd, newStart, newEnd, bufferMs = 3600000) => {
  return (
    new Date(existingStart).getTime() - bufferMs < new Date(newEnd).getTime() &&
    new Date(existingEnd).getTime() + bufferMs > new Date(newStart).getTime()
  );
};

module.exports = { parseTimeToDate, computeBookingDatetimes, hasOverlap };
