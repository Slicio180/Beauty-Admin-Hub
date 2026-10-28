function doGet(e) {
  if (!BEAUTY_IDENTITY_APPROVED_SCRIPT_ || ScriptApp.getScriptId() !== BEAUTY_IDENTITY_APPROVED_SCRIPT_) {
    throw new Error('Identity candidate TEST project is not provisioned.');
  }
  if (Object.keys(e?.parameter || {}).some(key => key !== 'page')) throw new Error('Candidate configuration rejected.');
  const page = e?.parameter?.page || '';
  if (!['', 'remote'].includes(page)) throw new Error('Candidate serves registration pages only.');
  return HtmlService.createHtmlOutputFromFile(page === 'remote' ? 'RemoteRegistration' : 'Kiosk');
}
/* CANDIDATE ONLY. No live deployment. Dedicated TEST provisioning and qualification pending. */
const BEAUTY_IDENTITY_WRITES_ENABLED_ = true;
const BEAUTY_IDENTITY_APPROVED_SCRIPT_ = '1m4H1l36CL4YFl8GwcZ2tC3pbrkefol9Zg8gJvhyzcQA49xbAWmljaPSN'; // Dedicated kiosk TEST project.
function submitRegistration(data) {
  if (BEAUTY_IDENTITY_WRITES_ENABLED_ !== true || !BEAUTY_IDENTITY_APPROVED_SCRIPT_ ||
      ScriptApp.getScriptId() !== BEAUTY_IDENTITY_APPROVED_SCRIPT_) {
    return { success: false, code: 'BLOCKED', error: 'TEST-kandidaten är inte aktiverad.' };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { success: false, code: 'BUSY', error: 'Försök igen om en stund.' };
  try { return submitRegistrationIdentityCandidate_(data || {}); } finally { lock.releaseLock(); }
}
function syncMasterListToGoogleForm() { return { skipped: true, reason: 'Candidate: no Google Form mutation.' }; }
function registerPlayerWithN01_() { return { skipped: true, reason: 'Candidate: no Nakka mutation.' }; }
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

/*
========================================================
AIK MÅNDAGSDARTARNA KIOSK
========================================================

MASTER PLAYER LIST:
PLAYER'S MASTER LIST

REGISTRATION SHEET:
Form responses 2

SYSTEM:

PLAYER'S MASTER LIST
        ↓
      KIOSK
        ↓
Form responses 2
        ↓
TONIGHT'S PLAYERS

MANUAL MASTER LIST EDITS:
- Automatically remove blanks
- Automatically remove duplicates
- Automatically sort Swedish alphabetically
- Automatically synchronize Google Form backup

NEW KIOSK PLAYERS:
- Saved in Form responses 2
- Added to PLAYER'S MASTER LIST
- Master List sorted automatically
- Google Form backup synchronized

========================================================
*/

const SHEET_ID =
  '1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';

const FORM_ID =
  '1UxEr_KeHzhispG7Zu6E74Hh29OIqD6XxwR4UFwYEFOQ';

const NAME_QUESTION =
  'VÄLJ DITT NAMN';

const NEW_NAME_QUESTION =
  'Skriv ditt fullständiga namn';

const NEW_PLAYER_OPTION =
  'MITT NAMN FINNS INTE I LISTAN';

const MASTER_SHEET =
  "PLAYER'S MASTER LIST";

const RESPONSE_SHEET =
  'Form responses 2';


/*
========================================================
GOOGLE FORM SUBMISSION
========================================================

Handles registrations made through the
original Google Form.

If somebody registers as a new player,
their name is added to PLAYER'S MASTER LIST.

The Google Form is then synchronized with
the Master List.

========================================================
*/

function onFormSubmit(e) {

  if (
    !e ||
    !e.namedValues
  ) {
    return;
  }

  const newNameValue =
    e.namedValues[
      NEW_NAME_QUESTION
    ];

  if (
    !newNameValue ||
    !newNameValue[0]
  ) {
    return;
  }

  const name =
    String(
      newNameValue[0]
    ).trim();

  if (!name) {
    return;
  }

  addPlayerToMasterList_(
    name
  );

  syncMasterListToGoogleForm();
}


/*
========================================================
CREATE FORM SUBMISSION TRIGGER
========================================================

Your trigger already exists.

DO NOT run this during normal operation.

========================================================
*/

function setupTrigger() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const triggers =
    ScriptApp.getProjectTriggers();

  for (
    const trigger of triggers
  ) {

    if (
      trigger.getHandlerFunction() ===
      'onFormSubmit'
    ) {

      ScriptApp.deleteTrigger(
        trigger
      );
    }
  }

  ScriptApp
    .newTrigger(
      'onFormSubmit'
    )
    .forSpreadsheet(
      spreadsheet
    )
    .onFormSubmit()
    .create();
}


/*
========================================================
KIOSK WEB APP
========================================================
*/

function originalIdentityDoGet_(e) {

  const requestedPage =
    e && e.parameter
      ? String(
          e.parameter.page || ''
        ).toLowerCase()
      : '';

  let page = 'Kiosk';

  if (
    requestedPage === 'fonttest'
  ) {
    page = 'FontTest';
  }

  if (
    requestedPage === 'remote'
  ) {
    page = 'RemoteRegistration';
  }

  return HtmlService
    .createTemplateFromFile(
      page
    )
    .evaluate()
    .setTitle(
      page === 'FontTest'
        ? 'AIK FONT TEST'
        : page === 'RemoteRegistration'
          ? 'AIK MÅNDAGSDARTARNA – ANMÄL DIG'
          : 'AIK MÅNDAGSDARTARNA – ANMÄLAN'
    )
    .setXFrameOptionsMode(
      HtmlService
        .XFrameOptionsMode
        .ALLOWALL
    );
}


/*
========================================================
GET PLAYER NAMES FOR KIOSK
========================================================

The kiosk reads player names directly from:

PLAYER'S MASTER LIST

A1 = PLAYERS
A2 downward = names

========================================================
*/

function getPlayerNames() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      MASTER_SHEET
    );

  if (!sheet) {

    throw new Error(
      'Could not find sheet: ' +
      MASTER_SHEET
    );
  }

  const lastRow =
    sheet.getLastRow();

  let names = [];

  if (
    lastRow >= 2
  ) {

    names =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getValues()
        .flat()
        .map(
          value =>
            String(value).trim()
        )
        .filter(
          value => value
        );
  }

  /*
  Remove special option if somebody
  accidentally typed it into Master List.
  */

  names =
    names.filter(
      name =>
        name !==
        NEW_PLAYER_OPTION
    );

  /*
  Remove duplicates.
  */

  names =
    removeDuplicateNames_(
      names
    );

  /*
  Swedish alphabetical order.
  */

  names.sort(
    swedishSort_
  );

  /*
  Special option always at bottom.
  */

  names.push(
    NEW_PLAYER_OPTION
  );

  return names;
}


/*
========================================================
SAVE KIOSK REGISTRATION
========================================================

Writes directly to:

Form responses 2

A = Timestamp
B = VÄLJ DITT NAMN
C = Skriv ditt fullständiga namn
D = Foto- och videomedgivande
E = Meddelande

========================================================
*/

function submitRegistrationIdentityCandidate_(
  data
) {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      RESPONSE_SHEET
    );

  if (!sheet) {

    throw new Error(
      'Could not find sheet: ' +
      RESPONSE_SHEET
    );
  }


  /*
  ======================================================
  CLEAN VALUES
  ======================================================
  */

  let selectedName =
    String(
      data.selectedName || ''
    ).trim();

  let newName =
  String(
    data.newName || ''
  )
    .trim()
    .toLocaleLowerCase('sv-SE')
    .replace(
      /(^|[\s-])\p{L}/gu,
      letter => letter.toLocaleUpperCase('sv-SE')
    );

  const consent =
    String(
      data.consent || ''
    ).trim();

  const message =
    String(
      data.message || ''
    ).trim();

