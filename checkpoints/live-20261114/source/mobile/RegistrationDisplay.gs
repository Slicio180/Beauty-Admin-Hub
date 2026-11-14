/* Public read-only event label. Uses the same Control date and league as the
 * published registration backend. No registration/status/Nakka mutation. */
function beautyPrevious_getRegistrationDisplayContext_() {
  if(arguments.length)throw Error('Unexpected display input.');
  let eventDate='';
  try {
    const control=SpreadsheetApp.openById(SHEET_ID).getSheetByName('Control');
    if(!control)throw Error('Missing control.');
    const zone=Session.getScriptTimeZone();
    const readDate=()=>{
      const value=control.getRange('A2').getValue();
      if(!(value instanceof Date)||!Number.isFinite(value.getTime()))throw Error('Invalid date.');
      return Utilities.formatDate(value,zone,'yyyy-MM-dd');
    };
    eventDate=readDate();
    const properties=PropertiesService.getScriptProperties();
    const user=properties.getProperty('N01_API_USER'),password=properties.getProperty('N01_API_PASSWORD');
    if(!user||!password)throw Error('Missing credentials.');
    const response=UrlFetchApp.fetch('https://push.n01darts.com/api/v1/league/tournament/list?lgid=lg_tM2v_3523&count=100',{
      method:'get',headers:{Authorization:'Basic '+Utilities.base64Encode(user+':'+password)},muteHttpExceptions:true,followRedirects:false
    });
    if(response.getResponseCode()!==200)throw Error('Event unavailable.');
    const data=JSON.parse(response.getContentText());
    if(data.result!==0||!Array.isArray(data.list))throw Error('Invalid event list.');
    const matches=data.list.filter(event=>Number.isFinite(event.t_date)&&Utilities.formatDate(new Date(event.t_date*1000),zone,'yyyy-MM-dd')===eventDate);
    if(readDate()!==eventDate){eventDate='';throw Error('Date changed.');}
    if(matches.length!==1||typeof matches[0].title!=='string'||!matches[0].title.trim()||matches[0].title.length>250)throw Error('Event title unavailable.');
    return {success:true,eventDate,eventTitle:matches[0].title.trim()};
  }catch(e){return {success:false,eventDate,eventTitle:''};}
}
