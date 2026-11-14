/*
========================================================
AIK MÅNDAGSDARTARNA REMOTE APP
========================================================

MASTER PLAYER LIST:
PLAYER'S MASTER LIST

REGISTRATION SHEET:
Form responses 2

SYSTEM:

PLAYER'S MASTER LIST
        ↓
   REMOTE APP
        ↓
Form responses 2
        ↓
TONIGHT'S PLAYERS

MANUAL MASTER LIST EDITS:
- Automatically remove blanks
- Automatically remove duplicates
- Automatically sort Swedish alphabetically
- Automatically synchronize Google Form backup

NEW REMOTE PLAYERS:
- Saved in Form responses 2
- Added to PLAYER'S MASTER LIST
- Master List sorted automatically
- Google Form backup synchronized

========================================================
*/


const SHEET_ID =
  '1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM';

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
REMOTE WEB APP
========================================================
*/

function beautyPrevious_doGet_(e) {
 const requestedPage=String(e&&e.parameter&&e.parameter.page||'').toLowerCase();
 if(['hubdata','hubstatus','hubregister'].includes(requestedPage))return ContentService.createTextOutput(JSON.stringify({success:false,code:'ROUTE_DISABLED',error:'Use the authenticated LIVE Hub.'})).setMimeType(ContentService.MimeType.JSON);
 if(requestedPage==='nakkahealth')return ContentService.createTextOutput(JSON.stringify(getNakkaHealth_())).setMimeType(ContentService.MimeType.JSON);
  let page =
    'RemoteRegistration';

  if (
    requestedPage ===
    'fonttest'
  ) {
    page = 'FontTest';
  }

  if (
    requestedPage ===
    'remote'
  ) {
    page =
      'RemoteRegistration';
  }

  return HtmlService
    .createTemplateFromFile(
      page
    )
    .evaluate()
    .setTitle(
      page === 'FontTest'
        ? 'AIK FONT TEST'
        : page ===
            'RemoteRegistration'
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
GET PLAYER NAMES FOR REMOTE APP
========================================================

The remote app reads player names directly from:

PLAYER'S MASTER LIST

A1 = PLAYERS
A2 downward = names

========================================================
*/

function beautyPrevious_getPlayerNames_() {

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
            String(
              value
            ).trim()
        )
        .filter(
          value =>
            value
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
SAVE REMOTE REGISTRATION
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

function beautyRegistrationSave_(
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

  let newName = String(data.newName || '').trim();

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
  // Check manually entered names against the master list.
  if (selectedName === NEW_PLAYER_OPTION) {

    const nameKey = value =>
      String(value || '')
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('sv-SE');

    newName = newName
      .normalize('NFC')
      .trim()
      .replace(/\s+/g, ' ');

    const masterSheet =
      spreadsheet.getSheetByName(MASTER_SHEET);

    if (!masterSheet) {
      throw new Error(
        'Could not find sheet: ' + MASTER_SHEET
      );
    }

    const lastMasterRow = masterSheet.getLastRow();

    const masterNames = lastMasterRow >= 2
      ? masterSheet
          .getRange(2, 1, lastMasterRow - 1, 1)
          .getDisplayValues()
          .flat()
      : [];

    const existingName = masterNames.find(
      name =>
        nameKey(name) &&
        nameKey(name) !== nameKey(NEW_PLAYER_OPTION) &&
        nameKey(name) === nameKey(newName)
    );

    if (existingName !== undefined) {
      selectedName = String(existingName).trim();
      newName = '';
    }
  }
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
  the remote app:

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
  PLAYER NAME USED BY STATUS DATA + N01
  ======================================================
  */

  const n01PlayerName =
    selectedName ===
      NEW_PLAYER_OPTION
      ? newName
      : selectedName;


  /*
  ======================================================
  BEAUTY 1.7
  PLAYER STATUS DATA + TONIGHT STATUS SYNC
  ======================================================

  PLAYER STATUS DATA:

  A = PLAYER
  B = OLD NAME
  C = STATUS
  D = FOTO&VIDEO
  E = MEDDELANDE

  The status-storage functions later in this file
  use this Beauty 1.7 structure.

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


  /*
  ======================================================
  N01 SYNC
  ======================================================
  */

  let nakka={entryConfirmed:false,identityVerified:false,needsAttention:true};
  try {
    nakka = registerPlayerWithN01_(
      n01PlayerName
    );

  } catch (
    n01Error
  ) {

    console.error(
      'n01 sync failed for ' +
      n01PlayerName +
      ': ' +
      n01Error
    );
  }


  /*
  ======================================================
  SUCCESS RESPONSE TO REMOTE APP
  ======================================================
  */

  return {

    success: true,
    nakka,

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
            String(
              value
            ).trim()
        )
        .filter(
          value =>
            value
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
          String(
            value
          ).trim()
      )
      .filter(
        value =>
          value
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
  automatically updates the original
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

function syncMasterListToGoogleForm() {

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
            String(
              value
            ).trim()
        )
        .filter(
          value =>
            value
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
N01 - REGISTER PLAYER
========================================================

The REMOTE APP uses the same permanent n01 league
and the event date selected in Control!A2.

========================================================
*/

function registerPlayerWithN01_(playerName) { return beautyRegistrationNakka_(playerName); }


/*
========================================================
N01 EVENT FROM CONTROL DATE
========================================================

Control!A2 determines which Monday event
REMOTE registrations are added to.

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

  if (
    !controlSheet
  ) {

    throw new Error(
      'Control sheet not found.'
    );
  }

  const controlDate =
    controlSheet
      .getRange(
        'A2'
      )
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
        method:
          'get',

        headers: {
          Authorization:
            'Basic ' + auth
        },

        muteHttpExceptions:
          true
      }
    );

  if (
    response.getResponseCode() !==
    200
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
          n01Date ===
          eventDate
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
BEAUTY 1.7 - PLAYER STATUS DATA
========================================================

Stores registration information by PLAYER NAME.

PLAYER STATUS DATA:

A = PLAYER
B = OLD NAME
C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

IMPORTANT:

Column B is permanent correction memory.

The REMOTE APP must NEVER write:
IN / OUT / STANDBY
Foto consent
or message

into column B.

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
    cleanName
      .toLocaleLowerCase(
        'sv'
      );

  const lastRow =
    sheet.getLastRow();

  let playerRow = 0;


  /*
  ======================================================
  FIND PLAYER BY COLUMN A
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
  NEW PLAYER STATUS ROW
  ======================================================

  A = PLAYER

  B is deliberately left blank.

  B belongs ONLY to OLD NAME correction memory.

  C = IN

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
  EXISTING CORRECTION-MEMORY ROW
  ======================================================

  A corrected player may already have a permanent row:

  A = corrected name
  B = old name

  After event reset:
  C:D:E are blank.

  When that player registers again,
  blank STATUS must become IN.

  If STATUS is already OUT or STANDBY,
  we preserve that manual decision.

  ======================================================
  */

  const currentStatus =
    String(
      sheet
        .getRange(
          playerRow,
          3
        )
        .getDisplayValue() || ''
    ).trim();

  if (
    !currentStatus
  ) {

    sheet
      .getRange(
        playerRow,
        3
      )
      .setValue(
        'IN'
      );
  }


  /*
  ======================================================
  FOTO / VIDEO
  ======================================================

  Stored in COLUMN D.

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
          ).trim();

  sheet
    .getRange(
      playerRow,
      4
    )
    .setValue(
      consentDisplay
    );


  /*
  ======================================================
  MEDDELANDE
  ======================================================

  Stored in COLUMN E.

  ======================================================
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
BEAUTY 1.7 - UPDATE STATUS ONLY
========================================================

Used when a player's status is changed manually.

PLAYER STATUS DATA:

A = PLAYER
B = OLD NAME
C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

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
    ).trim()
      .toUpperCase();

  if (
    !cleanName
  ) {
    return;
  }

  if (
    cleanStatus &&
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
    cleanName
      .toLocaleLowerCase(
        'sv'
      );

  const lastRow =
    sheet.getLastRow();

  let playerRow = 0;

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
  If no status row exists yet,
  create one.

  Column B stays blank.
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
  STATUS belongs in COLUMN C.
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
BEAUTY 1.7 - SYNC TONIGHT STATUS DISPLAY
========================================================

Rebuilds TONIGHT'S PLAYERS column C
by PLAYER NAME.

Reads:

PLAYER STATUS DATA
A = PLAYER
C = STATUS

Only valid status values are allowed:

IN
OUT
STANDBY

This prevents OLD NAME, FOTO or MEDDELANDE
from ever being pushed into the STATUS dropdown.

========================================================
*/

function syncTonightStatusDisplay_(
  waitForPlayerName
) {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const tonight =
    ss.getSheetByName(
      "TONIGHT'S PLAYERS"
    );

  const store =
    ss.getSheetByName(
      'PLAYER STATUS DATA'
    );

  if (
    !tonight ||
    !store
  ) {

    throw new Error(
      "TONIGHT'S PLAYERS or PLAYER STATUS DATA sheet not found."
    );
  }

  const target =
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

  Form responses changes first.

  TONIGHT'S PLAYERS is formula-driven.

  Give Google Sheets time to place the player
  into the correct alphabetical position.

  ======================================================
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

    const names =
      tonight
        .getRange(
          2,
          1,
          99,
          1
        )
        .getDisplayValues()
        .flat()
        .map(
          value =>
            String(
              value || ''
            ).trim()
        );

    const targetIsVisible =
      !target ||
      names.some(
        name =>
          name
            .toLocaleLowerCase(
              'sv'
            ) ===
          target
      );

    if (
      !targetIsVisible &&
      attempt < 4
    ) {

      continue;
    }


    /*
    ====================================================
    BUILD PLAYER NAME -> STATUS MAP

    PLAYER STATUS DATA:

    A = PLAYER
    B = OLD NAME
    C = STATUS

    Therefore we read A:C and status = row[2].

    ====================================================
    */

    const statusMap =
      new Map();

    const lastStoreRow =
      store.getLastRow();

    if (
      lastStoreRow >= 2
    ) {

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
            )
              .trim()
              .toUpperCase();


          /*
          Only legitimate dropdown values
          are allowed into TONIGHT column C.
          */

          const validStatus =
            status === 'IN' ||
            status === 'OUT' ||
            status === 'STANDBY'
              ? status
              : '';

          if (
            name
          ) {

            statusMap.set(

              name
                .toLocaleLowerCase(
                  'sv'
                ),

              validStatus
            );
          }
        }
      );
    }


    /*
    ====================================================
    BUILD COLUMN C IN CURRENT PLAYER ORDER
    ====================================================
    */

    const statusValues =
      names.map(
        name => [

          name
            ? (
                statusMap.get(
                  name
                    .toLocaleLowerCase(
                      'sv'
                    )
                ) || ''
              )
            : ''

        ]
      );


    /*
    ====================================================
    REBUILD STATUS COLUMN
    ====================================================

    clearContent() removes VALUES ONLY.

    It does NOT remove the dropdown validation.

    ====================================================
    */

    tonight
      .getRange(
        2,
        3,
        99,
        1
      )
      .clearContent();

    tonight
      .getRange(
        2,
        3,
        99,
        1
      )
      .setValues(
        statusValues
      );

    SpreadsheetApp.flush();

    return;
  }
}


/*
========================================================
BEAUTY 1.7 - RESET EVENT DATA
========================================================

PLAYER STATUS DATA:

A = PLAYER
B = OLD NAME
C = STATUS
D = FOTO&VIDEO
E = MEDDELANDE

RESET RULE:

If OLD NAME exists in B:
- KEEP the row
- KEEP PLAYER
- KEEP OLD NAME
- CLEAR C:D:E

If OLD NAME is blank:
- DELETE the entire row

This means only permanent name-correction memory
survives between events.

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

  const data =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        5
      )
      .getDisplayValues();


  /*
  Work from bottom upward because rows
  may be deleted.
  */

  for (
    let i =
      data.length - 1;
    i >= 0;
    i--
  ) {

    const sheetRow =
      i + 2;

    const player =
      String(
        data[i][0] || ''
      ).trim();

    const oldName =
      String(
        data[i][1] || ''
      ).trim();


    /*
    Blank / garbage row.
    */

    if (
      !player
    ) {

      sheet.deleteRow(
        sheetRow
      );

      continue;
    }


    /*
    Permanent correction-memory row.

    Keep A + B.
    Clear event data C:D:E.
    */

    if (
      oldName
    ) {

      sheet
        .getRange(
          sheetRow,
          3,
          1,
          3
        )
        .clearContent();

      continue;
    }


    /*
    Ordinary event-only player.

    No OLD NAME = no reason to survive reset.
    */

    sheet.deleteRow(
      sheetRow
    );
  }

  SpreadsheetApp.flush();
}
/*
=========================================================
BEAUTY 1.8
REMOTE — TONIGHT'S PLAYERS POPUP
=========================================================

Returns ONLY player names from:

TONIGHT'S PLAYERS
Column A = PLAYERS

The existing TONIGHT'S PLAYERS system remains
the source of truth.

=========================================================
*/

function beautyPrevious_getTonightsPlayerNames_() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      "TONIGHT'S PLAYERS"
    );

  if (!sheet) {
    throw new Error(
      "Could not find sheet: TONIGHT'S PLAYERS"
    );
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const names =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getDisplayValues()
      .flat()
      .map(
        value =>
          String(value).trim()
      )
      .filter(
        value =>
          value &&
          value.toUpperCase() !== "PLAYERS"
      );

  return names;
}

