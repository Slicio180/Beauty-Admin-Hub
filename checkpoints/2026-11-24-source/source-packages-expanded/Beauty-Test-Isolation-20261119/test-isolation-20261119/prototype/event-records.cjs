// Offline prototype only. No Apps Script entry points, services, writes or deployment.
'use strict';
const sameEvent=(a,b)=>['leagueId','eventId','eventDate'].every(k=>a[k]===b[k]);
function event(e){
 if(!e||!/^lg_[A-Za-z0-9_]+$/.test(e.leagueId)||!/^t_[A-Za-z0-9_]+$/.test(e.eventId)||!/^20\d\d-\d\d-\d\d$/.test(e.eventDate)||!Number.isFinite(Date.parse(e.eventDate+'T12:00:00Z'))||new Date(e.eventDate+'T12:00:00Z').toISOString().slice(0,10)!==e.eventDate)throw Error('INVALID_EVENT');
 return {leagueId:e.leagueId,eventId:e.eventId,eventDate:e.eventDate};
}
const nameKey=s=>String(s).normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
function record(r){
 event(r);
 if(typeof r.registrationId!=='string'||!/^reg_[A-Za-z0-9_]{8,80}$/.test(r.registrationId)||typeof r.player!=='string'||!nameKey(r.player)||typeof r.submittedAt!=='string'||!Number.isFinite(Date.parse(r.submittedAt))||!['ACTIVE','REMOVED'].includes(r.state)||!['JA','NEJ'].includes(r.consent)||!['HUB','KIOSK','MOBIL'].includes(r.source)||typeof r.message!=='string')throw Error('INVALID_RECORD');
 return r;
}
function validate(rows){
 if(!Array.isArray(rows))throw Error('INVALID_LEDGER');
 const ids=new Set();for(const r of rows){record(r);if(ids.has(r.registrationId))throw Error('DUPLICATE_ID');ids.add(r.registrationId);}
}
function select(rows,scope){validate(rows);event(scope);return rows.filter(r=>sameEvent(r,scope)&&r.state==='ACTIVE').map(r=>({...r}));}
function append(rows,incoming){
 validate(rows);record(incoming);if(incoming.state!=='ACTIVE')throw Error('INVALID_NEW_STATE');
 const old=rows.find(r=>r.registrationId===incoming.registrationId);
 if(old){if(['leagueId','eventId','eventDate','player','submittedAt','consent','message','source','state'].some(k=>old[k]!==incoming[k]))throw Error('RETRY_CONFLICT');return {changed:false,rows:rows.map(r=>({...r}))};}
 if(rows.some(r=>sameEvent(r,incoming)&&r.state==='ACTIVE'&&nameKey(r.player)===nameKey(incoming.player)))throw Error('PLAYER_ALREADY_REGISTERED');
 return {changed:true,rows:[...rows.map(r=>({...r})),{...incoming}]};
}
function remove(rows,scope,id){
 validate(rows);event(scope);const r=rows.find(r=>r.registrationId===id);
 if(!r||!sameEvent(r,scope))throw Error('REGISTRATION_NOT_IN_EVENT');
 return {changed:r.state!=='REMOVED',rows:rows.map(row=>({...row,...(row.registrationId===id?{state:'REMOVED'}:{})}))};
}
module.exports={select,append,remove};