const source =
  String(
    data.source || ''
  ).trim();
  /*
  ======================================================
  VALIDATION
  ======================================================
  */

  if (
    !selectedName
  ) {

    throw new Error(
      'Du måste välja ditt namn.'
    );
  }

  if (
    selectedName ===
      NEW_PLAYER_OPTION &&
    !newName
  ) {

    throw new Error(
      'Skriv ditt fullständiga namn.'
    );
  }

  if (
    consent !==
      'JA, JAG GODKÄNNER' &&
    consent !==
      'NEJ, JAG GODKÄNNER INTE'
  ) {

    throw new Error(
      'Välj JA eller NEJ för foto och video.'
    );
  }


  /*
  ======================================================
  SAVE REGISTRATION
  ======================================================
  */
  const master = spreadsheet.getSheetByName(MASTER_SHEET);
  const tonight = spreadsheet.getSheetByName("TONIGHT'S PLAYERS");
  if (!master || !tonight) throw new Error('Spelarlistan kunde inte läsas.');
  const masterNames = master.getLastRow() < 2 ? [] : master.getRange(2, 1, master.getLastRow() - 1, 1).getDisplayValues().flat();
  const tonightNames = tonight.getLastRow() < 2 ? [] : tonight.getRange(2, 1, tonight.getLastRow() - 1, 2).getDisplayValues().flat().filter(Boolean);
  const decision = BeautyNameResolution.resolve({ ...data, selectedName, newName }, masterNames, tonightNames);
  if (!decision.success) return decision;
  selectedName = decision.isNew ? NEW_PLAYER_OPTION : decision.player;
  newName = decision.isNew ? decision.player : '';
  sheet.appendRow([
    new Date(),

    selectedName,

    selectedName ===
      NEW_PLAYER_OPTION
        ? newName
        : '',

    consent,

    message,
source
  ]);

  SpreadsheetApp.flush();


  /*
  ======================================================
  NEW PLAYER
  ======================================================

  If a new player registered through
  the kiosk:

  1. Add to Master List
  2. Sort Master List
  3. Synchronize Google Form backup

  ======================================================
  */

  if (
    selectedName ===
      NEW_PLAYER_OPTION &&
    newName
  ) {

    addPlayerToMasterList_(
      newName
    );

    syncMasterListToGoogleForm();
  }


  /*
  ======================================================
  N01 REGISTRATION
  ======================================================
  */

  const n01PlayerName =
    selectedName ===
      NEW_PLAYER_OPTION
        ? newName
        : selectedName;


  /*
  ======================================================
  TONIGHT'S PLAYERS - DEFAULT STATUS
  ======================================================
  */

  updatePlayerStatusData_(
  n01PlayerName,
  consent,
  message,
  source
);

  syncTonightStatusDisplay_(
    n01PlayerName
  );


  try {

    registerPlayerWithN01_(
      n01PlayerName
    );

  } catch (n01Error) {

    console.error(
      'n01 registration failed for ' +
      n01PlayerName +
      ': ' +
      n01Error
    );
  }


  /*
  ======================================================
  SUCCESS RESPONSE TO KIOSK
  ======================================================
  */

  return {
    success: true,

    player:
      selectedName ===
        NEW_PLAYER_OPTION
          ? newName
          : selectedName
  };
}


/*
========================================================
ADD PLAYER TO MASTER LIST
========================================================
*/

function addPlayerToMasterList_(
  name
) {

  name =
    String(
      name || ''
    ).trim();

  if (!name) {
    return;
  }

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      MASTER_SHEET
    );

  if (!sheet) {

    throw new Error(
      'Could not find sheet: ' +
      MASTER_SHEET
    );
  }

  const lastRow =
    sheet.getLastRow();

  let names = [];

  if (
    lastRow >= 2
  ) {

    names =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getValues()
        .flat()
        .map(
          value =>
            String(value).trim()
        )
        .filter(
          value => value
        );
  }


  /*
  Remove special option.
  */

  names =
    names.filter(
      player =>
        player !==
        NEW_PLAYER_OPTION
    );


  /*
  Check duplicate.
  */

  const alreadyExists =
    names.some(
      existingName =>
        existingName
          .toLowerCase() ===
        name
          .toLowerCase()
    );

  if (
    !alreadyExists
  ) {

    names.push(
      name
    );
  }


  /*
  Clean duplicates.
  */

  names =
    removeDuplicateNames_(
      names
    );


  /*
  Sort.
  */

  names.sort(
    swedishSort_
  );


  /*
  Rewrite Master List.
  */

  writeMasterList_(
    sheet,
    names
  );
}


/*
========================================================
AUTOMATIC MASTER LIST EDIT
========================================================

Your installed On Edit trigger calls this.

Whenever you manually:

ADD
EDIT
DELETE

a name in Column A of:

PLAYER'S MASTER LIST

the system automatically:

1. Cleans the list
2. Removes duplicates
3. Sorts alphabetically
4. Synchronizes the Google Form backup

========================================================
*/

function onEdit(e) {

  /*
  Safety check.
  */

  if (
    !e ||
    !e.range
  ) {
    return;
  }

  const sheet =
    e.range.getSheet();


  /*
  ========================================================
  BEAUTY 1.4 - NEW EVENT STATUS RESET
  ========================================================

  When Control!A2 changes to a new event date:

  1. TONIGHT'S PLAYERS recalculates
  2. Old visible STATUS values are cleared
  3. Status column is rebuilt only for players
     actually visible tonight

  ========================================================
  */

  if (
    sheet.getName() === 'Control' &&
    e.range.getA1Notation() === 'A2'
  ) {

    /*
    BEAUTY 1.7
    Clean event-specific player data while
    preserving permanent OLD NAME corrections.
    */

    resetPlayerEventData_();
    sheet.getRange('B2').setValue(new Date());

    SpreadsheetApp.flush();

    Utilities.sleep(
      1000
    );

    syncTonightStatusDisplay_();

    return;
  }


  /*
  ======================================================
  TONIGHT'S PLAYERS - MANUAL STATUS
  ======================================================
  */

  if (
    sheet.getName() === "TONIGHT'S PLAYERS" &&
    e.range.getColumn() === 3 &&
    e.range.getRow() >= 2
  ) {

    const playerName =
      String(
        sheet
          .getRange(
            e.range.getRow(),
            1
          )
          .getDisplayValue() || ''
      ).trim();

    const status =
      String(
        e.range.getValue() || ''
      ).trim();

    if (
      playerName &&
      status
    ) {

      updatePlayerStatusOnly_(
        playerName,
        status
      );
    }

    return;
  }


  /*
  ======================================================
  ONLY MASTER LIST
  ======================================================
  */

  if (
    sheet.getName() !==
    MASTER_SHEET
  ) {
    return;
  }


  /*
  ======================================================
  ONLY COLUMN A
  ======================================================
  */

  if (
    e.range.getColumn() > 1 ||
    e.range.getLastColumn() < 1
  ) {
    return;
  }


  /*
  ======================================================
  IGNORE HEADER
  ======================================================
  */

  if (
    e.range.getLastRow() < 2
  ) {
    return;
  }


  /*
  ========================================================
  BEAUTY 1.3 - SMART PLAYER RENAME
  ========================================================
  */

  if (
    e.range.getNumRows() === 1 &&
    e.range.getNumColumns() === 1 &&
    e.oldValue !== undefined &&
    e.value !== undefined
  ) {

    const oldPlayerName =
      String(
        e.oldValue || ''
      ).trim();

    const newPlayerName =
      String(
        e.value || ''
      ).trim();

    if (
      oldPlayerName &&
      newPlayerName &&
      oldPlayerName !== newPlayerName
    ) {

      renamePlayerEverywhere_(
        oldPlayerName,
        newPlayerName
      );
    }
  }


  /*
  ======================================================
  READ MASTER LIST
  ======================================================
  */

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return;
  }

  let names =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues()
      .flat()
      .map(
        value =>
          String(value).trim()
      )
      .filter(
        value => value
      );


  /*
  ======================================================
  REMOVE SPECIAL OPTION
  ======================================================
  */

  names =
    names.filter(
      name =>
        name !==
        NEW_PLAYER_OPTION
    );


  /*
  ======================================================
  REMOVE DUPLICATES
  ======================================================
  */

  names =
    removeDuplicateNames_(
      names
    );


  /*
  ======================================================
  SWEDISH ALPHABETICAL SORT
  ======================================================
  */

  names.sort(
    swedishSort_
  );


  /*
  ======================================================
  REWRITE MASTER LIST
  ======================================================
  */

  writeMasterList_(
    sheet,
    names
  );


  /*
  ======================================================
  AUTOMATIC GOOGLE FORM SYNCHRONIZATION
  ======================================================

  Any manual change to the Master List
  now automatically updates the original
  Google Form dropdown.

  ======================================================
  */

  syncMasterListToGoogleForm();
}
/*
========================================================
CREATE MASTER LIST EDIT TRIGGER
========================================================

YOU ALREADY HAVE THIS TRIGGER.

DO NOT run this during normal operation.

Only use it if the onEdit trigger is ever
deleted in the future.

========================================================
*/