/*
=========================================================
BEAUTY HUB
READ-ONLY LIVE DASHBOARD DATA
=========================================================

Reads:

Control!A2
TONIGHT'S PLAYERS A:F
PLAYER'S MASTER LIST

DOES NOT write or modify any Beauty data.

=========================================================
*/

function getBeautyHubData_() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const controlSheet =
    spreadsheet.getSheetByName(
      'Control'
    );

  const tonightSheet =
    spreadsheet.getSheetByName(
      "TONIGHT'S PLAYERS"
    );

const masterSheet =
  spreadsheet.getSheetByName(
    "PLAYER'S MASTER LIST"
  );

  if (!controlSheet) {
    throw new Error(
      'Control sheet not found.'
    );
  }

  if (!tonightSheet) {
    throw new Error(
      "TONIGHT'S PLAYERS sheet not found."
    );
  }

if (!masterSheet) {
  throw new Error(
    "PLAYER'S MASTER LIST sheet not found."
  );
}

  /*
  =======================================================
  EVENT DATE
  =======================================================
  */

  const controlDate =
    controlSheet
      .getRange('A2')
      .getValue();

  let eventDate = '';

  let eventDateDisplay = '';

  if (
    controlDate instanceof Date
  ) {

    eventDate =
      Utilities.formatDate(
        controlDate,
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );

    eventDateDisplay =
      Utilities.formatDate(
        controlDate,
        Session.getScriptTimeZone(),
        'd MMMM yyyy'
      );
  }


  /*
  =======================================================
  TONIGHT'S PLAYERS
  =======================================================
  */

  const lastRow =
    tonightSheet.getLastRow();

  let players = [];

  if (
    lastRow >= 2
  ) {

    players =
      tonightSheet
        .getRange(
          2,
          1,
          lastRow - 1,
          6
        )
        .getDisplayValues()
        .map(
          row => ({
            player:
              String(row[0] || '').trim(),

            newPlayer:
              String(row[1] || '').trim(),

            status:
              String(row[2] || '').trim(),

            consent:
              String(row[3] || '').trim(),

            message:
  String(row[4] || '').trim(),

whereFrom:
  String(row[5] || '').trim()
          })
        )
        .filter(
          row =>
            row.player ||
            row.newPlayer
        );
  }

