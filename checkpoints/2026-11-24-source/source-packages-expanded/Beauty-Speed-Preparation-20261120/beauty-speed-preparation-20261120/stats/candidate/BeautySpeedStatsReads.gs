/* OFFLINE CANDIDATE ONLY. Fixed read routes; no mutation or retry. */
function beautySpeedStatsReads_(authorization) {
  if(typeof beautyContextAssert_!=='function')throw Error('Context guard required');
  beautyContextAssert_();
  const leagueId=beautyHubLeagueId_();
  const paths=['league/stats?lgid='+leagueId+'&kind=stats_list',
    'league/stats?lgid='+leagueId+'&kind=rank_list'];
  paths.forEach(beautyTestNakkaReadGuard_);
  return beautyHubNakkaMeasure_('league-statistics-read-batch',()=>{
    // Sequential compatibility path is chosen only before any batch is sent.
    // A failed batch is never replayed automatically.
    if(typeof UrlFetchApp.fetchAll!=='function')
      return paths.map(path=>beautyHubTransferFetch_(path,authorization));
    const responses=UrlFetchApp.fetchAll(paths.map(path=>({
      url:'https://push.n01darts.com/api/v1/'+path,method:'get',
      headers:{Authorization:authorization},muteHttpExceptions:true,followRedirects:false
    })));
    if(!Array.isArray(responses)||responses.length!==paths.length)
      beautyHubTransferError_('NAKKA_LAYOUT');
    return responses.map(beautyHubTransferDecode_);
  });
}