function setupMasterListEditTrigger() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const triggers =
    ScriptApp.getProjectTriggers();

  for (
    const trigger of triggers
  ) {

    if (
      trigger.getHandlerFunction() ===
      'onEdit'
    ) {

      ScriptApp.deleteTrigger(
        trigger
      );
    }
  }

  ScriptApp
    .newTrigger(
      'onEdit'
    )
    .forSpreadsheet(
      spreadsheet
    )
    .onEdit()
    .create();
}


/*
========================================================
SYNC MASTER LIST TO GOOGLE FORM
========================================================

This rebuilds the original Google Form
player dropdown using the Master List.

It can still be run manually if ever needed,
but normal Master List edits now call it
automatically.

========================================================
*/

function originalSyncMasterListToGoogleForm_() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const masterSheet =
    spreadsheet.getSheetByName(
      MASTER_SHEET
    );

  if (!masterSheet) {

    throw new Error(
      'Could not find sheet: ' +
      MASTER_SHEET
    );
  }


  /*
  ======================================================
  READ MASTER LIST
  ======================================================
  */

  const lastRow =
    masterSheet.getLastRow();

  let names = [];

  if (
    lastRow >= 2
  ) {

    names =
      masterSheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getValues()
        .flat()
        .map(
          value =>
            String(value).trim()
        )
        .filter(
          value => value
        );
  }


  /*
  ======================================================
  CLEAN MASTER LIST
  ======================================================
  */

  names =
    names.filter(
      name =>
        name !==
        NEW_PLAYER_OPTION
    );

  names =
    removeDuplicateNames_(
      names
    );

  names.sort(
    swedishSort_
  );


  /*
  ======================================================
  REWRITE CLEAN MASTER LIST
  ======================================================
  */

  writeMasterList_(
    masterSheet,
    names
  );


  /*
  ======================================================
  OPEN GOOGLE FORM
  ======================================================
  */

  const form =
    FormApp.openById(
      FORM_ID
    );

  const nameQuestion =
    getFormNameQuestion_(
      form
    );

  if (
    !nameQuestion
  ) {

    throw new Error(
      'Could not find the question: ' +
      NAME_QUESTION
    );
  }


  /*
  ======================================================
  FIND FORM SECTIONS
  ======================================================
  */

  const pageBreaks =
    form.getItems(
      FormApp.ItemType.PAGE_BREAK
    );

  if (
    pageBreaks.length < 2
  ) {

    throw new Error(
      'Could not find the required form sections.'
    );
  }

  const section2 =
    pageBreaks[0]
      .asPageBreakItem();

  const section3 =
    pageBreaks[1]
      .asPageBreakItem();


  /*
  ======================================================
  CREATE PLAYER CHOICES
  ======================================================
  */

  const choices =
    names.map(
      name =>
        nameQuestion.createChoice(
          name,
          section3
        )
    );


  /*
  ======================================================
  NEW PLAYER OPTION
  ======================================================

  Always last.

  Routes to the new-player section.

  ======================================================
  */

  choices.push(

    nameQuestion.createChoice(
      NEW_PLAYER_OPTION,
      section2
    )

  );


  /*
  ======================================================
  UPDATE GOOGLE FORM
  ======================================================
  */

  nameQuestion.setChoices(
    choices
  );

  SpreadsheetApp.flush();
}


/*
========================================================
FIND GOOGLE FORM NAME QUESTION
========================================================

Supports either:

Dropdown

or

Multiple Choice

========================================================
*/

function getFormNameQuestion_(
  form
) {

  let nameQuestion =
    null;


  /*
  ======================================================
  CHECK DROPDOWN
  ======================================================
  */

  const dropdownItems =
    form.getItems(
      FormApp.ItemType.LIST
    );

  for (
    const item of dropdownItems
  ) {

    const question =
      item.asListItem();

    if (
      question
        .getTitle()
        .trim() ===
      NAME_QUESTION
    ) {

      nameQuestion =
        question;

      break;
    }
  }


  /*
  ======================================================
  CHECK MULTIPLE CHOICE
  ======================================================
  */

  if (
    !nameQuestion
  ) {

    const multipleChoiceItems =
      form.getItems(
        FormApp.ItemType.MULTIPLE_CHOICE
      );

    for (
      const item of
        multipleChoiceItems
    ) {

      const question =
        item.asMultipleChoiceItem();

      if (
        question
          .getTitle()
          .trim() ===
        NAME_QUESTION
      ) {

        nameQuestion =
          question;

        break;
      }
    }
  }

  return nameQuestion;
}


/*
========================================================
WRITE MASTER LIST
========================================================

A1 = PLAYERS

A1 is NEVER touched.

The player list starts at A2.

========================================================
*/

function writeMasterList_(
  sheet,
  names
) {

  const lastRow =
    sheet.getLastRow();


  /*
  ======================================================
  CLEAR OLD LIST
  ======================================================
  */

  if (
    lastRow > 1
  ) {

    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .clearContent();
  }


  /*
  ======================================================
  WRITE NEW LIST
  ======================================================
  */

  if (
    names.length > 0
  ) {

    sheet
      .getRange(
        2,
        1,
        names.length,
        1
      )
      .setValues(

        names.map(
          name => [name]
        )

      );
  }

  SpreadsheetApp.flush();
}


/*
========================================================
REMOVE DUPLICATE PLAYER NAMES
========================================================

Case-insensitive.

Example:

John Andersson

and

JOHN ANDERSSON

are considered the same player.

========================================================
*/

function removeDuplicateNames_(
  names
) {

  const uniqueNames =
    [];

  names.forEach(
    name => {

      const cleanName =
        String(
          name
        ).trim();

      if (
        !cleanName
      ) {
        return;
      }

      const exists =
        uniqueNames.some(
          existingName =>
            existingName
              .toLowerCase() ===
            cleanName
              .toLowerCase()
        );

      if (
        !exists
      ) {

        uniqueNames.push(
          cleanName
        );
      }
    }
  );

  return uniqueNames;
}


/*
========================================================
SWEDISH ALPHABETICAL SORTING
========================================================

Uses Swedish sorting rules including:

Å
Ä
Ö

========================================================
*/

function swedishSort_(
  a,
  b
) {

  return a.localeCompare(
    b,
    'sv',
    {
      sensitivity: 'base'
    }
  );
}


/*
========================================================
ONE-TIME IMPORT FROM GOOGLE FORM
========================================================

ALREADY USED.

DO NOT run this during normal operation.

This function only remains here as an
emergency tool if the Master List ever
needs to be rebuilt from the Google Form.

========================================================
*/

function importPlayersToMasterList() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      MASTER_SHEET
    );

  if (!sheet) {

    throw new Error(
      'Could not find sheet: ' +
      MASTER_SHEET
    );
  }

  const form =
    FormApp.openById(
      FORM_ID
    );

  const nameQuestion =
    getFormNameQuestion_(
      form
    );

  if (
    !nameQuestion
  ) {

    throw new Error(
      'Could not find the question: ' +
      NAME_QUESTION
    );
  }

  let names =
    nameQuestion
      .getChoices()
      .map(
        choice =>
          choice
            .getValue()
            .trim()
      )
      .filter(
        name =>
          name &&
          name !==
            NEW_PLAYER_OPTION
      );

  names =
    removeDuplicateNames_(
      names
    );

  names.sort(
    swedishSort_
  );

  writeMasterList_(
    sheet,
    names
  );
}
/*
========================================================
N01 LEAGUE → MASTER LIST SYNC
========================================================
*/

