function onOpen() {
  SpreadsheetApp
    .getUi()
    .createMenu('💬 MEDDELANDE')
    .addItem('Läs meddelande', 'showPlayerMessage')
    .addToUi();
}


function showPlayerMessage() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("TONIGHT'S PLAYERS");

  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      "TONIGHT'S PLAYERS hittades inte."
    );
    return;
  }

  const row = sheet.getActiveCell().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert(
      "Välj en spelare först."
    );
    return;
  }

  const playerName =
    String(
      sheet.getRange(row, 1).getDisplayValue() || ''
    ).trim();

  if (!playerName) {
    SpreadsheetApp.getUi().alert(
      "Välj en spelare först."
    );
    return;
  }

  const dataSheet =
    ss.getSheetByName("PLAYER STATUS DATA");

  if (!dataSheet) {
    SpreadsheetApp.getUi().alert(
      "PLAYER STATUS DATA hittades inte."
    );
    return;
  }

  const lastRow = dataSheet.getLastRow();

  const data =
    dataSheet
      .getRange(
        2,
        1,
        lastRow - 1,
        5
      )
      .getDisplayValues();

  const normalizedPlayer =
    playerName
      .toLocaleLowerCase('sv');

  let message = '';

  for (let i = 0; i < data.length; i++) {

    const name =
      String(data[i][0] || '')
        .trim()
        .toLocaleLowerCase('sv');

    if (name === normalizedPlayer) {
      message =
        String(data[i][4] || '').trim();
      break;
    }
  }

  if (!message) {
    message = "Inget meddelande.";
  }

  SpreadsheetApp.getUi().alert(
    "MEDDELANDE — " + playerName,
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}