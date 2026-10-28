/* Injected only into generated Identity TEST HTML, not into the offline preview. */
function addStatusCell(row, playerName, currentStatus) {
  const cell = document.createElement('td');
  const select = document.createElement('select');
  select.className = 'status-select';
  select.setAttribute('aria-label', 'Status for ' + playerName);
  select.disabled = pendingStatusChanges.has(playerName);
  for (const status of ['IN', 'OUT', 'STANDBY']) {
    const option = document.createElement('option');
    option.value = status; option.textContent = status; option.selected = status === currentStatus;
    select.appendChild(option);
  }
  setStatusClass(select, currentStatus);
  select.addEventListener('change', async () => {
    if (pendingStatusChanges.has(playerName)) return;
    const status = select.value;
    const snapshot = window.beautyHubData;
    const matches = (snapshot?.players || []).filter(p => p.player === playerName);
    if (matches.length !== 1) { select.value = currentStatus; openMessagePopup('Status', 'Reload the player list before changing status.'); return; }
    const expectedStatus = matches[0].status;
    pendingStatusChanges.set(playerName, status);
    select.disabled = true;
    setStatusClass(select, status);
    let refreshNeeded = false;
    try {
      const url = new URL(BEAUTY_HUB_URL);
      for (const [key, value] of Object.entries({ page: 'hubstatus', player: playerName, status,
        expectedStatus, eventDate: snapshot.eventDate })) url.searchParams.set(key, value);
      const result = await (await BeautyHubServices.request(url.toString())).json();
      if (!result.success || result.readbackVerified !== true || !result.data) {
        throw new Error(result.error || 'Status could not be verified. Reload before another change.');
      }
      pendingStatusChanges.delete(playerName);
      updateHub(result.data);
    } catch (error) {
      pendingStatusChanges.delete(playerName);
      refreshNeeded = true;
      select.value = expectedStatus;
      setStatusClass(select, expectedStatus);
      openMessagePopup('Status', error.message);
    } finally {
      select.disabled = false;
      if (refreshNeeded) await loadBeautyHubData();
    }
  });
  cell.appendChild(select); row.appendChild(cell);
}
