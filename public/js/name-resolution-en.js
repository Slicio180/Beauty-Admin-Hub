/* Generated English Hub copy; Swedish remote/kiosk source is preserved. */
/* Shared, pure name-conflict rules. No service access and no writes. */
var BeautyNameResolution = (() => {
  const NEW = 'MITT NAMN FINNS INTE I LISTAN';
  const clean = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const key = value => clean(value).toLocaleLowerCase('sv-SE');
  const error = (code, message) => ({ success: false, code, error: message });
  function resolve(input, master, tonight) {
    const selected = clean(input.selectedName);
    const entered = clean(selected === NEW ? input.newName : selected);
    if (!entered || entered.length > 120 || /^[=+@-]/.test(entered) || /[\x00-\x1f\x7f]/.test(entered)) {
      return error('INVALID_NAME', 'Enter a valid full name.');
    }
    const matches = master.filter(name => key(name) === key(entered));
    if (matches.length > 1) return error('AMBIGUOUS_NAME', 'Several player records have this name. Please ask the organiser for help.');
    const existing = matches[0] === undefined ? null : clean(matches[0]);
    if (selected !== NEW && !existing) return error('UNKNOWN_PLAYER', 'Select your name or add a new player.');
    const alreadyIn = name => tonight.some(player => key(player) === key(name));
    const choice = input.identityChoice || '';
    if (choice && !['existing', 'different'].includes(choice)) return error('INVALID_CHOICE', 'Choose who you are.');
    const conflict = existing && (selected === NEW || alreadyIn(existing));
    if (choice && (!conflict || key(input.identityBase) !== key(existing))) {
      return error('STALE_IDENTITY', 'The selected name has changed. Start again with your name.');
    }
    if (conflict && !choice) return { ...error('NAME_CONFLICT', 'This name is already on the list.'),
      baseName: existing, alreadyRegistered: alreadyIn(existing) };
    if (choice === 'different') {
      const detail = clean(input.identityDetail);
      if (!detail || detail.length > 60 || /[()<>\x00-\x1f\x7f]/.test(detail) || /^[=+@-]/.test(detail)) {
        return { ...error('INVALID_DETAIL', 'Enter your middle name, nickname or another identifying detail.'), baseName: existing };
      }
      // Parentheses preserve the entered full name without guessing which word is a surname.
      const candidate = existing + ' (' + detail + ')';
      if (candidate.length > 120) return { ...error('INVALID_DETAIL', 'The name and identifying detail are too long.'), baseName: existing };
      if (master.some(name => key(name) === key(candidate))) return { ...error('DETAIL_IN_USE',
        'This name with that detail already exists. Select it if it is you, or enter a different detail.'), baseName: existing };
      if (clean(input.identityConfirmedName) !== candidate) return { ...error('CONFIRM_NAME', 'Confirm how your name will be displayed.'), baseName: existing, proposedName: candidate };
      return { success: true, player: candidate, isNew: true };
    }
    if (existing && alreadyIn(existing)) return error('ALREADY_REGISTERED', 'You are already registered for this event.');
    return { success: true, player: existing || entered, isNew: !existing };
  }
  return Object.freeze({ clean, key, resolve, newPlayerOption: NEW });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BeautyNameResolution;