function syncN01LeagueToMasterList() {

  const LEAGUE_ID = 'lg_tM2v_3523';

  const properties =
    PropertiesService.getScriptProperties();

  const apiUser =
    properties.getProperty(
      'N01_API_USER'
    );

  const apiPassword =
    properties.getProperty(
      'N01_API_PASSWORD'
    );

  if (
    !apiUser ||
    !apiPassword
  ) {

    throw new Error(
      'n01 API credentials are missing.'
    );
  }

  const auth =
    Utilities.base64Encode(
      apiUser + ':' + apiPassword
    );


  /*
  ==========================================================
  GET N01 LEAGUE PLAYERS
  ==========================================================
  */

  const url =
    'https://push.n01darts.com/api/v1/league/entry/list?lgid=' +
    encodeURIComponent(
      LEAGUE_ID
    );

  const response =
    UrlFetchApp.fetch(
      url,
      {
        method: 'get',

        headers: {
          Authorization:
            'Basic ' + auth
        },

        muteHttpExceptions: true
      }
    );

  if (
    response.getResponseCode() !== 200
  ) {

    throw new Error(
      'Could not read n01 league players. STATUS: ' +
      response.getResponseCode()
    );
  }

  const data =
    JSON.parse(
      response.getContentText()
    );

  if (
    data.result !== 0
  ) {

    throw new Error(
      'n01 rejected league player request: ' +
      response.getContentText()
    );
  }

  const players =
    Array.isArray(
      data.list
    )
      ? data.list
      : [];


  /*
  ========================================================
  BEAUTY 1.7 - APPLY PLAYER NAME CORRECTIONS
  ========================================================

  PLAYER STATUS DATA:

  A = CORRECT PLAYER NAME
  B = OLD NAME
  C = STATUS
  D = FOTO&VIDEO
  E = MEDDELANDE

  If n01 sends an OLD NAME, Beauty replaces it
  with the corrected PLAYER name before rebuilding
  PLAYER'S MASTER LIST.

  ========================================================
  */

  const ssForCorrections =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const statusSheetForCorrections =
    ssForCorrections.getSheetByName(
      'PLAYER STATUS DATA'
    );

  const nameCorrections =
    new Map();

  if (
    statusSheetForCorrections &&
    statusSheetForCorrections.getLastRow() >= 2
  ) {

    const correctionData =
      statusSheetForCorrections
        .getRange(
          2,
          1,
          statusSheetForCorrections.getLastRow() - 1,
          5
        )
        .getDisplayValues();

    correctionData.forEach(
      row => {

        const correctName =
          String(
            row[0] || ''
          ).trim();

        /*
        BEAUTY 1.7:
        OLD NAME is column B = row[1].
        */

        const oldName =
          String(
            row[1] || ''
          ).trim();

        if (
          correctName &&
          oldName
        ) {

          nameCorrections.set(
            oldName.toLocaleLowerCase(
              'sv'
            ),
            correctName
          );
        }
      }
    );
  }

  const names =
    players
      .map(
        player => {

          const n01Name =
            String(
              player.name || ''
            ).trim();

          if (
            !n01Name
          ) {
            return '';
          }

          return (
            nameCorrections.get(
              n01Name.toLocaleLowerCase(
                'sv'
              )
            ) || n01Name
          );
        }
      )
      .filter(
        name => name
      );


  /*
  ==========================================================
  SORT + REMOVE DUPLICATES
  ==========================================================
  */

  const cleanNames =
    removeDuplicateNames_(
      names
    );

  cleanNames.sort(
    swedishSort_
  );


  /*
  ==========================================================
  REPLACE PLAYER'S MASTER LIST
  ==========================================================
  */

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      "PLAYER'S MASTER LIST"
    );

  if (
    !sheet
  ) {

    throw new Error(
      "PLAYER'S MASTER LIST sheet not found."
    );
  }

  writeMasterList_(
    sheet,
    cleanNames
  );


  /*
  ==========================================================
  UPDATE GOOGLE FORM / KIOSK / MOBILE DROPDOWN
  ==========================================================
  */

  syncMasterListToGoogleForm();

  console.log(
    'n01 → Master List sync complete. ' +
    cleanNames.length +
    ' players synchronized.'
  );
}

/*
========================================================
REGISTER PLAYER WITH N01 - RELIABLE VERSION
========================================================
*/

