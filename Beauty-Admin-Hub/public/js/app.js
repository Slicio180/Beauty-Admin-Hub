/*
=========================================================
BEAUTY DESKTOP ADMIN HUB
LIVE BEAUTY DATA CONNECTION
=========================================================
*/

const BEAUTY_HUB_URL =
  'https://script.google.com/macros/s/AKfycby4pFMPm2WKMTVrKqWIrJ7QhlkW_l8qsXBL8jBfGesZ-3g1dL40ZJnemkevAF8YmdOI/exec?page=hubdata';
const pendingStatusChanges =
  new Map();

/*
=========================================================
LOAD BEAUTY DATA
=========================================================
*/

async function loadBeautyHubData() {

  try {

    const response =
      await fetch(
        BEAUTY_HUB_URL,
        {
          cache: 'no-store'
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.error ||
        'Beauty backend returned an error.'
      );
    }

    updateHub(data);
    setBeautyConnected();

  } catch (error) {

    console.error(
      'Beauty Hub connection error:',
      error
    );

    setBeautyDisconnected(
      error.message
    );
  }
}


/*
=========================================================
UPDATE HUB
=========================================================
*/

function updateHub(data) {

  window.beautyHubData = data;

  updateEvent(data);

  updatePlayerCount(data);

  updatePlayersTable(data.players || []);
}


/*
=========================================================
EVENT
=========================================================
*/

function updateEvent(data) {

  const eventDate =
    document.getElementById(
      'currentEventDate'
    );

  const eventStatus =
    document.getElementById(
      'currentEventStatus'
    );

  if (eventDate) {

    eventDate.textContent =
      data.eventDateDisplay ||
      'NO EVENT SELECTED';
  }

  if (eventStatus) {

    eventStatus.textContent =
      data.eventDate
        ? 'Beauty event connected'
        : 'No event selected';
  }
}


/*
=========================================================
PLAYER COUNT
=========================================================
*/

function updatePlayerCount(data) {

  const playerCount =
    document.getElementById(
      'playerCount'
    );

  if (!playerCount) {
    return;
  }

  playerCount.textContent =
    String(
      data.playerCount || 0
    );
}


/*
=========================================================
TONIGHT'S PLAYERS TABLE
=========================================================
*/

function updatePlayersTable(players) {

  const tableBody =
    document.getElementById(
      'playersTableBody'
    );

  if (!tableBody) {
    return;
  }

  tableBody.replaceChildren();

  if (!players.length) {

    const row =
      document.createElement('tr');

    const cell =
      document.createElement('td');

    cell.colSpan = 6;

    cell.textContent =
      'No players registered yet.';

    row.appendChild(cell);
    tableBody.appendChild(row);

    return;
  }


  players.forEach(
    player => {

      const row =
        document.createElement('tr');

      addCell(
        row,
        player.player
      );

      addCell(
        row,
        player.newPlayer
      );

        const pendingStatus =
  pendingStatusChanges.get(
    player.player
  );

let displayedStatus =
  player.status;


/*
If Beauty has now caught up with
the status we selected, clear the
temporary local lock.
*/

if (
  pendingStatus
) {

  /*
  Keep the Hub-selected status displayed
  while Beauty/Sheets finishes syncing.

  Do not allow an older backend value to
  flash back onto the screen.
  */

  displayedStatus =
    pendingStatus;
}


addStatusCell(
  row,
  player.player,
  displayedStatus
);

      addConsentCell(
  row,
  player.consent
);

      addMessageCell(
  row,
  player.player,
  player.message
);
addCell(
  row,
  player.whereFrom
);

      tableBody.appendChild(row);
    }
  );
}

/*
=========================================================
STATUS DROPDOWN
=========================================================
*/

