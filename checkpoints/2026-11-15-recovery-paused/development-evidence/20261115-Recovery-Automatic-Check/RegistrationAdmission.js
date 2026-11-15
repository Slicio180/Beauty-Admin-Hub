/* Fresh admission check shared by HUB, KIOSK and MOBIL, before any row write.
 * No provider mutation and no cached open-state permission. */
function beautyHubRegistrationAdmission_(expected){
 beautyHubTestGuard_();
 const unavailable=()=>({success:false,code:'REGISTRATION_CHECK_UNAVAILABLE',error:'Registration could not be opened because the event status could not be checked. Nothing was saved. Try again when the connection is available.'});
 try{
  const target=beautyHubActiveTestTarget_(),context=beautyContextToken_(),props=PropertiesService.getScriptProperties();
  if(!target?.id||beautyHubNakkaDate_().date!==expected)return {success:false,code:'STALE_EVENT',error:'The selected event changed. Reload before registering. Nothing was saved.'};
  const user=props.getProperty('N01_API_USER'),password=props.getProperty('N01_API_PASSWORD');if(!user||!password)return unavailable();
  const data=beautyHubTransferFetch_('tournament/get?tdid='+target.id+'&entry=0','Basic '+Utilities.base64Encode(user+':'+password)),event=data.tournament;
  if(context!==beautyContextToken_()||beautyHubActiveTestTarget_().id!==target.id||beautyHubNakkaDate_().date!==expected)return {success:false,code:'STALE_EVENT',error:'The selected event changed. Reload before registering. Nothing was saved.'};
  if(!event||event.tdid!==target.id||event.title!==target.title||(event.lgid||'')!==(beautyHubLeagueId_()||'')||typeof event.t_date!=='number'||Utilities.formatDate(new Date(event.t_date*1000),'Europe/Berlin','yyyy-MM-dd')!==expected)return unavailable();
  if(![10,20].includes(event.status))return {success:false,code:'REGISTRATION_CLOSED',error:event.status===40?'This event is completed. Registration is closed. Nothing was saved. Select the next event to register a player.':'Registration is closed for this event. Nothing was saved. Ask the organiser which event to use.'};
  return {success:true,eventDate:expected};
 }catch(e){return unavailable();}
}