function originalRegisterPlayerWithN01_(
  playerName
) {

  const EVENT_ID =
    getN01EventIdFromControlDate_();

  const LEAGUE_ID =
    'lg_tM2v_3523';

  const cleanName =
    String(
      playerName || ''
    ).trim();

  if (!cleanName) {
    throw new Error(
      'No player name supplied to n01.'
    );
  }

  const properties =
    PropertiesService.getScriptProperties();

  const apiUser =
    properties.getProperty(
      'N01_API_USER'
    );

  const apiPassword =
    properties.getProperty(
      'N01_API_PASSWORD'
    );

  if (
    !apiUser ||
    !apiPassword
  ) {
    throw new Error(
      'n01 API credentials are missing.'
    );
  }

  const auth =
    Utilities.base64Encode(
      apiUser +
      ':' +
      apiPassword
    );

  const headers = {
    Authorization:
      'Basic ' + auth
  };

  const normalizedName =
    cleanName.toLocaleLowerCase();


  /*
  ========================================================
  RETRY GET REQUEST
  ========================================================

  Used for READ operations only.

  3 attempts:
  attempt 1
  wait 1 second
  attempt 2
  wait 2 seconds
  attempt 3
  ========================================================
  */

  function getWithRetry_(
    url,
    description
  ) {

    let lastCode = '';
    let lastBody = '';
    let lastError = '';

    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {

      try {

        const response =
          UrlFetchApp.fetch(
            url,
            {
              method: 'get',
              headers: headers,
              muteHttpExceptions: true
            }
          );

        lastCode =
          response.getResponseCode();

        lastBody =
          response.getContentText();

        if (lastCode === 200) {

          if (attempt > 1) {
            console.log(
              'n01 ' +
              description +
              ' succeeded on attempt ' +
              attempt +
              '.'
            );
          }

          return response;
        }

        lastError =
          'HTTP ' +
          lastCode +
          ': ' +
          lastBody;

      } catch (error) {

        lastError =
          String(
            error &&
            error.message
              ? error.message
              : error
          );
      }

      console.warn(
        'n01 ' +
        description +
        ' failed - attempt ' +
        attempt +
        '/3 - ' +
        lastError
      );

      if (attempt < 3) {

        Utilities.sleep(
          attempt * 1000
        );
      }
    }

    throw new Error(
      'n01 ' +
      description +
      ' failed after 3 attempts. ' +
      lastError
    );
  }


  /*
  ========================================================
  READ LEAGUE
  ========================================================
  */

  function readLeague_() {

    const response =
      getWithRetry_(
        'https://push.n01darts.com/api/v1/league/entry/list?lgid=' +
        encodeURIComponent(
          LEAGUE_ID
        ),
        'League read'
      );

    let data;

    try {

      data =
        JSON.parse(
          response.getContentText()
        );

    } catch (error) {

      throw new Error(
        'n01 League returned invalid JSON: ' +
        response.getContentText()
      );
    }

    return Array.isArray(
      data.list
    )
      ? data.list
      : [];
  }


  /*
  ========================================================
  FIND PLAYER
  ========================================================
  */

  function findLeaguePlayer_(
    players
  ) {

    return players.find(
      player =>
        String(
          player.name || ''
        )
          .trim()
          .toLocaleLowerCase() ===
        normalizedName
    );
  }


  /*
  ========================================================
  1. FIND PLAYER IN PERMANENT LEAGUE
  ========================================================
  */

  let leaguePlayers =
    readLeague_();

  let leaguePlayer =
    findLeaguePlayer_(
      leaguePlayers
    );


  /*
  ========================================================
  2. CREATE PLAYER IF MISSING
  ========================================================
  */

  if (!leaguePlayer) {

    console.log(
      cleanName +
      ' not found in n01 League. Creating player.'
    );

    let addResponse = null;
    let addError = '';

    try {

      addResponse =
        UrlFetchApp.fetch(
          'https://push.n01darts.com/api/v1/league/entry/update',
          {
            method: 'post',
            contentType: 'application/json',
            headers: headers,

            payload:
              JSON.stringify({
                lgid: LEAGUE_ID,
                add: [
                  {
                    name: cleanName
                  }
                ]
              }),

            muteHttpExceptions: true
          }
        );

        const addCode =
          addResponse.getResponseCode();

        const addBody =
          addResponse.getContentText();

        if (addCode !== 200) {

          addError =
            'HTTP ' +
            addCode +
            ': ' +
            addBody;

          console.warn(
            'n01 League add returned ' +
            addError +
            '. Verifying before retry.'
          );

        } else {

          console.log(
            'n01 League add response: ' +
            addBody
          );
        }

    } catch (error) {

      addError =
        String(
          error &&
          error.message
            ? error.message
            : error
        );

      console.warn(
        'n01 League add request error: ' +
        addError +
        '. Verifying before retry.'
      );
    }


    /*
    ======================================================
    VERIFY WHETHER FIRST ADD ACTUALLY WORKED
    ======================================================
    */

    Utilities.sleep(1000);

    leaguePlayers =
      readLeague_();

    leaguePlayer =
      findLeaguePlayer_(
        leaguePlayers
      );


    /*
    ======================================================
    IF STILL MISSING, ONE SAFE SECOND ADD
    ======================================================
    */

    if (!leaguePlayer) {

      console.warn(
        cleanName +
        ' still missing after first League add. ' +
        'Trying one more time.'
      );

      let secondResponse;

      try {

        secondResponse =
  UrlFetchApp.fetch(
    'https://push.n01darts.com/api/v1/league/entry/update',
    {
      method: 'post',
      contentType: 'application/json',
      headers: headers,

      payload:
        JSON.stringify({
          lgid: LEAGUE_ID,
          add: [
            {
              name: cleanName
            }
          ]
        }),

      muteHttpExceptions: true
    }
  );

        console.log(
          'n01 second League add: HTTP ' +
          secondResponse.getResponseCode() +
          ' - ' +
          secondResponse.getContentText()
        );

      } catch (error) {

        console.warn(
          'n01 second League add request error: ' +
          String(
            error &&
            error.message
              ? error.message
              : error
          )
        );
      }


      /*
      ====================================================
      FINAL LEAGUE VERIFICATION
      ====================================================
      */

      Utilities.sleep(1500);

      leaguePlayers =
        readLeague_();

      leaguePlayer =
        findLeaguePlayer_(
          leaguePlayers
        );

      if (!leaguePlayer) {

        throw new Error(
          'Could not add ' +
          cleanName +
          ' to n01 League after verification.' +
          (
            addError
              ? ' First error: ' + addError
              : ''
          )
        );
      }
    }
  }


  /*
  ========================================================
  3. GET LEAGUE ENTRY ID
  ========================================================
  */

  const leagueEntryId =
  leaguePlayer.lpid ||
  leaguePlayer.id ||
  leaguePlayer.entry_id ||
  leaguePlayer.entryId ||
  leaguePlayer.eid;

  if (!leagueEntryId) {

    throw new Error(
      'Could not determine n01 League entry ID for ' +
      cleanName
    );
  }


  /*
  ========================================================
  4. READ CURRENT EVENT
  ========================================================
  */

  function readEvent_() {

    const response =
      getWithRetry_(
        'https://push.n01darts.com/api/v1/tournament/entry/list?tdid=' +
        encodeURIComponent(
          EVENT_ID
        ),
        'current event read'
      );

    let data;

    try {

      data =
        JSON.parse(
          response.getContentText()
        );

    } catch (error) {

      throw new Error(
        'n01 event returned invalid JSON: ' +
        response.getContentText()
      );
    }

    return Array.isArray(
      data.list
    )
      ? data.list
      : [];
  }


  function playerIsInEvent_(
    players
  ) {

    return players.some(
      player =>
        String(
          player.name || ''
        )
          .trim()
          .toLocaleLowerCase() ===
        normalizedName
    );
  }


  let eventPlayers =
    readEvent_();


  /*
  ========================================================
  ALREADY REGISTERED
  ========================================================
  */

  if (
    playerIsInEvent_(
      eventPlayers
    )
  ) {

    console.log(
      cleanName +
      ' is already registered with current n01 event.'
    );

    return;
  }


  /*
  ========================================================
  5. ADD PLAYER TO CURRENT EVENT
  ========================================================
  */

  let eventAddError = '';

  try {

    const addEventResponse =
      UrlFetchApp.fetch(
        'https://push.n01darts.com/api/v1/tournament/entry/update',
        {
          method: 'post',
          contentType: 'application/json',
          headers: headers,

          payload:
            JSON.stringify({
              tdid: EVENT_ID,
              add: [
                {
                  name: cleanName,
                  lpid: leaguePlayer.lpid
                }
              ]
            }),

          muteHttpExceptions: true
        }
      );

    const eventCode =
      addEventResponse.getResponseCode();

    const eventBody =
      addEventResponse.getContentText();

    console.log(
      'n01 event add: HTTP ' +
      eventCode +
      ' - ' +
      eventBody
    );

    if (eventCode !== 200) {

      eventAddError =
        'HTTP ' +
        eventCode +
        ': ' +
        eventBody;
    }

  } catch (error) {

    eventAddError =
      String(
        error &&
        error.message
          ? error.message
          : error
      );

    console.warn(
      'n01 event add request error: ' +
      eventAddError
    );
  }


  /*
  ========================================================
  VERIFY EVENT ADD
  ========================================================
  */

  Utilities.sleep(1000);

  eventPlayers =
    readEvent_();

  if (
    playerIsInEvent_(
      eventPlayers
    )
  ) {

    console.log(
      cleanName +
      ' registered with current n01 event.'
    );

    return;
  }


  /*
  ========================================================
  ONE SAFE SECOND EVENT ADD
  ========================================================
  */

  console.warn(
    cleanName +
    ' not visible in event after first add. ' +
    'Trying one more time.'
  );

  try {

    const secondEventResponse =
      UrlFetchApp.fetch(
        'https://push.n01darts.com/api/v1/tournament/entry/update',
        {
          method: 'post',
          contentType: 'application/json',
          headers: headers,

          payload:
            JSON.stringify({
              tdid: EVENT_ID,
              add: [
                {
                  name: cleanName,
                  lpid: leaguePlayer.lpid
                }
              ]
            }),

          muteHttpExceptions: true
        }
      );

    console.log(
      'n01 second event add: HTTP ' +
      secondEventResponse.getResponseCode() +
      ' - ' +
      secondEventResponse.getContentText()
    );

  } catch (error) {

    console.warn(
      'n01 second event add request error: ' +
      String(
        error &&
        error.message
          ? error.message
          : error
      )
    );
  }


  /*
  ========================================================
  FINAL EVENT VERIFICATION
  ========================================================
  */

  Utilities.sleep(1500);

  eventPlayers =
    readEvent_();

  if (
    !playerIsInEvent_(
      eventPlayers
    )
  ) {

    throw new Error(
      'Could not register ' +
      cleanName +
      ' with current n01 event after verification.' +
      (
        eventAddError
          ? ' First error: ' + eventAddError
          : ''
      )
    );
  }

  console.log(
    cleanName +
    ' registered with current n01 event after retry.'
  );
}

/*
========================================================
N01 EVENT FROM CONTROL DATE
========================================================

Control!A2 determines which Monday event
Beauty registers players into.

========================================================
*/

function getN01EventIdFromControlDate_() {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const controlSheet =
    ss.getSheetByName(
      'Control'
    );

  if (!controlSheet) {

    throw new Error(
      'Control sheet not found.'
    );
  }

  const controlDate =
    controlSheet
      .getRange('A2')
      .getValue();

  if (
    !(controlDate instanceof Date)
  ) {

    throw new Error(
      'Control!A2 does not contain a valid date.'
    );
  }

  const eventDate =
    Utilities.formatDate(
      controlDate,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );

  console.log(
    'Control event date: ' +
    eventDate
  );

  return findN01EventIdByDate_(
    eventDate
  );
}


