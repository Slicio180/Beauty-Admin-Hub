/* Accidental-change review guard. This is not authentication or a write API. */
var BeautyEventDateGuard = (() => {
  function validDate(value) {
    if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function canReview(state) {
    return state.loaded === true && state.blocked === false && validDate(state.currentDate) &&
      validDate(state.newDate) && state.newDate !== state.currentDate &&
      state.acknowledged === true;
  }
  return Object.freeze({ validDate, canReview });
})();
if (typeof module !== 'undefined') module.exports = BeautyEventDateGuard;
