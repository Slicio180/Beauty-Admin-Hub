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
      return error('INVALID_NAME', 'Skriv ett giltigt fullständigt namn.');
    }
    const matches = master.filter(name => key(name) === key(entered));
    if (matches.length > 1) return error('AMBIGUOUS_NAME', 'Flera spelarposter har samma namn. Be arrangören om hjälp.');
    const existing = matches[0] === undefined ? null : clean(matches[0]);
    if (selected !== NEW && !existing) return error('UNKNOWN_PLAYER', 'Välj ditt namn i listan eller lägg till en ny spelare.');
    const alreadyIn = name => tonight.some(player => key(player) === key(name));
    const choice = input.identityChoice || '';
    if (choice && !['existing', 'different'].includes(choice)) return error('INVALID_CHOICE', 'Välj vem du är.');
    const conflict = existing && (selected === NEW || alreadyIn(existing));
    if (choice && (!conflict || key(input.identityBase) !== key(existing))) {
      return error('STALE_IDENTITY', 'Namnvalet har ändrats. Börja om med ditt namn.');
    }
    if (conflict && !choice) return { ...error('NAME_CONFLICT', 'Det här namnet finns redan i listan.'),
      baseName: existing, alreadyRegistered: alreadyIn(existing) };
    if (choice === 'different') {
      const detail = clean(input.identityDetail);
      if (!detail || detail.length > 60 || /[()<>\x00-\x1f\x7f]/.test(detail) || /^[=+@-]/.test(detail)) {
        return { ...error('INVALID_DETAIL', 'Skriv ditt mellannamn, smeknamn eller en annan uppgift.'), baseName: existing };
      }
      // Parentheses preserve the entered full name without guessing which word is a surname.
      const candidate = existing + ' (' + detail + ')';
      if (candidate.length > 120) return { ...error('INVALID_DETAIL', 'Namnet och tillägget är för långt.'), baseName: existing };
      if (master.some(name => key(name) === key(candidate))) return { ...error('DETAIL_IN_USE',
        'Det namnet med tillägg finns redan. Välj det i spelarlistan om det är du, eller ange ett annat tillägg.'), baseName: existing };
      if (clean(input.identityConfirmedName) !== candidate) return { ...error('CONFIRM_NAME', 'Bekräfta hur ditt namn ska visas.'), baseName: existing, proposedName: candidate };
      return { success: true, player: candidate, isNew: true };
    }
    if (existing && alreadyIn(existing)) return error('ALREADY_REGISTERED', 'Du är redan anmäld till den här spelkvällen.');
    return { success: true, player: existing || entered, isNew: !existing };
  }
  return Object.freeze({ clean, key, resolve, newPlayerOption: NEW });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BeautyNameResolution;