/*
========================================================
FIND N01 EVENT BY DATE
========================================================
*/

function findN01EventIdByDate_(
  eventDate
) {

  const LEAGUE_ID =
    'lg_tM2v_3523';

  const properties =
    PropertiesService
      .getScriptProperties();

  const apiUser =
    properties.getProperty(
      'N01_API_USER'
    );

  const apiPassword =
    properties.getProperty(
      'N01_API_PASSWORD'
    );

  if (
    !apiUser ||
    !apiPassword
  ) {

    throw new Error(
      'n01 API credentials are missing.'
    );
  }

  const auth =
    Utilities.base64Encode(
      apiUser +
      ':' +
      apiPassword
    );

  const response =
    UrlFetchApp.fetch(
      'https://push.n01darts.com/api/v1/league/tournament/list?lgid=' +
      encodeURIComponent(
        LEAGUE_ID
      ) +
      '&count=100',
      {
        method: 'get',

        headers: {
          Authorization:
            'Basic ' + auth
        },

        muteHttpExceptions: true
      }
    );

  if (
    response.getResponseCode() !== 200
  ) {

    throw new Error(
      'Could not read n01 League events. STATUS: ' +
      response.getResponseCode()
    );
  }

  const data =
    JSON.parse(
      response.getContentText()
    );

  if (
    data.result !== 0
  ) {

    throw new Error(
      'n01 rejected League event request: ' +
      response.getContentText()
    );
  }

  const events =
    Array.isArray(
      data.list
    )
      ? data.list
      : [];

  const matchingEvents =
    events.filter(
      function(event) {

        if (
          !event.t_date
        ) {

          return false;
        }

        const n01Date =
          Utilities.formatDate(
            new Date(
              event.t_date * 1000
            ),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          );

        return (
          n01Date === eventDate
        );
      }
    );

  if (
    matchingEvents.length === 0
  ) {

    throw new Error(
      'No n01 event found for Control date ' +
      eventDate +
      '.'
    );
  }

  if (
    matchingEvents.length > 1
  ) {

    throw new Error(
      'More than one n01 event found for Control date ' +
      eventDate +
      '. Registration stopped to avoid selecting the wrong event.'
    );
  }

  console.log(
    'n01 event selected: ' +
    matchingEvents[0].title +
    ' [' +
    matchingEvents[0].tdid +
    ']'
  );

  return (
    matchingEvents[0].tdid
  );
}


/*
========================================================
TONIGHT'S PLAYERS - PLAYER DETAILS
========================================================

C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

========================================================
*/

function setTonightPlayerStatus_(
  playerName,
  consent,
  message
) {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      "TONIGHT'S PLAYERS"
    );

  if (!sheet) {

    throw new Error(
      "TONIGHT'S PLAYERS sheet not found."
    );
  }

  const cleanName =
    String(
      playerName || ''
    ).trim();

  if (!cleanName) {
    return;
  }

  const normalizedName =
    cleanName.toLocaleLowerCase(
      'sv'
    );


  /*
  Retry because the A:B formula may need
  time to recalculate after registration.
  */

  for (
    let attempt = 0;
    attempt < 5;
    attempt++
  ) {

    SpreadsheetApp.flush();

    if (
      attempt > 0
    ) {

      Utilities.sleep(
        1000
      );
    }

    const lastRow =
      sheet.getLastRow();

    if (
      lastRow >= 2
    ) {

      const rows =
        sheet
          .getRange(
            2,
            1,
            lastRow - 1,
            2
          )
          .getDisplayValues();

      for (
        let i = 0;
        i < rows.length;
        i++
      ) {

        const player =
          String(
            rows[i][0] || ''
          )
            .trim()
            .toLocaleLowerCase(
              'sv'
            );

        const newPlayer =
          String(
            rows[i][1] || ''
          )
            .trim()
            .toLocaleLowerCase(
              'sv'
            );

        if (
          player === normalizedName ||
          newPlayer === normalizedName
        ) {

          const row =
            i + 2;


          /*
          C = STATUS
          */

          const statusCell =
            sheet.getRange(
              row,
              3
            );

          if (
            !statusCell.getValue()
          ) {

            statusCell.setValue(
              'IN'
            );
          }


          /*
          D = FOTO&VIDEO
          */

          const consentDisplay =
            consent ===
              'JA, JAG GODKÄNNER'
              ? 'JA'
              : consent ===
                  'NEJ, JAG GODKÄNNER INTE'
                ? 'NEJ'
                : consent;

          sheet
            .getRange(
              row,
              4
            )
            .setValue(
              consentDisplay || ''
            );


                                        /*
          E = MEDDELANDE
          */

          sheet
            .getRange(
              row,
              5
            )
            .setValue(
              message || ''
            );

          SpreadsheetApp.flush();

          return;
        }
      }
    }
  }

  console.log(
    "TONIGHT'S PLAYERS: player not found after retries: " +
    cleanName
  );
}
/*
========================================================
BEAUTY 1.7 - PLAYER STATUS DATA
========================================================

Stores registration information by PLAYER NAME,
so the data follows the player even when
TONIGHT'S PLAYERS changes alphabetical order.

PLAYER STATUS DATA:

A = PLAYER
B = OLD NAME
C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

OLD NAME is permanent correction memory.

========================================================
*/

function updatePlayerStatusData_(
  playerName,
  consent,
  message,
  source
) {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      'PLAYER STATUS DATA'
    );

  if (!sheet) {

    throw new Error(
      'PLAYER STATUS DATA sheet not found.'
    );
  }

  const cleanName =
    String(
      playerName || ''
    ).trim();

  if (!cleanName) {
    return;
  }

  const normalizedName =
    cleanName.toLocaleLowerCase(
      'sv'
    );

  const lastRow =
    sheet.getLastRow();

  let playerRow = 0;


  /*
  ======================================================
  FIND EXISTING PLAYER
  ======================================================
  */

  if (
    lastRow >= 2
  ) {

    const names =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getDisplayValues()
        .flat();

    for (
      let i = 0;
      i < names.length;
      i++
    ) {

      if (
        String(
          names[i] || ''
        )
          .trim()
          .toLocaleLowerCase(
            'sv'
          ) ===
        normalizedName
      ) {

        playerRow =
          i + 2;

        break;
      }
    }
  }


  /*
  ======================================================
  NEW PLAYER
  ======================================================

  Create one record.

  A = PLAYER
  B = OLD NAME - blank
  C = STATUS - IN
  D = FOTO&VIDEO
  E = MEDDELANDE

  ======================================================
  */

  if (
    !playerRow
  ) {

    playerRow =
      sheet.getLastRow() + 1;

    sheet
      .getRange(
        playerRow,
        1
      )
      .setValue(
        cleanName
      );

    /*
    IMPORTANT:
    Column B is OLD NAME.
    Do NOT write event data into B.
    */

    sheet
      .getRange(
        playerRow,
        3
      )
      .setValue(
        'IN'
      );
  }
  else {

  const currentStatus =
    String(
      sheet
        .getRange(
          playerRow,
          3
        )
        .getDisplayValue() || ''
    ).trim();

  if (!currentStatus) {

    sheet
      .getRange(
        playerRow,
        3
      )
      .setValue(
        'IN'
      );

  }

}


  /*
  ======================================================
  EXISTING PLAYER
  ======================================================

  Keep the current STATUS.

  This means a manual OUT or STANDBY
  is NOT automatically overwritten by
  another registration.

  ======================================================
  */

  const consentDisplay =
    consent ===
      'JA, JAG GODKÄNNER'
      ? 'JA'
      : consent ===
          'NEJ, JAG GODKÄNNER INTE'
        ? 'NEJ'
        : String(
            consent || ''
          );


  /*
  D = FOTO&VIDEO
  */

  sheet
    .getRange(
      playerRow,
      4
    )
    .setValue(
      consentDisplay
    );


  /*
  E = MEDDELANDE
  */

  sheet
    .getRange(
      playerRow,
      5
    )
    .setValue(
      message || ''
    );

/*
F = WHERE FROM
*/

sheet
  .getRange(
    playerRow,
    6
  )
  .setValue(
    source || ''
  );
  
  SpreadsheetApp.flush();
}


