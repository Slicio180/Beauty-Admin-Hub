const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const files=JSON.parse(fs.readFileSync('live-register/prepared.json')).files;
for(const f of files){if(f.type==='SERVER_JS')new vm.Script(f.source);if(f.type==='HTML')for(const block of f.source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(block[1]);}
let checks=0;function test(name,run){run();checks++;console.log('PASS '+name);}
function scenario(o={}){
 const date=new Date('2026-11-09T12:00:00Z');
 const db={master:[['PLAYERS'],['Anna Example'],['Zoe Example']],store:[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM']],responses:[['Timestamp','Name','New Name','Consent','Message','Source']],tonight:[['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM']],control:[['START DATE'],[date]]};
 if(o.oldStatus)db.store.push(['Anna Example','Former Name',o.oldStatus,'NEJ','before','MOBIL']);
 if(o.duplicateMaster)db.master.push(['anna example']);
 if(o.already)db.tonight.push(['Anna Example','','IN','JA','','MOBIL']);
 if(o.capacity)for(let i=0;i<99;i++)db.tonight.push(['Person '+i]);
 let writes=[],props=new Map(),members=o.noMember?[]:[{name:'Anna Example',lpid:11}],entries=[],formChoices=[],rangeCalls=[];
 if(o.duplicateLeague)members.push({name:'anna example',lpid:12});
 if(o.pending)props.set('BEAUTY_LIVE_REGISTRATION_PENDING','{}');
 const read=(table,r,c,n=1,w=1)=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>db[table][r+i-1]?.[c+j-1]??''));
 function write(table,r,c,values){writes.push(['range',table,r,c]);for(let i=0;i<values.length;i++){db[table][r+i-1]??=[];for(let j=0;j<values[i].length;j++)db[table][r+i-1][c+j-1]=values[i][j];}}
 const sheet=table=>({getLastRow:()=>table==='tonight'?1000:db[table].length,getRange:(r,c,n=1,w=1)=>{
  if(r==='A2'){r=2;c=1;}rangeCalls.push([table,r,c,n,w]);
  return {getValue:()=>date,getDisplayValues:()=>read(table,r,c,n,w),getFormulas:()=>read(table,r,c,n,w).map(row=>row.map(()=>o.formula?'=FORMULA':'')),setValues:v=>write(table,r,c,v)};
 }});
 const names={"PLAYER'S MASTER LIST":'master','PLAYER STATUS DATA':'store',"TONIGHT'S PLAYERS":'tonight','Form responses 2':'responses',Control:'control'};
 const ss={getId:()=> 'sheet',getSheetByName:name=>sheet(names[name])};
 const key=v=>String(v||'').toLowerCase().trim();
 const ctx={Date,console,BEAUTY_LIVE_TARGET_:{sheetId:'sheet',date:'2026-11-09',eventId:'event',leagueId:'league'},beautyLiveLoginGuard_:()=>{},beautyHubAuthRequire_:token=>{if(token!=='approved')throw Error('AUTH');return {uid:'owner'}},LockService:{getScriptLock:()=>({tryLock:()=>!o.busy,releaseLock:()=>{}})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)??null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},SpreadsheetApp:{openById:()=>ss,flush:()=>{}},Utilities:{formatDate:(d,z,format)=>format.includes('HH:mm:ss')?'2026-11-08T00:15:00':o.wrongDate?'2026-11-02':'2026-11-09',sleep:()=>{}},beautyLiveDashboardRead_:()=>({players:db.tonight.slice(1).filter(r=>r[0]).map(r=>{const row=db.store.find(s=>s[0]===r[0])||[];return {player:r[0],status:row[2],consent:row[3],message:row[4],whereFrom:row[5]};})})};
 vm.createContext(ctx);vm.runInContext(files.find(f=>f.name==='LiveRegister').source,ctx);
 ctx.beautyLiveRegistrationEvent_=()=>{if(o.started)throw Error('started');};
 ctx.beautyLiveRegistrationList_=kind=>JSON.parse(JSON.stringify(kind==='league'?members:entries));
 ctx.beautyLiveRegistrationForm_=()=>{if(o.badForm)throw Error('form');return {question:{createChoice:(n,s)=>({name:n,section:s}),setChoices:c=>{writes.push(['form']);formChoices=c;},getChoices:()=>formChoices.map(c=>({getValue:()=>c.name}))},newSection:2,existingSection:3};};
 ctx.beautyLiveRegistrationAppend_=(range,values)=>{
  const table=range.includes('Form responses')?'responses':range.includes('MASTER')?'master':'store';writes.push(['append',table]);db[table].push([...values]);
  if(table==='responses'){
   const name=values[2]||values[1];if(!o.invisible)db.tonight.push([name,'','','','','']);
   if(o.concurrentStatus)db.store.push([name,'','OUT','NEJ','mobile','MOBIL']);
   if(o.appendFailure)throw Error('timeout after append');
  }
 };
 ctx.beautyLiveRegistrationApi_=(path,payload)=>{
  writes.push(['nakka',path,JSON.parse(JSON.stringify(payload))]);
  if(path.startsWith('league'))members.push({name:payload.add[0].name,lpid:99});
  else entries.push({...payload.add[0],tpid:101});
  if(o.hiddenLink)entries.forEach(e=>delete e.lpid);
  if(o.wrongLink)entries.forEach(e=>e.lpid=999);
  if(o.nakkaTimeout)throw Error('timeout after remote commit');return {result:0};
 };
 const input={eventDate:'2026-11-09',selectedName:'Anna Example',newName:'',consent:'JA, JAG GODKÄNNER',message:'Arriving later'};
 return {ctx,db,writes,props,rangeCalls,get members(){return members},get entries(){return entries},get choices(){return formChoices},run:(overrides={},token='approved')=>ctx.beautyLiveRegister_({...input,...overrides},token)};
}
test('existing player: response, status, display and linked Nakka entry',()=>{const x=scenario(),r=x.run();assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(x.db.responses[1][5],'HUB');assert.equal(x.db.store[1][2],'IN');assert.equal(x.db.store[1][3],'JA');assert.equal(x.entries[0].lpid,11);assert.equal(x.props.has('BEAUTY_LIVE_REGISTRATION_PENDING'),false);assert.ok(x.db.responses[1][0]>46000);});
test('new player: Swedish capitalization, master append, backup form and league link',()=>{const x=scenario(),r=x.run({selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'åsa öberg',consent:'NEJ, JAG GODKÄNNER INTE'});assert.equal(r.success,true);assert.equal(r.player,'Åsa Öberg');assert.equal(x.db.master.at(-1)[0],'Åsa Öberg');assert.equal(x.db.store[1][3],'NEJ');assert.equal(x.entries[0].lpid,99);assert.equal(x.choices.at(-1).name,'MITT NAMN FINNS INTE I LISTAN');assert.equal(x.db.responses[1][2],'Åsa Öberg');});
for(const status of ['OUT','STANDBY'])test('preserves '+status+' and OLD NAME',()=>{const x=scenario({oldStatus:status});assert.equal(x.run().success,true);assert.equal(x.db.store[1][2],status);assert.equal(x.db.store[1][1],'Former Name');});
for(const [options,code] of [[{wrongDate:true},'REGISTRATION_CHECK_FAILED'],[{formula:true},'REGISTRATION_CHECK_FAILED'],[{started:true},'REGISTRATION_CHECK_FAILED'],[{duplicateMaster:true},'AMBIGUOUS_NAME'],[{duplicateLeague:true},'AMBIGUOUS_NAME'],[{pending:true},'REGISTRATION_REVIEW_REQUIRED'],[{busy:true},'BUSY'],[{capacity:true},'REGISTRATION_CHECK_FAILED']])test('no writes: '+JSON.stringify(options),()=>{const x=scenario(options);assert.equal(x.run().code,code);assert.equal(x.writes.length,0);});
test('authentication before service calls',()=>{const x=scenario();assert.throws(()=>x.run({},'wrong'),/AUTH/);assert.equal(x.rangeCalls.length,0);assert.equal(x.writes.length,0);});
for(const input of [{consent:''},{message:'=IMPORTDATA("url")'},{source:'MOBILE'},{eventDate:'2026-11-16'}])test('rejects invalid or injected fields '+JSON.stringify(input),()=>{const x=scenario();assert.equal(x.run(input).success,false);assert.equal(x.writes.length,0);});
test('new-name duplicate offers existing identity without writing',()=>{const x=scenario(),r=x.run({selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'anna example'});assert.equal(r.code,'NAME_CONFLICT');assert.equal(x.writes.length,0);assert.equal(x.run({selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'anna example',identityChoice:'existing',identityBase:'Anna Example'}).success,true);assert.equal(x.db.master.length,3);});
test('already registered cannot append twice',()=>{const x=scenario();assert.equal(x.run().success,true);assert.equal(x.run().code,'NAME_CONFLICT');assert.equal(x.run({identityChoice:'existing',identityBase:'Anna Example'}).code,'ALREADY_REGISTERED');assert.equal(x.db.responses.length,2);});
test('different person requires confirmed disambiguated name',()=>{const x=scenario({already:true}),input={identityChoice:'different',identityBase:'Anna Example',identityDetail:'AIK',identityConfirmedName:'Anna Example (AIK)'};assert.equal(x.run(input).success,true);assert.equal(x.db.master.at(-1)[0],'Anna Example (AIK)');});
for(const options of [{appendFailure:true},{nakkaTimeout:true},{concurrentStatus:true},{invisible:true}])test('uncertain write blocks retry '+JSON.stringify(options),()=>{const x=scenario(options);assert.equal(x.run().code,'REGISTRATION_UNCERTAIN');assert.ok(x.props.has('BEAUTY_LIVE_REGISTRATION_PENDING'));const n=x.writes.length;assert.equal(x.run().code,'REGISTRATION_REVIEW_REQUIRED');assert.equal(x.writes.length,n);if(options.concurrentStatus)assert.equal(x.db.store[1][2],'OUT');});
test('hidden league link reports entry only without claiming link verification',()=>{const x=scenario({hiddenLink:true}),r=x.run();assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(r.nakka.leagueLinkVerified,false);});
test('conflicting league link leaves pending receipt',()=>{const x=scenario({wrongLink:true});assert.equal(x.run().code,'REGISTRATION_UNCERTAIN');assert.ok(x.props.has('BEAUTY_LIVE_REGISTRATION_PENDING'));});
test('no master clearing or Tonight formula writes',()=>{const x=scenario();x.run({selectedName:'MITT NAMN FINNS INTE I LISTAN',newName:'New Person'});assert.ok(x.writes.filter(w=>w[0]==='range'&&w[1]==='tonight').every(w=>w[3]===3));assert.ok(!x.writes.some(w=>w[0]==='range'&&w[1]==='master'));});
console.log(JSON.stringify({result:'PASS',cases:checks,services:'mocked',nativeRegistrationVerified:false,allSourceSyntax:true}));