function addStatusCell(
  row,
  playerName,
  currentStatus
) {

  const cell =
    document.createElement('td');

  const select =
    document.createElement('select');

  select.className =
    'status-select';

  const statuses = [
    'IN',
    'OUT',
    'STANDBY'
  ];


  statuses.forEach(
    status => {

      const option =
        document.createElement('option');

      option.value =
        status;

      option.textContent =
        status;

      if (
        status === currentStatus
      ) {

        option.selected =
          true;
      }

      select.appendChild(
        option
      );
    }
  );


  setStatusClass(
    select,
    currentStatus
  );


  select.addEventListener(
    'change',
    async () => {

      const newStatus =
        select.value;

      const oldStatus =
        currentStatus;

pendingStatusChanges.set(
  playerName,
  newStatus
);
setTimeout(
  () => {

    if (
      pendingStatusChanges.get(
        playerName
      ) === newStatus
    ) {

      pendingStatusChanges.delete(
        playerName
      );
    }

  },
  12000
);

      select.disabled =
        true;

      setStatusClass(
        select,
        newStatus
      );


      try {

        const url =
          new URL(
            BEAUTY_HUB_URL
          );

        url.searchParams.set(
          'page',
          'hubstatus'
        );

        url.searchParams.set(
          'player',
          playerName
        );

        url.searchParams.set(
          'status',
          newStatus
        );


        const response =
          await fetch(
            url.toString(),
            {
              cache: 'no-store'
            }
          );


        if (!response.ok) {

          throw new Error(
            `HTTP ${response.status}`
          );
        }


        const result =
          await response.json();


        if (!result.success) {

          throw new Error(
            result.error ||
            'Status update failed.'
          );
        }


        currentStatus =
          newStatus;

      } catch (error) {

        console.error(
          'Status update error:',
          error
        );

        select.value =
          oldStatus;

        setStatusClass(
          select,
          oldStatus
        );

        alert(
          'Could not update player status.'
        );

      } finally {

        select.disabled =
          false;
      }
    }
  );


  cell.appendChild(
    select
  );

  row.appendChild(
    cell
  );
}


/*
=========================================================
STATUS COLOURS
=========================================================
*/

function setStatusClass(
  select,
  status
) {

  select.classList.remove(
    'status-in',
    'status-out',
    'status-standby'
  );


  if (status === 'IN') {

    select.classList.add(
      'status-in'
    );

  } else if (
    status === 'OUT'
  ) {

    select.classList.add(
      'status-out'
    );

  } else if (
    status === 'STANDBY'
  ) {

    select.classList.add(
      'status-standby'
    );
  }
}

/*
=========================================================
FOTO & VIDEO CONSENT
=========================================================
*/

function addConsentCell(
  row,
  consent
) {

  const cell =
    document.createElement('td');

  const badge =
    document.createElement('span');

  const cleanConsent =
    String(
      consent || ''
    )
      .trim()
      .toUpperCase();

  badge.className =
    'consent-badge';

  badge.textContent =
    cleanConsent || '—';


  if (
    cleanConsent === 'JA'
  ) {

    badge.classList.add(
      'consent-yes'
    );

  } else if (
    cleanConsent === 'NEJ'
  ) {

    badge.classList.add(
      'consent-no'
    );

  } else {

    badge.classList.add(
      'consent-unknown'
    );
  }


  cell.appendChild(
    badge
  );

  row.appendChild(
    cell
  );
}
/*
=========================================================
MESSAGE CELL
=========================================================
*/

function addMessageCell(
  row,
  playerName,
  message
) {

  const cell =
    document.createElement('td');

  const cleanMessage =
    String(
      message || ''
    ).trim();


  if (!cleanMessage) {

    cell.textContent = '';

    row.appendChild(cell);

    return;
  }


  /*
  Short messages can stay visible
  directly in the table.
  */

  if (
    cleanMessage.length <= 30
  ) {

    cell.textContent =
      cleanMessage;

    row.appendChild(cell);

    return;
  }


  /*
  Long messages get a READ button.
  */

  const button =
    document.createElement('button');

  button.type =
    'button';

  button.className =
    'message-read-button';

  button.textContent =
    'LÄS';


  button.addEventListener(
    'click',
    () => {

      openMessagePopup(
        playerName,
        cleanMessage
      );
    }
  );


  cell.appendChild(button);

  row.appendChild(cell);
}


/*
=========================================================
MESSAGE POPUP
=========================================================
*/