/*
=======================================================
MASTER PLAYER LIST
=======================================================
*/

const masterPlayers =
  getPlayerNames();
  /*
  =======================================================
  RESPONSE
  =======================================================
  */

  return {
    success: true,

    eventDate:
      eventDate,

    eventDateDisplay:
      eventDateDisplay,

    playerCount:
      players.length,

    players:
  players,

masterPlayers:
  masterPlayers,

updatedAt:
  new Date().toISOString()
  };
}


/*
=========================================================
BEAUTY HUB
UPDATE PLAYER STATUS
=========================================================
*/

function updateBeautyHubPlayerStatus_(
  playerName,
  status
) {

  const cleanName =
    String(
      playerName || ''
    ).trim();

  const cleanStatus =
    String(
      status || ''
    )
      .trim()
      .toUpperCase();


  if (!cleanName) {

    throw new Error(
      'Player name is required.'
    );
  }


  if (
    cleanStatus !== 'IN' &&
    cleanStatus !== 'OUT' &&
    cleanStatus !== 'STANDBY'
  ) {

    throw new Error(
      'Invalid status.'
    );
  }


  /*
  Use existing Beauty status system.
  */

  updatePlayerStatusOnly_(
    cleanName,
    cleanStatus
  );


  /*
  Rebuild Tonight's Players status
  from PLAYER STATUS DATA.
  */

  syncTonightStatusDisplay_(
    cleanName
  );


  return {
    success: true,
    player: cleanName,
    status: cleanStatus
  };
}
/*
NAKKA HEALTH — READ ONLY

One fixed league GET, no retries and no Sheets/Form access.
Cache all outcomes for 60 seconds across Hub clients. Only health
checks take this lock; they never wait for another check to finish.
*/
function getNakkaHealth_() {
  let lock;
  let locked = false;

  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'beauty:nakka-health:v1';
    const cached = cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    lock = LockService.getScriptLock();
    locked = lock.tryLock(0);

    if (!locked) {
      return nakkaHealthResult_(
        'DEGRADED',
        'A Nakka check is already running. Refresh shortly.'
      );
    }

    // Another health check may have completed before we acquired the lock.
    const latest = cache.get(cacheKey);
    if (latest) {
      return JSON.parse(latest);
    }

    const health = checkNakkaLeagueHealth_();

    try {
      cache.put(cacheKey, JSON.stringify(health), 60);
    } catch (error) {
      // A cache write failure must not discard the observed health result.
    }

    return health;
  } catch (error) {
    // Never return exception text: it may contain request/authentication data.
    return nakkaHealthResult_(
      'UNAVAILABLE',
      'The Nakka health check could not be completed.'
    );
  } finally {
    if (locked) {
      try {
        lock.releaseLock();
      } catch (error) {
        // The health response must also survive a lock-service failure.
      }
    }
  }
}

