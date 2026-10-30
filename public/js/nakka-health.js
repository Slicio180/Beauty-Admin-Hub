/* Independent from the existing five-second Beauty data/status polling. */
(() => {
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const MANUAL_COOLDOWN_MS = 60 * 1000;
  const REQUEST_TIMEOUT_MS = 15 * 1000;

  const card = document.getElementById('nakkaHealthCard');
  const dot = document.getElementById('nakkaHealthDot');
  const status = document.getElementById('nakkaHealthText');
  const message = document.getElementById('nakkaHealthMessage');
  const timestamp = document.getElementById('nakkaHealthTimestamp');
  const refresh = document.getElementById('nakkaHealthRefresh');

  if (!card || !dot || !status || !message || !timestamp || !refresh) {
    return;
  }

  let inFlight = false;
  let epoch = 0;
  let controllerInFlight = null;
  let nextAllowedAt = 0;
  let lastStartedAt = 0;
  let cooldownTimer;

  function updateRefreshButton() {
    clearTimeout(cooldownTimer);
    const remaining = Math.max(0, nextAllowedAt - Date.now());
    refresh.disabled = inFlight || remaining > 0;
    refresh.textContent = inFlight ? 'CHECKING…' : 'REFRESH';
    refresh.title = remaining > 0
      ? 'Refresh is available once per minute.'
      : 'Check Nakka league access';

    if (remaining > 0) {
      cooldownTimer = setTimeout(updateRefreshButton, remaining);
    }
  }

  function updateNavigation(state, label) {
    const nav=document.getElementById('nakkaNavButton');
    if(nav){nav.setAttribute('data-health',state);nav.setAttribute('title','Nakka — '+label);nav.setAttribute('aria-label','Nakka — '+label);}
  }
  function renderHealth(health) {
    status.textContent = health.status;
    updateNavigation({OK:'ok',DEGRADED:'degraded',UNAVAILABLE:'problem'}[health.status],health.status+': '+health.message);
    dot.classList.remove('waiting', 'ok', 'degraded', 'problem');
    dot.classList.add({ OK: 'ok', DEGRADED: 'degraded', UNAVAILABLE: 'problem' }[health.status]);
    message.textContent = health.message;
    timestamp.dateTime = health.timestamp;
    timestamp.textContent = 'Checked: ' + new Date(health.timestamp).toLocaleString('en-GB',{timeZone:'Europe/Stockholm'});
  }

  async function loadNakkaHealth() {
    // Authenticated TEST must not probe before its Hub session exists.
    if (typeof BeautyHubAuth !== 'undefined') {
      try { BeautyHubAuth.token(); } catch (error) { return; }
    }
    if (document.hidden || inFlight || Date.now() < nextAllowedAt) {
      return;
    }

    const requestEpoch = epoch;
    inFlight = true;
    lastStartedAt = Date.now();
    nextAllowedAt = lastStartedAt + MANUAL_COOLDOWN_MS;
    card.setAttribute('aria-busy', 'true');
    // Never leave an old OK result looking current while a refresh is pending.
    status.textContent = 'CHECKING';
    updateNavigation('waiting','Checking connection');
    dot.classList.remove('ok', 'degraded', 'problem');
    dot.classList.add('waiting');
    message.textContent = 'Checking Nakka league access…';
    updateRefreshButton();

    const controller = new AbortController();
    controllerInFlight = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // Reuse the existing backend URL; credentials remain in Apps Script.
      const url = new URL(BEAUTY_HUB_URL);
      url.searchParams.set('page', 'nakkahealth');

      const response = await BeautyHubServices.request(url.toString(), {
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Health endpoint unavailable');
      }

      const health = await response.json();
      if (
        !health ||
        !['OK', 'DEGRADED', 'UNAVAILABLE'].includes(health.status) ||
        typeof health.message !== 'string' ||
        !health.message.trim() ||
        typeof health.timestamp !== 'string' ||
        !Number.isFinite(Date.parse(health.timestamp))
      ) {
        throw new Error('Invalid health response');
      }

      if (requestEpoch === epoch) renderHealth(health);
    } catch (error) {
      if (requestEpoch !== epoch) return;
      // Do not display response bodies or raw exceptions from the backend.
      renderHealth({
        status: 'UNAVAILABLE',
        message: controller.signal.aborted
          ? 'The health check timed out. Nakka health could not be confirmed.'
          : 'The health endpoint could not be reached or returned an invalid response.',
        timestamp: new Date().toISOString()
      });
    } finally {
      clearTimeout(timeout);
      if (requestEpoch !== epoch) return;
      controllerInFlight = null;
      inFlight = false;
      card.setAttribute('aria-busy', 'false');
      updateRefreshButton();
    }
  }

  document.addEventListener('beauty-hub-locked', () => {
    epoch++;
    controllerInFlight?.abort();
    controllerInFlight = null;
    inFlight = false;
    nextAllowedAt = 0;
    lastStartedAt = 0;
    status.textContent = 'NOT CHECKED';
    message.textContent = 'Sign in to check Nakka connectivity.';
    timestamp.textContent = 'No check completed';
    timestamp.dateTime = '';
    updateNavigation('waiting', 'Not checked');
    dot.classList.remove('ok', 'degraded', 'problem');
    dot.classList.add('waiting');
    card.setAttribute('aria-busy', 'false');
    updateRefreshButton();
  });
  document.addEventListener('beauty-hub-opened', loadNakkaHealth);
  refresh.addEventListener('click', loadNakkaHealth);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastStartedAt >= REFRESH_INTERVAL_MS) {
      loadNakkaHealth();
    }
  });

  loadNakkaHealth();
  setInterval(loadNakkaHealth, REFRESH_INTERVAL_MS);
})();
