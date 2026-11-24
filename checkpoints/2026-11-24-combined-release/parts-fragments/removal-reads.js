function beautyLiveRemoveReads_(authorization,includeLeague){
  beautyLiveLoginGuard_();beautyContextAssert_();
  const t=beautyLiveTarget_(),context=JSON.stringify(t),paths=['tournament/get?tdid='+t.eventId,'tournament/entry/list?tdid='+t.eventId];
  if(includeLeague&&!beautyContextStandalone_())paths.push('league/entry/list?lgid='+t.leagueId);
  paths.forEach(path=>beautyReleaseProviderGuard_(path));
  const p=PropertiesService.getScriptProperties(),user=p.getProperty('N01_API_USER'),password=p.getProperty('N01_API_PASSWORD');
  if(!user||!password)throw Error('Nakka credentials missing.');
  const responses=UrlFetchApp.fetchAll(paths.map(path=>({url:'https://push.n01darts.com/api/v1/'+path,method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},muteHttpExceptions:true,followRedirects:false})));
  beautyContextAssert_();if(JSON.stringify(beautyLiveContextRead_())!==context)throw Error('STALE');
  if(!Array.isArray(responses)||responses.length!==paths.length)throw Error('Nakka batch is incomplete.');
  return responses.map(response=>{
    if(response.getResponseCode()!==200)throw Error('Nakka request failed.');
    const data=JSON.parse(response.getContentText());if(data.result!==0)throw Error('Nakka did not confirm request.');return data;
  });
}