function checkNakkaLeagueHealth_() {
  const properties = PropertiesService.getScriptProperties();
  const apiUser = properties.getProperty('N01_API_USER');
  const apiPassword = properties.getProperty('N01_API_PASSWORD');

  if (!apiUser || !apiPassword) {
    return nakkaHealthResult_(
      'UNAVAILABLE',
      'Nakka API credentials are not configured.'
    );
  }

  let response;

  try {
    response = UrlFetchApp.fetch(
      'https://push.n01darts.com/api/v1/league/entry/list?lgid=lg_tM2v_3523',
      {
        method: 'get',
        headers: {
          Authorization: 'Basic ' + Utilities.base64Encode(apiUser + ':' + apiPassword)
        },
        muteHttpExceptions: true,
        followRedirects: false
      }
    );
  } catch (error) {
    // UrlFetchApp has no configurable request timeout. Catch its native errors;
    // the Hub separately bounds how long it waits for this endpoint.
    const timedOut = /timeout|timed\s*out|deadline/i.test(
      String(error && error.message ? error.message : error)
    );

    return nakkaHealthResult_(
      'UNAVAILABLE',
      timedOut
        ? 'The Nakka request timed out. Try again later.'
        : 'Nakka could not be reached. Try again later.'
    );
  }

  const code = response.getResponseCode();

  if (code === 401 || code === 403) {
    return nakkaHealthResult_(
      'UNAVAILABLE',
      'Nakka authentication failed (HTTP ' + code + ').'
    );
  }

  if (code === 408 || code === 504) {
    return nakkaHealthResult_(
      'UNAVAILABLE',
      'The Nakka request timed out (HTTP ' + code + ').'
    );
  }

  if (code !== 200) {
    return nakkaHealthResult_(
      'DEGRADED',
      code === 429
        ? 'Nakka is limiting requests. Try again later.'
        : 'Nakka league access failed (HTTP ' + code + ').'
    );
  }

  let data;
  try {
    data = JSON.parse(response.getContentText());
  } catch (error) {
    return nakkaHealthResult_(
      'DEGRADED',
      'Nakka returned an unreadable league response.'
    );
  }

  if (!data || data.result !== 0 || !Array.isArray(data.list)) {
    return nakkaHealthResult_(
      'DEGRADED',
      'Nakka did not confirm access to the expected league.'
    );
  }

  return nakkaHealthResult_('OK', 'Nakka is reachable and the expected league is readable.');
}

function nakkaHealthResult_(status, message) {
  return {
    status: status,
    message: message,
    timestamp: new Date().toISOString()
  };
}