function openMessagePopup(
  playerName,
  message
) {

  const overlay =
    document.createElement('div');

  overlay.className =
    'message-popup-overlay';


  const popup =
    document.createElement('div');

  popup.className =
    'message-popup';


  const closeButton =
    document.createElement('button');

  closeButton.type =
    'button';

  closeButton.className =
    'message-popup-close';

  closeButton.textContent =
    '×';


  const label =
    document.createElement('div');

  label.className =
    'message-popup-label';

  label.textContent =
    'MEDDELANDE';


  const title =
    document.createElement('h2');

  title.textContent =
    playerName;


  const text =
    document.createElement('div');

  text.className =
    'message-popup-text';

  text.textContent =
    message;


  function closePopup() {

    overlay.remove();
  }


  closeButton.addEventListener(
    'click',
    closePopup
  );


  overlay.addEventListener(
    'click',
    event => {

      if (
        event.target === overlay
      ) {

        closePopup();
      }
    }
  );


  popup.appendChild(
    closeButton
  );

  popup.appendChild(
    label
  );

  popup.appendChild(
    title
  );

  popup.appendChild(
    text
  );

  overlay.appendChild(
    popup
  );

  document.body.appendChild(
    overlay
  );
}

/*
=========================================================
SAFE TABLE CELL
=========================================================
*/

function addCell(
  row,
  value
) {

  const cell =
    document.createElement('td');

  cell.textContent =
    value || '';

  row.appendChild(cell);
}


/*
=========================================================
BEAUTY BACKEND STATUS
=========================================================
*/

function setBeautyConnected() {

  const dot =
    document.getElementById(
      'beautyHealthDot'
    );

  const text =
    document.getElementById(
      'beautyHealthText'
    );

  const message =
    document.getElementById(
      'beautyHealthMessage'
    );

  if (dot) {
    dot.classList.add(
      'connected'
    );
  }

  if (text) {
    text.textContent =
      'CONNECTED';
  }

  if (message) {
    message.textContent =
      'Google backend connected';
  }
}


function setBeautyDisconnected(
  errorMessage
) {

  const dot =
    document.getElementById(
      'beautyHealthDot'
    );

  const text =
    document.getElementById(
      'beautyHealthText'
    );

  const message =
    document.getElementById(
      'beautyHealthMessage'
    );

  if (dot) {
    dot.classList.remove(
      'connected'
    );
  }

  if (text) {
    text.textContent =
      'PROBLEM';
  }

  if (message) {
    message.textContent =
      errorMessage ||
      'Google backend unavailable';
  }
}

/*
=========================================================
REGISTER PLAYER
=========================================================
*/

const registerPlayerButton =
  document.getElementById(
    'registerPlayerButton'
  );

if (registerPlayerButton) {

  registerPlayerButton.addEventListener(
    'click',
    () => {

      openRegisterPlayerPopup();

    }
  );
}