/*
========================================================
BEAUTY 1.7 - MANUAL PLAYER STATUS
========================================================

When STATUS is manually changed in:

TONIGHT'S PLAYERS column C

the corresponding player's status is stored in:

PLAYER STATUS DATA column C

========================================================
*/

function updatePlayerStatusOnly_(
  playerName,
  status
) {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      'PLAYER STATUS DATA'
    );

  if (!sheet) {

    throw new Error(
      'PLAYER STATUS DATA sheet not found.'
    );
  }

  const cleanName =
    String(
      playerName || ''
    ).trim();

  const cleanStatus =
    String(
      status || ''
    ).trim();

  if (
    !cleanName ||
    !cleanStatus
  ) {
    return;
  }


  /*
  Only these values are valid.
  */

  if (
    cleanStatus !== 'IN' &&
    cleanStatus !== 'OUT' &&
    cleanStatus !== 'STANDBY'
  ) {

    throw new Error(
      'Invalid player status: ' +
      cleanStatus
    );
  }

  const normalizedName =
    cleanName.toLocaleLowerCase(
      'sv'
    );

  const lastRow =
    sheet.getLastRow();

  let playerRow = 0;


  /*
  ======================================================
  FIND PLAYER
  ======================================================
  */

  if (
    lastRow >= 2
  ) {

    const names =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          1
        )
        .getDisplayValues()
        .flat();

    for (
      let i = 0;
      i < names.length;
      i++
    ) {

      if (
        String(
          names[i] || ''
        )
          .trim()
          .toLocaleLowerCase(
            'sv'
          ) ===
        normalizedName
      ) {

        playerRow =
          i + 2;

        break;
      }
    }
  }


  /*
  ======================================================
  PLAYER DOES NOT YET EXIST
  ======================================================

  Create the row without touching OLD NAME.

  ======================================================
  */

  if (
    !playerRow
  ) {

    playerRow =
      sheet.getLastRow() + 1;

    sheet
      .getRange(
        playerRow,
        1
      )
      .setValue(
        cleanName
      );
  }


  /*
  C = STATUS
  */

  sheet
    .getRange(
      playerRow,
      3
    )
    .setValue(
      cleanStatus
    );

  SpreadsheetApp.flush();
}


/*
========================================================
BEAUTY 1.7 - SYNC STATUS TO TONIGHT'S PLAYERS
========================================================

PLAYER STATUS DATA:
A = PLAYER
B = OLD NAME
C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

TONIGHT'S PLAYERS:
A = PLAYER
B = NEW PLAYER
C = STATUS

D and E are handled by the sheet formulas.

This function rebuilds ONLY column C.

========================================================
*/

function syncTonightStatusDisplay_(
  waitForPlayerName
) {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const tonightSheet =
    ss.getSheetByName(
      "TONIGHT'S PLAYERS"
    );

  const store =
    ss.getSheetByName(
      'PLAYER STATUS DATA'
    );

  if (
    !tonightSheet ||
    !store
  ) {

    throw new Error(
      "TONIGHT'S PLAYERS or PLAYER STATUS DATA sheet not found."
    );
  }

  const wantedName =
    String(
      waitForPlayerName || ''
    )
      .trim()
      .toLocaleLowerCase(
        'sv'
      );


  /*
  ======================================================
  WAIT FOR TONIGHT'S PLAYERS FORMULA
  ======================================================

  When called immediately after registration,
  A:B may need a moment to recalculate.

  ======================================================
  */

  if (
    wantedName
  ) {

    for (
      let attempt = 0;
      attempt < 5;
      attempt++
    ) {

      SpreadsheetApp.flush();

      if (
        attempt > 0
      ) {

        Utilities.sleep(
          1000
        );
      }

      const tonightLastRow =
        tonightSheet.getLastRow();

      if (
        tonightLastRow < 2
      ) {
        continue;
      }

      const visibleNames =
        tonightSheet
          .getRange(
            2,
            1,
            tonightLastRow - 1,
            2
          )
          .getDisplayValues();

      const playerIsVisible =
        visibleNames.some(
          row => {

            const player =
              String(
                row[0] || ''
              )
                .trim()
                .toLocaleLowerCase(
                  'sv'
                );

            const newPlayer =
              String(
                row[1] || ''
              )
                .trim()
                .toLocaleLowerCase(
                  'sv'
                );

            return (
              player === wantedName ||
              newPlayer === wantedName
            );
          }
        );

      if (
        playerIsVisible
      ) {
        break;
      }
    }
  }


  /*
  ======================================================
  BUILD PLAYER → STATUS MAP
  ======================================================
  */

  const statusMap =
    new Map();

  const lastStoreRow =
    store.getLastRow();

  if (
    lastStoreRow >= 2
  ) {

    /*
    BEAUTY 1.7:
    Read A:C.

    row[0] = PLAYER
    row[1] = OLD NAME
    row[2] = STATUS
    */

    const statusData =
      store
        .getRange(
          2,
          1,
          lastStoreRow - 1,
          3
        )
        .getDisplayValues();

    statusData.forEach(
      row => {

        const name =
          String(
            row[0] || ''
          ).trim();

        const status =
          String(
            row[2] || ''
          ).trim();

        if (
          name &&
          (
            status === 'IN' ||
            status === 'OUT' ||
            status === 'STANDBY'
          )
        ) {

          statusMap.set(
            name.toLocaleLowerCase(
              'sv'
            ),
            status
          );
        }
      }
    );
  }


  /*
  ======================================================
  READ CURRENT TONIGHT'S PLAYERS
  ======================================================
  */

  const tonightLastRow =
    tonightSheet.getLastRow();


  /*
  Clear old visible statuses while preserving
  the dropdown/data-validation rules.
  */

  tonightSheet
    .getRange(
      2,
      3,
      99,
      1
    )
    .clearContent();

  if (
    tonightLastRow < 2
  ) {

    SpreadsheetApp.flush();
    return;
  }

  const tonightNames =
    tonightSheet
      .getRange(
        2,
        1,
        tonightLastRow - 1,
        2
      )
      .getDisplayValues();


  /*
  ======================================================
  REBUILD STATUS IN CURRENT PLAYER ORDER
  ======================================================
  */

  const statusValues =
    tonightNames.map(
      row => {

        const player =
          String(
            row[0] || ''
          ).trim();

        const newPlayer =
          String(
            row[1] || ''
          ).trim();

        const lookupName =
          player ||
          newPlayer;

        if (
          !lookupName
        ) {
          return [''];
        }

        const status =
          statusMap.get(
            lookupName.toLocaleLowerCase(
              'sv'
            )
          ) || '';

        return [
          status
        ];
      }
    );

  if (
    statusValues.length > 0
  ) {

    tonightSheet
      .getRange(
        2,
        3,
        statusValues.length,
        1
      )
      .setValues(
        statusValues
      );
  }

  SpreadsheetApp.flush();
}


/*
========================================================
BEAUTY 1.7 - NEW EVENT RESET
========================================================

When Control!A2 changes:

IF OLD NAME EXISTS:
- keep the row
- keep PLAYER
- keep OLD NAME
- clear STATUS
- clear FOTO&VIDEO
- clear MEDDELANDE

IF OLD NAME IS BLANK:
- delete the entire row

This leaves PLAYER STATUS DATA containing only
permanent name-correction memory between events.

========================================================
*/

function resetPlayerEventData_() {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      'PLAYER STATUS DATA'
    );

  if (!sheet) {

    throw new Error(
      'PLAYER STATUS DATA sheet not found.'
    );
  }

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return;
  }


  /*
  Work from bottom to top because rows
  may be deleted.
  */

  for (
    let row = lastRow;
    row >= 2;
    row--
  ) {

    const oldName =
      String(
        sheet
          .getRange(
            row,
            2
          )
          .getDisplayValue() || ''
      ).trim();

    if (
      oldName
    ) {

      /*
      Keep:
      A = PLAYER
      B = OLD NAME

      Clear:
      C = STATUS
      D = FOTO&VIDEO
      E = MEDDELANDE
      */

      sheet
        .getRange(
          row,
          3,
          1,
          3
        )
        .clearContent();

    } else {

      /*
      No permanent correction memory,
      so this event-only row can disappear.
      */

      sheet.deleteRow(
        row
      );
    }
  }

  SpreadsheetApp.flush();
}
/*
========================================================
BEAUTY 1.7 - SMART PLAYER RENAME
========================================================

When a player name is corrected in
PLAYER'S MASTER LIST:

OLD NAME -> NEW NAME

Beauty updates the player's identity while
preserving the event information and storing
the old spelling in the Donkey Dictionary.

PLAYER STATUS DATA:

A = PLAYER
B = OLD NAME
C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

========================================================
*/

