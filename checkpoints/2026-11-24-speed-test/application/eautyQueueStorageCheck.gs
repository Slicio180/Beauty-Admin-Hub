function beautyQueueStorageCheck20261114() {
  beautyLiveLoginGuard_();

  const properties =
    PropertiesService.getScriptProperties().getProperties();
  const bytes = text =>
    Utilities.newBlob(String(text)).getBytes().length;

  const groups = {};
  for (const [key, value] of Object.entries(properties)) {
    const group =
      key.startsWith('BEAUTY_REG_JOB_') ? 'registrationJobs' :
      key.startsWith('BEAUTY_LEAGUE_STATS_') ? 'leagueStatistics' :
      key.startsWith('beauty-hub-session:') ? 'sessions' :
      'other';

    if (!groups[group]) {
  groups[group] = { count: 0, valueBytes: 0 };
}
    groups[group].count++;
    groups[group].valueBytes += bytes(value);
  }

  console.log(JSON.stringify({
    result: 'READ_ONLY_STORAGE_CHECK',
    groups,
    serializedBytes: bytes(JSON.stringify(properties)),
    writesPerformed: false
  }, null, 2));
}