function openRegisterPlayerPopup() {

  const overlay =
    document.createElement('div');

  overlay.className =
    'register-popup-overlay';


  const popup =
    document.createElement('div');

  popup.className =
    'register-popup kiosk-register-popup';


  const closeButton =
    document.createElement('button');

  closeButton.type =
    'button';

  closeButton.className =
    'register-popup-close';

  closeButton.textContent =
    '×';


  const label =
    document.createElement('div');

  label.className =
    'register-popup-label';

  label.textContent =
    'BEAUTY REGISTRATION';


  const title =
    document.createElement('h2');

  title.textContent =
    'Register Player';


  const description =
    document.createElement('p');

  description.className =
    'register-popup-description';

  description.textContent =
    'Register a player directly from the Beauty Hub.';


  const errorBox =
    document.createElement('div');

  errorBox.className =
    'hub-register-error';

  errorBox.style.display =
    'none';


  /* =========================================================
     PLAYER
     ========================================================= */

  const playerField =
    document.createElement('div');

  playerField.className =
    'hub-kiosk-field hub-kiosk-player-field';


  const playerHeading =
    document.createElement('div');

  playerHeading.className =
    'hub-kiosk-label';

  playerHeading.innerHTML =
    'VÄLJ DITT NAMN <span>*</span>';


  const playerHelp =
    document.createElement('div');

  playerHelp.className =
    'hub-kiosk-help';

  playerHelp.innerHTML =
    'Hittar du inte ditt namn? Välj <strong>MITT NAMN FINNS INTE I LISTAN</strong> och skriv sedan ditt fullständiga namn.';


  const playerDropdown =
    document.createElement('div');

  playerDropdown.className =
    'hub-kiosk-player-dropdown';


  const playerTrigger =
    document.createElement('button');

  playerTrigger.type =
    'button';

  playerTrigger.className =
    'hub-kiosk-player-trigger';

  playerTrigger.innerHTML =
    '<span class="hub-kiosk-player-trigger-text">Välj...</span><span class="hub-kiosk-player-arrow">▼</span>';


  const playerMenu =
    document.createElement('div');

  playerMenu.className =
    'hub-kiosk-player-menu';


  const playerSearch =
    document.createElement('input');

  playerSearch.type =
    'text';

  playerSearch.className =
    'hub-kiosk-player-search';

  playerSearch.placeholder =
    'Sök ditt namn...';


  const newPlayerOption =
    document.createElement('button');

  newPlayerOption.type =
    'button';

  newPlayerOption.className =
    'hub-kiosk-player-option hub-kiosk-new-player';

  newPlayerOption.textContent =
    'MITT NAMN FINNS INTE I LISTAN';


  const playerList =
    document.createElement('div');

  playerList.className =
    'hub-kiosk-player-list';


  const playerValue =
    document.createElement('input');

  playerValue.type =
    'hidden';

  playerValue.id =
    'hubRegisterPlayer';


  const masterPlayers =
    window.beautyHubData &&
    Array.isArray(
      window.beautyHubData.masterPlayers
    )
      ? window.beautyHubData.masterPlayers
      : [];


  masterPlayers.forEach(
    playerName => {

      if (
        playerName ===
        'MITT NAMN FINNS INTE I LISTAN'
      ) {
        return;
      }

      const playerButton =
        document.createElement('button');

      playerButton.type =
        'button';

      playerButton.className =
        'hub-kiosk-player-option';

      playerButton.textContent =
        playerName;

      playerButton.dataset.playerName =
        playerName;

      playerList.appendChild(
        playerButton
      );
    }
  );


  playerMenu.appendChild(
    playerSearch
  );

  playerMenu.appendChild(
    newPlayerOption
  );

  playerMenu.appendChild(
    playerList
  );

  playerDropdown.appendChild(
    playerTrigger
  );

  playerDropdown.appendChild(
    playerMenu
  );

  playerDropdown.appendChild(
    playerValue
  );


  const newPlayerArea =
    document.createElement('div');

  newPlayerArea.className =
    'hub-kiosk-new-player-area';

  newPlayerArea.style.display =
    'none';


  const newPlayerHeading =
    document.createElement('div');

  newPlayerHeading.className =
    'hub-kiosk-label';

  newPlayerHeading.innerHTML =
    'SKRIV DITT FULLSTÄNDIGA NAMN <span>*</span>';


  const newNameInput =
    document.createElement('input');

  newNameInput.type =
    'text';

  newNameInput.id =
    'hubRegisterNewName';

  newNameInput.className =
    'hub-kiosk-new-name';

  newNameInput.placeholder =
    'Förnamn Efternamn';


  newPlayerArea.appendChild(
    newPlayerHeading
  );

  newPlayerArea.appendChild(
    newNameInput
  );


  function resetPlayerFilter() {

    playerSearch.value =
      '';

    playerList
      .querySelectorAll(
        '.hub-kiosk-player-option'
      )
      .forEach(
        button => {

          button.style.display =
            'block';
        }
      );
  }


  function closePlayerMenu() {

    playerMenu.classList.remove(
      'open'
    );
  }


  function setPlayer(
    playerName
  ) {

    playerValue.value =
      playerName;

    const triggerText =
      playerTrigger.querySelector(
        '.hub-kiosk-player-trigger-text'
      );

    triggerText.textContent =
      playerName;

    const isNewPlayer =
      playerName ===
      'MITT NAMN FINNS INTE I LISTAN';

    newPlayerArea.style.display =
      isNewPlayer
        ? 'block'
        : 'none';

    if (!isNewPlayer) {

      newNameInput.value =
        '';
    }

    resetPlayerFilter();

    closePlayerMenu();

    if (isNewPlayer) {

      setTimeout(
        () => {
          newNameInput.focus();
        },
        50
      );
    }
  }


  playerTrigger.addEventListener(
    'click',
    () => {

      playerMenu.classList.toggle(
        'open'
      );

      if (
        playerMenu.classList.contains(
          'open'
        )
      ) {

        setTimeout(
          () => {
            playerSearch.focus();
          },
          50
        );
      }
    }
  );


  playerSearch.addEventListener(
    'input',
    () => {

      const searchValue =
        playerSearch.value
          .trim()
          .toLocaleLowerCase(
            'sv-SE'
          );

      playerList
        .querySelectorAll(
          '.hub-kiosk-player-option'
        )
        .forEach(
          button => {

            const playerName =
              button.dataset.playerName
                .toLocaleLowerCase(
                  'sv-SE'
                );

            button.style.display =
              playerName.includes(
                searchValue
              )
                ? 'block'
                : 'none';
          }
        );
    }
  );


  playerList.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          '.hub-kiosk-player-option'
        );

      if (!button) {
        return;
      }

      setPlayer(
        button.dataset.playerName
      );
    }
  );


  newPlayerOption.addEventListener(
    'click',
    () => {

      setPlayer(
        'MITT NAMN FINNS INTE I LISTAN'
      );
    }
  );


  playerField.appendChild(
    playerHeading
  );

  playerField.appendChild(
    playerHelp
  );

  playerField.appendChild(
    playerDropdown
  );

  playerField.appendChild(
    newPlayerArea
  );


  /* =========================================================
     FOTO OCH VIDEO
     ========================================================= */

  const consentField =
    document.createElement('div');

  consentField.className =
    'hub-kiosk-field hub-kiosk-white-field';


  const consentHeading =
    document.createElement('div');

  consentHeading.className =
    'hub-kiosk-label';

  consentHeading.innerHTML =
    'FOTO O VIDEO <span>*</span>';


  const consentOptions =
    document.createElement('div');

  consentOptions.className =
    'hub-kiosk-consent-options';


  const consentYes =
    document.createElement('button');

  consentYes.type =
    'button';

  consentYes.className =
    'hub-kiosk-consent-button';

  consentYes.dataset.value =
    'JA, JAG GODKÄNNER';

  consentYes.textContent =
    'JA, JAG GODKÄNNER';


  const consentNo =
    document.createElement('button');

  consentNo.type =
    'button';

  consentNo.className =
    'hub-kiosk-consent-button';

  consentNo.dataset.value =
    'NEJ, JAG GODKÄNNER INTE';

  consentNo.textContent =
    'NEJ, JAG GODKÄNNER INTE';


  let selectedConsent =
    '';


  function selectConsent(
    button
  ) {

    consentOptions
      .querySelectorAll(
        '.hub-kiosk-consent-button'
      )
      .forEach(
        item => {

          item.classList.remove(
            'selected'
          );
        }
      );

    button.classList.add(
      'selected'
    );

    selectedConsent =
      button.dataset.value;
  }


  consentYes.addEventListener(
    'click',
    () => {
      selectConsent(
        consentYes
      );
    }
  );

  consentNo.addEventListener(
    'click',
    () => {
      selectConsent(
        consentNo
      );
    }
  );


  consentOptions.appendChild(
    consentYes
  );

  consentOptions.appendChild(
    consentNo
  );


  const consentHelp =
    document.createElement('div');

  consentHelp.className =
    'hub-kiosk-help';

  consentHelp.textContent =
    'Ditt svar används för att ange om AIK Dartförening får använda foto och video där du medverkar.';


  consentField.appendChild(
    consentHeading
  );

  consentField.appendChild(
    consentOptions
  );

  consentField.appendChild(
    consentHelp
  );


  /* =========================================================
     MESSAGE
     ========================================================= */

  const messageField =
    document.createElement('div');

  messageField.className =
    'hub-kiosk-field hub-kiosk-white-field';


  const messageHeading =
    document.createElement('div');

  messageHeading.className =
    'hub-kiosk-label';

  messageHeading.textContent =
    'MEDDELANDE';


  const messageInput =
    document.createElement('textarea');

  messageInput.id =
    'hubRegisterMessage';

  messageInput.className =
    'hub-kiosk-message';

  messageInput.placeholder =
    'Valfritt – t.ex. Jag blir cirka 15 minuter sen.';


  messageField.appendChild(
    messageHeading
  );

  messageField.appendChild(
    messageInput
  );


  /* =========================================================
     ACTIONS
     ========================================================= */

  const actions =
    document.createElement('div');

  actions.className =
    'hub-kiosk-actions';


  const cancelButton =
    document.createElement('button');

  cancelButton.type =
    'button';

  cancelButton.className =
    'hub-kiosk-cancel';

  cancelButton.textContent =
    'CANCEL';


  const submitButton =
    document.createElement('button');

  submitButton.type =
    'button';

  submitButton.className =
    'hub-kiosk-submit';

  submitButton.textContent =
    'ANMÄL MIG';


  function showError(
    message
  ) {

    errorBox.textContent =
      message;

    errorBox.style.display =
      'block';
  }


  function hideError() {

    errorBox.style.display =
      'none';

    errorBox.textContent =
      '';
  }


  function closePopup() {

    overlay.remove();
  }


  closeButton.addEventListener(
    'click',
    closePopup
  );

  cancelButton.addEventListener(
    'click',
    closePopup
  );

  overlay.addEventListener(
    'click',
    event => {

      if (
        event.target === overlay
      ) {

        closePopup();
      }
    }
  );


  submitButton.addEventListener(
  'click',
  async () => {

    hideError();

    if (!playerValue.value) {

      showError(
        'Välj ditt namn.'
      );

      return;
    }

    if (
      playerValue.value ===
        'MITT NAMN FINNS INTE I LISTAN' &&
      !newNameInput.value.trim()
    ) {

      showError(
        'Skriv ditt fullständiga namn.'
      );

      return;
    }

    if (!selectedConsent) {

      showError(
        'Välj JA eller NEJ för foto och video.'
      );

      return;
    }


    const originalText =
      submitButton.textContent;

    submitButton.disabled =
      true;

    submitButton.textContent =
      'REGISTRERAR...';


    try {

      const url =
        new URL(
          BEAUTY_HUB_URL
        );

      url.searchParams.set(
        'page',
        'hubregister'
      );

      url.searchParams.set(
        'selectedName',
        playerValue.value
      );

      url.searchParams.set(
        'newName',
        newNameInput.value.trim()
      );

      url.searchParams.set(
        'consent',
        selectedConsent
      );

      url.searchParams.set(
        'message',
        messageInput.value.trim()
      );


      const response =
        await fetch(
          url.toString(),
          {
            cache: 'no-store'
          }
        );


      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );
      }


      const result =
        await response.json();


      if (!result.success) {

        throw new Error(
          result.error ||
          'Registreringen kunde inte sparas.'
        );
      }


      closePopup();

      await loadBeautyHubData();


    } catch (error) {

      console.error(
        'Hub registration error:',
        error
      );

      showError(
        error.message ||
        'Registreringen kunde inte sparas.'
      );

      submitButton.disabled =
        false;

      submitButton.textContent =
        originalText;
    }
  }
);


  actions.appendChild(
    cancelButton
  );

  actions.appendChild(
    submitButton
  );


  popup.appendChild(
    closeButton
  );

  popup.appendChild(
    title
  );

  popup.appendChild(
    errorBox
  );

  popup.appendChild(
    playerField
  );

  popup.appendChild(
    consentField
  );

  popup.appendChild(
    messageField
  );

  popup.appendChild(
    actions
  );


  overlay.appendChild(
    popup
  );

  document.body.appendChild(
    overlay
  );
}

/*
=========================================================
START HUB
=========================================================
*/

loadBeautyHubData();

setInterval(
  loadBeautyHubData,
  5000
);