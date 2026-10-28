/* Generated English Hub copy; Swedish remote/kiosk source is preserved. */
/* One accessible conflict/confirmation dialog shared by Hub, remote and kiosk. */
var BeautyIdentityDialog = (() => {
  function open(conflict) {
    return new Promise(resolve => {
      const previousFocus = document.activeElement;
      const make = (tag, cls, text) => {
        const el = document.createElement(tag); el.className = cls;
        if (text !== undefined) el.textContent = text;
        return el;
      };
      const overlay = make('div', 'identity-overlay');
      const dialog = make('section', 'identity-dialog');
      dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', 'This name already exists');
      const close = make('button', 'identity-close', '×');
      close.type = 'button'; close.setAttribute('aria-label', 'Close');
      const title = make('h2', '', 'This name already exists');
      const name = make('p', 'identity-name', conflict.baseName);
      const help = make('p', '', 'This name is already on the list. Choose THAT IS ME if it is you. If you are a different person, add your middle name, nickname or another detail so we can tell you apart.');
      const me = make('button', 'identity-action', 'THAT IS ME'); me.type = 'button';
      const other = make('button', 'identity-action', 'I AM A DIFFERENT PERSON'); other.type = 'button';
      const area = make('div', 'identity-detail-area'); area.hidden = true;
      const label = make('label', '', 'Middle name, nickname or another identifying detail');
      const input = make('input', 'identity-detail'); input.type = 'text'; input.maxLength = 60;
      input.setAttribute('aria-label', 'Middle name, nickname or another identifying detail');
      label.appendChild(input);
      const info = make('p', 'identity-info'); info.setAttribute('role', 'status');
      if (conflict.code !== 'NAME_CONFLICT') info.textContent = conflict.error || '';
      const preview = make('p', 'identity-preview');
      const proceed = make('button', 'identity-action', 'CONTINUE'); proceed.type = 'button';
      const cancel = make('button', 'identity-cancel', 'CANCEL'); cancel.type = 'button';
      let proposed = '', finished = false;
      const finish = value => {
        if (finished) return; finished = true;
        document.removeEventListener('keydown', onKey);
        overlay.remove(); previousFocus?.focus?.(); resolve(value);
      };
      const onKey = event => {
        if (event.key === 'Escape') { event.preventDefault(); finish(null); }
        if (event.key === 'Tab') {
          const buttons = [close, me, other, ...(area.hidden ? [] : [input, proceed]), cancel];
          const first = buttons[0], last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      };
      close.addEventListener('click', () => finish(null)); cancel.addEventListener('click', () => finish(null));
      overlay.addEventListener('click', event => { if (event.target === overlay) finish(null); });
      me.addEventListener('click', () => finish({ identityChoice: 'existing', identityBase: conflict.baseName }));
      other.addEventListener('click', () => { area.hidden = false; input.focus(); });
      input.addEventListener('input', () => { proposed = ''; preview.textContent = ''; proceed.textContent = 'CONTINUE'; info.textContent = ''; });
      proceed.addEventListener('click', () => {
        const detail = BeautyNameResolution.clean(input.value);
        const result = BeautyNameResolution.resolve({ selectedName: BeautyNameResolution.newPlayerOption,
          newName: conflict.baseName, identityChoice: 'different', identityBase: conflict.baseName,
          identityDetail: detail }, [conflict.baseName], []);
        if (result.code !== 'CONFIRM_NAME') { info.textContent = result.error; return; }
        if (proposed !== result.proposedName) {
          proposed = result.proposedName; preview.textContent = 'You will be registered as: ' + proposed;
          info.textContent = 'Check the name and press CONFIRM.'; proceed.textContent = 'CONFIRM'; return;
        }
        finish({ identityChoice: 'different', identityBase: conflict.baseName,
          identityDetail: detail, identityConfirmedName: proposed });
      });
      area.appendChild(label); area.appendChild(preview); area.appendChild(proceed);
      for (const el of [close, title, name, help, me, other, area, info, cancel]) dialog.appendChild(el);
      overlay.appendChild(dialog); document.body.appendChild(overlay);
      document.addEventListener('keydown', onKey); close.focus();
    });
  }
  async function submit(send, initial) {
    let data = { ...initial };
    for (;;) {
      // Only explicit user choices can resubmit. Transport errors are never retried.
      const result = await send(data);
      if (!result || !['NAME_CONFLICT', 'INVALID_DETAIL', 'DETAIL_IN_USE', 'CONFIRM_NAME'].includes(result.code)) return result;
      const choice = await open(result);
      if (!choice) return { success: false, code: 'CANCELLED' };
      data = { ...initial, ...choice };
    }
  }
  return Object.freeze({ open, submit });
})();
