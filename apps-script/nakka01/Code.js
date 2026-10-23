function testAddExistingLeaguePlayer() {

  const properties = PropertiesService.getScriptProperties();

  const apiUser = properties.getProperty('N01_API_USER');
  const apiPassword = properties.getProperty('N01_API_PASSWORD');

  if (!apiUser || !apiPassword) {
    throw new Error('N01 API credentials are missing.');
  }

  const eventId = 't_BTnU_9539';

  const url =
    'https://push.n01darts.com/api/v1/tournament/entry/update';

  const payload = {
    tdid: eventId,
    add: [
      {
        name: 'Alessio Tampella',
        lpid: 'e4x7'
      }
    ]
  };

  const auth =
    Utilities.base64Encode(apiUser + ':' + apiPassword);

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Basic ' + auth
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  Logger.log('STATUS: ' + response.getResponseCode());
  Logger.log(response.getContentText());
}