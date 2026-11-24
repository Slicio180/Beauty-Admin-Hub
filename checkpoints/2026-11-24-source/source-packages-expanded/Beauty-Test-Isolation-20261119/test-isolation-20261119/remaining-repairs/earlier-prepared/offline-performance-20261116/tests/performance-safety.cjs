/* Offline differential tests. All transports are fixtures; no HTTP client is available. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),checks=[],metrics={};
const read=(variant,name)=>fs.readFileSync(path.join(root,variant,name+'.js'),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
function test(name,fn){fn();checks.push(name);}
const headers={Control:['START DATE','LAST RESET'],'PLAYER STATUS DATA':['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],"TONIGHT'S PLAYERS":['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],"PLAYER'S MASTER LIST":['PLAYERS'],'Form responses 2':['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM']};
const names=Object.keys(headers),target={sheetId:'original',eventId:'t_event',leagueId:'lg_league',date:'2026-11-16',mode:'league',revision:'revision'};
const formula=read('baseline','LiveRemove').match(/const expected=("[^\n]+");/)[1];
const rosterFormula=JSON.parse(formula);
function fixture(variant,options={}){
  const props={},cache=new Map(),logs=[],effects=[],counts={nativeReads:0,gridReads:0,providerPhases:0,providerRequests:0,flush:0};
  let locked=false,uuid=0,afterBackup=false;
  const values={Control:[headers.Control,[46342,36526]],'PLAYER STATUS DATA':[headers['PLAYER STATUS DATA'],['Åsa One','','IN','JA','A message\nwith two lines','KIOSK'],['Bob Two','','OUT','NEJ','','HUB']],"PLAYER'S MASTER LIST":[headers["PLAYER'S MASTER LIST"],['Åsa One'],['Bob Two']],'Form responses 2':[headers['Form responses 2'],[46342.5,'Åsa One','','JA, JAG GODKÄNNER','A message\nwith two lines','KIOSK'],[46342.6,'Bob Two','','NEJ, JAG GODKÄNNER INTE','','HUB']]};
  const statusCells=['OUT','IN'];
  const members=[{name:'Åsa One',lpid:'Aa01'},{name:'Bob Two',lpid:'Bb02'}];
  let entries=[{name:'Åsa One',lpid:'Aa01',tpid:'Aa11'},{name:'Bob Two',lpid:'Bb02',tpid:'Bb22'}];
  const event={tdid:target.eventId,lgid:target.leagueId,title:'Fixture Monday',status:10,t_date:1794823200,updateTime:1,team_games:0};
  const p={getProperty:k=>props[k]??null,getProperties:()=>({...props}),setProperty:(k,v)=>{props[k]=v;},deleteProperty:k=>{delete props[k];}};
  function roster(){return values['Form responses 2'].slice(1).filter(r=>r[1]||r[2]).map(r=>r[1]==='MITT NAMN FINNS INTE I LISTAN'?r[2]:r[1]).sort((a,b)=>a.localeCompare(b,'sv-SE'));}
  function matrix(title){if(title!=="TONIGHT'S PLAYERS")return values[title];return [headers[title],...Array.from({length:99},(_,i)=>{const name=roster()[i]||'',stored=values['PLAYER STATUS DATA'].find(r=>r[0]===name)||[];return [name,'',statusCells[i]||'',name?stored[3]||'':'',name?stored[4]||'':'',name?stored[5]||'':''];})];}
  function cells(title,row,col,n,w,kind){return Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>{
    const r=row+i-1,c=col+j-1,value=matrix(title)[r]?.[c]??'';
    if(kind==='formulas'){if(title==="TONIGHT'S PLAYERS"&&r===1&&c===0)return options.badFormula?'=WRONG()':rosterFormula;if(title==='PLAYER STATUS DATA'&&r===1&&c===4&&options.statusFormula)return '=1';return '';}
    if(kind==='formats')return c===0&&(title==='Control'||title==='Form responses 2')?'dd/mm/yyyy hh:mm:ss':'General';
    if(kind==='display'){if(title==='Control'&&r===1)return c===0?'16/11/2026':'01/01/2000';return value instanceof Date?value.toISOString():String(value);}
    return value;
  }));}
  const sheets={};
  for(const [index,title]of names.entries())sheets[title]={getName:()=>title,getSheetId:()=>index+1,getLastRow:()=>title==="TONIGHT'S PLAYERS"?100:matrix(title).length,getMaxRows:()=>title==="TONIGHT'S PLAYERS"?100:1000,getLastColumn:()=>headers[title].length,getRange:(row,col,n=1,w=1)=>{
    if(row==='A2')return {getValue:()=>new Date('2026-11-16T12:00:00Z')};
    const range={};for(const [method,kind]of [['getValues','values'],['getDisplayValues','display'],['getFormulas','formulas'],['getNumberFormats','formats']])range[method]=()=>{counts.nativeReads++;return cells(title,row,col,n,w,kind);};
    range.clearContent=()=>{effects.push(['clear',title,row,col,n,w]);for(let i=0;i<n;i++)for(let j=0;j<w;j++)values[title][row+i-1][col+j-1]='';};
    range.setValues=rows=>{effects.push(['write',title,row,col]);assert.equal(title,"TONIGHT'S PLAYERS");assert.equal(col,3);rows.forEach((v,i)=>statusCells[row+i-2]=v[0]);};return range;
  }};
  const ss={getId:()=>target.sheetId,getSpreadsheetLocale:()=>'en_GB',getSpreadsheetTimeZone:()=>'Africa/Ceuta',getSheetByName:n=>sheets[n]};
  function provider(route,payload,countPhase=true){if(countPhase)counts.providerPhases++;counts.providerRequests++;if(options.providerFailure)throw Error('fixture unavailable');
    if(route==='tournament/entry/update'){effects.push(['remove',plain(payload)]);assert.equal(payload.remove.length,1);entries=entries.filter(r=>r.tpid!==payload.remove[0]);if(options.lostDeleteReply)throw Error('lost reply');return {result:0,removed:1,updated:0,added:[]};}
    if(route.startsWith('tournament/get'))return {result:0,tournament:plain({...event,...(options.bracket?{table:{player:'Aa11'}}:{})})};
    if(route.startsWith('tournament/entry/list'))return {result:0,list:plain(entries)};
    if(route.startsWith('league/entry/list'))return {result:0,list:plain(members)};throw Error('Unexpected route');
  }
  const c={console:{log:line=>{if(options.badLogger)throw Error('logger');logs.push(JSON.parse(line));}},Date,Map,Set,JSON,Error,Number,String,Array,Object,
    Utilities:{getUuid:()=> (++uuid).toString(16).padStart(32,'0'),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()],base64Encode:s=>Buffer.from(s).toString('base64'),formatDate:(d,z,format)=>format==='yyyyMMdd-HHmmss'?'20261116-120000':format==='yyyy-MM-dd'?target.date:d.toISOString().slice(0,-1),sleep:()=>{}},
    SpreadsheetApp:{openById:id=>{assert.equal(id,target.sheetId);return ss;},flush:()=>counts.flush++},
    PropertiesService:{getScriptProperties:()=>({ ...p,getProperty:k=>k==='N01_API_USER'?'fixture-user':k==='N01_API_PASSWORD'?'fixture-secret':p.getProperty(k)})},
    CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true;},releaseLock:()=>locked=false})},
    beautyLiveLoginGuard_:()=>{},beautyContextAssert_:()=>{if(options.contextDrift)throw Error('changed');},beautyLiveTarget_:()=>target,beautyContextStandalone_:()=>false,
    beautyHubAuthRequire_:token=>{if(token!=='staff')throw Object.assign(Error('auth'),{name:'HubAuthError'});return {uid:'owner',sessionBinding:'staff'};},
    beautyQueueWriteGuard_:()=>{if(options.activeWorker)throw Error('busy');},
    beautyLiveEventRead_:()=>({status:'MATCHED',event:{id:target.eventId},eventDate:target.date}),
    beautyRecoveryRecordSave_:()=>{effects.push(['backup']);afterBackup=true;if(options.driftAfterBackup)values['PLAYER STATUS DATA'][2][4]='Changed by another operator';},
    UrlFetchApp:{fetchAll:requests=>{counts.providerPhases++;return requests.map(request=>{assert.equal(request.method,'get');assert.equal(request.payload,undefined);const body=provider(request.url.split('/api/v1/')[1],undefined,false);return {getResponseCode:()=>200,getContentText:()=>JSON.stringify(body)};});}},
  };
  vm.createContext(c);vm.runInContext(read(variant,'LiveRegister'),c);vm.runInContext(read(variant,'LiveRemove'),c);
  c.beautyLiveRegistrationApi_=provider;
  c.beautyLiveDashboardRead_=()=>({eventDate:target.date,players:roster().map((name,i)=>{const s=values['PLAYER STATUS DATA'].find(r=>r[0]===name);return {player:name,newPlayer:'',status:statusCells[i]||'',consent:s[3],message:s[4],whereFrom:s[5]};})});
  c.beautyLiveSheetsRead_=query=>{
    counts.gridReads++;const params=new URL('https://fixture.invalid/'+query).searchParams,ranges=params.getAll('ranges');assert.equal(ranges.length,5);
    const result={spreadsheetId:target.sheetId,sheets:ranges.map(range=>{
      const m=range.match(/^'((?:[^']|'')+)'!A1:([A-F])(\d+)$/);assert(m);const title=m[1].replace(/''/g,"'"),width=m[2].charCodeAt(0)-64,n=+m[3];
      const display=cells(title,1,1,n,width,'display'),formulas=cells(title,1,1,n,width,'formulas');
      return {properties:{title,sheetId:names.indexOf(title)+1},data:[{rowData:display.map((row,r)=>({values:row.map((value,col)=>({...value?{formattedValue:value}:{},...formulas[r][col]?{userEnteredValue:{formulaValue:formulas[r][col]}}:{}}))}))}]};
    }).reverse()};
    if(options.badGrid)result.sheets.pop();if(options.wrongGridId)result.spreadsheetId='another';if(options.offsetGrid)result.sheets[0].data[0].startRow=1;
    return result;
  };
  const preview=()=>c.beautyLiveRemove_('preview',{player:'Åsa One',eventDate:target.date},'staff');
  const save=ticket=>c.beautyLiveRemove_('save',{player:'Åsa One',eventDate:target.date,confirmed:'true',ticket},'staff');
  return {c,ss,values,counts,logs,effects,props,preview,save,entries:()=>entries,locked:()=>locked,members,afterBackup:()=>afterBackup};
}

test('Batched removal snapshot is identical to the original, including formulas, dates, formats and Unicode',()=>{
  const before=fixture('baseline'),after=fixture('candidate');
  before.values['Form responses 2'][2][0]=after.values['Form responses 2'][2][0]=new Date('2026-11-16T15:30:00.123Z');
  const a=before.c.beautyLiveRemoveSnapshot_(before.ss),b=after.c.beautyLiveRemoveSnapshot_(after.ss);
  assert.equal(JSON.stringify(b),JSON.stringify(a));assert(b['Form responses 2'].values[2][0] instanceof Date);
  metrics.snapshot={baseline:plain(before.counts),candidate:plain(after.counts)};
  assert.equal(before.counts.nativeReads,20);assert.equal(after.counts.nativeReads,10);assert.equal(after.counts.gridReads,1);
});
test('A complete removal preserves other players and makes exactly the same data changes',()=>{
  const a=fixture('baseline'),b=fixture('candidate');
  for(const f of [a,b]){const p=f.preview();if(!p.success){f.c.beautyLiveRemoveState_({player:'Åsa One',eventDate:target.date},null);throw Error(JSON.stringify(p));}assert.equal(p.status,'PREVIEW');const r=f.save(p.ticket);assert.equal(r.status,'REMOVED');assert.equal(r.readbackVerified,true);assert.equal(f.locked(),false);assert.equal(f.entries().length,1);assert.equal(f.entries()[0].name,'Bob Two');assert.equal(f.props.BEAUTY_LIVE_REMOVE_PENDING,undefined);}
  assert.deepEqual(plain(b.values),plain(a.values));assert.deepEqual(b.effects,a.effects);
  metrics.completeRemoval={baseline:plain(a.counts),candidate:plain(b.counts)};
  assert(b.counts.nativeReads<a.counts.nativeReads);assert(b.counts.providerPhases<a.counts.providerPhases);assert.equal(a.counts.providerRequests,b.counts.providerRequests);
});
for(const option of ['badFormula','statusFormula','bracket','providerFailure','activeWorker'])test(option+' rejects removal before player data changes',()=>{
  for(const variant of ['baseline','candidate']){const f=fixture(variant,{[option]:true}),r=f.preview();assert.equal(r.success,false);assert.equal(f.effects.length,0);assert.equal(f.locked(),false);}
});
for(const option of ['badGrid','wrongGridId','offsetGrid'])test(option+' stops the candidate before backup or deletion',()=>{const f=fixture('candidate',{[option]:true});assert.equal(f.preview().success,false);assert.equal(f.effects.length,0);});
test('Changed data during backup still prevents Nakka deletion',()=>{for(const variant of ['baseline','candidate']){const f=fixture(variant,{driftAfterBackup:true}),p=f.preview();assert(p.success);assert.equal(f.save(p.ticket).code,'REMOVE_STALE');assert.deepEqual(f.effects,[['backup']]);}});
test('A lost deletion reply preserves the pending receipt and never repeats the deletion',()=>{for(const variant of ['baseline','candidate']){const f=fixture(variant,{lostDeleteReply:true}),p=f.preview();assert.equal(f.save(p.ticket).code,'REMOVE_UNCERTAIN');assert(f.props.BEAUTY_LIVE_REMOVE_PENDING);f.save(p.ticket);assert.equal(f.effects.filter(x=>x[0]==='remove').length,1);assert(!f.effects.some(x=>x[0]==='clear'));}});
test('Removal timing reports no names, credentials, messages or receipt payloads',()=>{const f=fixture('candidate'),p=f.preview();f.save(p.ticket);assert.equal(f.logs.length,2);for(const log of f.logs){assert.equal(log.kind,'BEAUTY_REMOVAL_TIMING');assert.equal(typeof log.totalMs,'number');assert(log.phases['sheet-snapshot']);}const raw=JSON.stringify(f.logs);for(const value of ['Åsa','Bob','fixture-secret','fixture-user','A message','owner'])assert(!raw.includes(value));});
test('Timing-log failure cannot fail a successful removal',()=>{const f=fixture('candidate',{badLogger:true}),p=f.preview();assert.equal(f.save(p.ticket).status,'REMOVED');});

function syncFixture(variant,options={}){
  const counts={reads:0,flush:0,writes:0},stored=[['Åsa One','','IN','JA','  original message  ','MOBIL'],['Bob Two','','OUT','NEJ','','HUB']];let status=['',''],round=0;
  const c={Date,Map,Set,JSON,Error,Number,String,Array,Object,Utilities:{sleep:()=>{}},SpreadsheetApp:{flush:()=>counts.flush++},beautyLiveTarget_:()=>target};
  vm.createContext(c);vm.runInContext(read(variant,'LiveRegister'),c);
  const data=(title,width)=>{if(title==='PLAYER STATUS DATA')return stored.map(r=>r.slice(0,width));const players=options.missingPlayer?['Bob Two']:['Åsa One','Bob Two'];return players.map((name,i)=>[name,'',status[i]].slice(0,width));};
  c.beautyLiveRegistrationRows_=(sheet,width)=>{counts.reads++;return data(sheet.name,width);};
  c.beautyLiveSheetsRead_=query=>{
    counts.reads++;const ranges=new URL('https://fixture.invalid/'+query).searchParams.getAll('ranges');
    const parts=ranges.map(range=>({range:range+'1000',values:data(range.startsWith("'TONIGHT")?"TONIGHT'S PLAYERS":'PLAYER STATUS DATA',range.endsWith('F')?6:range.endsWith('C')?3:1)}));
    if(options.wrongRange)parts.reverse();if(options.partial)parts.pop();return {valueRanges:parts};
  };
  const sheets={tonight:{name:"TONIGHT'S PLAYERS",getRange:()=>({setValues:rows=>{counts.writes++;status=rows.map(r=>r[0]);if(options.concurrentStatus&&round++===0)stored[1][2]='STANDBY';}})},store:{name:'PLAYER STATUS DATA'}};
  return {c,counts,stored,sheets,status:()=>status};
}
test('Registration display synchronisation preserves output with two batched reads instead of four',()=>{
  const a=syncFixture('baseline'),b=syncFixture('candidate');for(const f of [a,b])f.c.beautyLiveRegistrationSync_(f.sheets,'Åsa One');assert.deepEqual(b.status(),a.status());assert.deepEqual(b.stored,a.stored);assert.equal(a.counts.reads,4);assert.equal(b.counts.reads,2);metrics.displaySync={baseline:a.counts,candidate:b.counts};
});
test('A concurrent status change is freshly reread before display verification succeeds',()=>{for(const variant of ['baseline','candidate']){const f=syncFixture(variant,{concurrentStatus:true});f.c.beautyLiveRegistrationSync_(f.sheets,'Åsa One');assert.equal(f.counts.writes,2);assert.equal(f.status()[1],'STANDBY');}});
test('Missing formula membership remains an error rather than a false success',()=>{for(const variant of ['baseline','candidate']){const f=syncFixture(variant,{missingPlayer:true});assert.throws(()=>f.c.beautyLiveRegistrationSync_(f.sheets,'Åsa One'));assert.equal(f.counts.writes,0);}});
for(const option of ['wrongRange','partial'])test(option+' read cannot cause a display write',()=>{const f=syncFixture('candidate',{[option]:true});assert.throws(()=>f.c.beautyLiveRegistrationSync_(f.sheets,'Åsa One'));assert.equal(f.counts.writes,0);});
test('Provider batch rejects write URLs and another event before any transport',()=>{const f=fixture('candidate');for(const paths of [['tournament/entry/update'],['tournament/get?tdid=other'],['https://example.com'],[]])assert.throws(()=>f.c.beautyLiveRegistrationApiReads_(paths));assert.equal(f.counts.providerRequests,0);});
test('Provider batching rejects HTTP errors, provider errors and incomplete responses',()=>{
  const f=fixture('candidate'),route=['tournament/get?tdid='+target.eventId];
  for(const responses of [[],[{getResponseCode:()=>503,getContentText:()=>''}],[{getResponseCode:()=>200,getContentText:()=>JSON.stringify({result:1})}],[{getResponseCode:()=>200,getContentText:()=>'{invalid'}]]){
    f.c.UrlFetchApp.fetchAll=()=>responses;assert.throws(()=>f.c.beautyLiveRegistrationApiReads_(route));
  }
});
test('An event change before a provider batch prevents transport; a change during it prevents use of the results',()=>{
  const before=fixture('candidate',{contextDrift:true}),route=['tournament/get?tdid='+target.eventId];
  assert.throws(()=>before.c.beautyLiveRegistrationApiReads_(route));assert.equal(before.counts.providerRequests,0);
  const during=fixture('candidate');let assertions=0;during.c.beautyContextAssert_=()=>{if(++assertions===2)throw Error('event changed during read');};
  assert.throws(()=>during.c.beautyLiveRegistrationApiReads_(route));assert.equal(during.counts.providerRequests,1);assert.equal(during.effects.length,0);
});
test('The reused registration roster belongs to one validation only; the next validation reads fresh data',()=>{
  const f=fixture('candidate');f.c.BEAUTY_LIVE_BASE_=target;
  f.c.beautyLiveRegistrationRows_=(sheet,width)=>sheet.getRange(2,1,2,width).getDisplayValues();
  const first=f.c.beautyLiveRegistrationSheets_();assert.deepEqual(plain(first.registrationRoster),[['Bob Two',''],['Åsa One','']]);
  f.values['Form responses 2'][2][1]='';
  const second=f.c.beautyLiveRegistrationSheets_();assert.deepEqual(plain(second.registrationRoster),[['Åsa One',''],['','']]);
  assert.deepEqual(plain(first.registrationRoster),[['Bob Two',''],['Åsa One','']]);
});
test('Standalone events do not query a league',()=>{const f=fixture('candidate');f.c.beautyContextStandalone_=()=>true;const lists=f.c.beautyLiveRegistrationLists_();assert.equal(lists.league.length,0);assert.equal(lists.event.length,2);assert.equal(f.counts.providerRequests,1);});

const result={result:'PASS',checks,metrics,remoteCalls:0,nativeSpeedMeasured:false};
fs.writeFileSync(path.join(root,'evidence/performance-safety.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