function renamePlayerEverywhere_(
  oldPlayerName,
  newPlayerName
) {

  const oldName =
    String(
      oldPlayerName || ''
    ).trim();

  const newName =
    String(
      newPlayerName || ''
    ).trim();

  if (
    !oldName ||
    !newName ||
    oldName === newName
  ) {
    return;
  }

  const oldKey =
    oldName.toLocaleLowerCase(
      'sv'
    );

  const newKey =
    newName.toLocaleLowerCase(
      'sv'
    );

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );


  /*
  ======================================================
  1. PLAYER STATUS DATA
  ======================================================

  Rename the permanent player identity.

  Beauty 1.7 layout:

  A = PLAYER
  B = OLD NAME
  C = STATUS
  D = FOTO&VIDEO
  E = MEDDELANDE

  ======================================================
  */

  const statusSheet =
    ss.getSheetByName(
      'PLAYER STATUS DATA'
    );

  if (
    statusSheet
  ) {

    const lastStatusRow =
      statusSheet.getLastRow();

    if (
      lastStatusRow >= 2
    ) {

      const statusNames =
        statusSheet
          .getRange(
            2,
            1,
            lastStatusRow - 1,
            1
          )
          .getDisplayValues()
          .flat();

      let oldStatusRow = 0;
      let newStatusRow = 0;

      for (
        let i = 0;
        i < statusNames.length;
        i++
      ) {

        const name =
          String(
            statusNames[i] || ''
          ).trim();

        const key =
          name.toLocaleLowerCase(
            'sv'
          );

        if (
          key === oldKey
        ) {

          oldStatusRow =
            i + 2;
        }

        if (
          key === newKey
        ) {

          newStatusRow =
            i + 2;
        }
      }


      /*
      ====================================================
      CORRECTED NAME ALREADY EXISTS
      ====================================================

      Merge the two identities instead of creating
      a duplicate.

      The corrected/new row wins where it already
      contains data.

      Missing event data is copied from the old row.

      OLD NAME is then remembered in column B.

      ====================================================
      */

      if (
        oldStatusRow &&
        newStatusRow &&
        oldStatusRow !== newStatusRow
      ) {

        /*
        Read event data only:

        C = STATUS
        D = FOTO&VIDEO
        E = MEDDELANDE
        */

        const oldEventData =
          statusSheet
            .getRange(
              oldStatusRow,
              3,
              1,
              3
            )
            .getValues()[0];

        const newEventData =
          statusSheet
            .getRange(
              newStatusRow,
              3,
              1,
              3
            )
            .getValues()[0];

        for (
          let column = 0;
          column < 3;
          column++
        ) {

          if (
            !newEventData[column] &&
            oldEventData[column]
          ) {

            newEventData[column] =
              oldEventData[column];
          }
        }

        statusSheet
          .getRange(
            newStatusRow,
            3,
            1,
            3
          )
          .setValues([
            newEventData
          ]);


        /*
        BEAUTY 1.7 DONKEY DICTIONARY

        B = OLD NAME
        */

        statusSheet
          .getRange(
            newStatusRow,
            2
          )
          .setValue(
            oldName
          );


        /*
        Remove old duplicate identity.

        Because deletion can shift row numbers,
        we do this only after all data has been
        written to the corrected row.
        */

        statusSheet.deleteRow(
          oldStatusRow
        );

      } else if (
        oldStatusRow
      ) {


        /*
        ==================================================
        NORMAL RENAME
        ==================================================
        */

        statusSheet
          .getRange(
            oldStatusRow,
            1
          )
          .setValue(
            newName
          );


        /*
        BEAUTY 1.7 - DONKEY DICTIONARY

        Remember the spelling that was corrected.

        B = OLD NAME
        */

        statusSheet
          .getRange(
            oldStatusRow,
            2
          )
          .setValue(
            oldName
          );

      } else if (
        !oldStatusRow &&
        !newStatusRow
      ) {


        /*
        ==================================================
        NO EVENT-DATA ROW EXISTS YET
        ==================================================

        The player may be corrected in the Master List
        before registering tonight.

        We STILL need to remember the correction so
        n01 cannot reintroduce the old spelling later.

        ==================================================
        */

        const correctionRow =
          statusSheet.getLastRow() + 1;

        statusSheet
          .getRange(
            correctionRow,
            1
          )
          .setValue(
            newName
          );

        statusSheet
          .getRange(
            correctionRow,
            2
          )
          .setValue(
            oldName
          );

      } else if (
        !oldStatusRow &&
        newStatusRow
      ) {


        /*
        The corrected identity already exists,
        but there is no separate old identity row.

        Remember the old spelling on the corrected row.
        */

        statusSheet
          .getRange(
            newStatusRow,
            2
          )
          .setValue(
            oldName
          );
      }
    } else {


      /*
      PLAYER STATUS DATA contains only the header.

      Create permanent correction memory.
      */

      statusSheet
        .getRange(
          2,
          1
        )
        .setValue(
          newName
        );

      statusSheet
        .getRange(
          2,
          2
        )
        .setValue(
          oldName
        );
    }
  }


  /*
  ======================================================
  2. FORM RESPONSES 2
  ======================================================

  Correct previous registrations too.

  Column B = selected player
  Column C = manually entered new player

  TONIGHT'S PLAYERS is generated from these names,
  so correcting the response data lets the visible
  player name update as well.

  ======================================================
  */

  const responseSheet =
    ss.getSheetByName(
      RESPONSE_SHEET
    );

  if (
    responseSheet
  ) {

    const lastResponseRow =
      responseSheet.getLastRow();

    if (
      lastResponseRow >= 2
    ) {

      const responseNames =
        responseSheet
          .getRange(
            2,
            2,
            lastResponseRow - 1,
            2
          )
          .getValues();

      let responsesChanged =
        false;

      for (
        let i = 0;
        i < responseNames.length;
        i++
      ) {

        const selectedName =
          String(
            responseNames[i][0] || ''
          ).trim();

        const typedName =
          String(
            responseNames[i][1] || ''
          ).trim();


        /*
        Existing-player registration:
        actual name is in column B.
        */

        if (
          selectedName
            .toLocaleLowerCase(
              'sv'
            ) ===
          oldKey
        ) {

          responseNames[i][0] =
            newName;

          responsesChanged =
            true;
        }


        /*
        New-player registration:

        Column B remains:
        MITT NAMN FINNS INTE I LISTAN

        Actual entered name is in column C.
        */

        if (
          typedName
            .toLocaleLowerCase(
              'sv'
            ) ===
          oldKey
        ) {

          responseNames[i][1] =
            newName;

          responsesChanged =
            true;
        }
      }

      if (
        responsesChanged
      ) {

        responseSheet
          .getRange(
            2,
            2,
            responseNames.length,
            2
          )
          .setValues(
            responseNames
          );
      }
    }
  }


  /*
  ======================================================
  3. GOOGLE FORM
  ======================================================

  The Master List itself is already being edited.

  The normal onEdit flow will sort the Master List
  and syncMasterListToGoogleForm() will rebuild the
  Google Form player list from the corrected names.

  Therefore no second Form edit is needed here.

  ======================================================
  */


  /*
  ======================================================
  4. REFRESH TONIGHT'S PLAYERS
  ======================================================

  Allow formula-driven names to recalculate,
  then rebuild STATUS by PLAYER NAME.

  ======================================================
  */

  SpreadsheetApp.flush();

  Utilities.sleep(
    500
  );

  syncTonightStatusDisplay_(
    newName
  );


  console.log(
    'Beauty 1.7 rename: "' +
    oldName +
    '" -> "' +
    newName +
    '"'
  );
}
