/* Pure calendar/CellData helpers for the future guarded TEST adapter.
 * No service access or write runner. Never pass the mock noon-UTC Date to Sheets.
 */
var BeautyEventDate = (() => {
  function leapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  function monthDays(year, month) {
    return month === 2 ? (leapYear(year) ? 29 : 28)
      : ([4, 6, 9, 11].includes(month) ? 30 : 31);
  }
  // Zero-based Gregorian day number; all arithmetic stays within safe integers.
  function yearStart(year) {
    const previous = year - 1;
    return 365 * previous + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400);
  }
  // Google Sheets: day 0 is 1899-12-30. There is no fictitious 1900-02-29.
  const EPOCH_DAY = yearStart(1900) - 2;
  // Match Event Control's existing four-digit date contract (1000..9999).
  const MIN_SERIAL = yearStart(1000) - EPOCH_DAY;
  const MAX_SERIAL = yearStart(10000) - 1 - EPOCH_DAY;

  function encode(date) {
    if (typeof date !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('INVALID_EVENT_DATE: expected a calendar date YYYY-MM-DD (1000..9999).');
    }
    const year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7)), day = Number(date.slice(8, 10));
    if (month < 1 || month > 12 || day < 1 || day > monthDays(year, month)) {
      throw new Error('INVALID_EVENT_DATE: impossible Gregorian calendar date.');
    }
    let serial = yearStart(year) + day - 1 - EPOCH_DAY;
    for (let m = 1; m < month; m++) serial += monthDays(year, m);
    return serial;
  }

  function decode(serial) {
    // Reject timestamps/fractions and coercible values; never round a readback.
    if (!Number.isSafeInteger(serial) || serial < MIN_SERIAL || serial > MAX_SERIAL) {
      throw new Error('INVALID_EVENT_SERIAL: expected an integer date-only serial in the supported range.');
    }
    const ordinal = serial + EPOCH_DAY;
    let low = 1000, high = 10000;
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (yearStart(middle) <= ordinal) low = middle;
      else high = middle;
    }
    let day = ordinal - yearStart(low) + 1, month = 1;
    while (day > monthDays(low, month)) day -= monthDays(low, month++);
    return low + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function controlDateCell(date) {
    // A2 CellData for a future Sheets UpdateCells request: numeric, never RAW/
    // USER_ENTERED date text or a Date instance. Only userEnteredValue is supplied;
    // the future writer must mask that field to preserve formatting/validation.
    // This payload grants no write permission and performs no I/O.
    return { userEnteredValue: { numberValue: encode(date) } };
  }
  return Object.freeze({ encode, decode, controlDateCell });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BeautyEventDate;
