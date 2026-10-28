
// Authorized fixture for existing feature tests; auth itself is tested separately.
const authFixture={beautyHubAuthRequire_:()=>({uid:'fixture'}),beautyHubRequestToken_:'fixture',BeautyHubAuth:{token:()=> 'fixture',generation:()=>0,isCurrent:()=>true,expired(){}}};
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const base='apps-script/registration-identity-test/remote-app/',id='1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',sheetId='1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';
function fixture(o={}) {
 const events=[];let reads=0,writes=0;
 const data={Control:[['START DATE','LAST RESET'],['25/10/2026','24/10/2026 20:23']],
 'PLAYER STATUS DATA':[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','SOURCE'],['Albert','','IN','NEJ','message','HUB'],['Corrected','Old name','IN','JA','keep','MOBIL'],['','','','','','garbage']],
 "TONIGHT'S PLAYERS":[['PLAYERS','NEW PLAYERS','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Albert','','IN','NEJ','message','HUB']],
 "PLAYER'S MASTER LIST":[['PLAYERS'],['Albert']],
 'Form responses 2':[['Timestamp','VÄLJ DITT NAMN','Skriv ditt fullständiga namn','Foto- och videomedgivande','Meddelande','WHERE FROM']]};
 if(o.header)data.Control[0][0]='wrong';
 const sheets=Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,{getLastRow:()=>name==='Form responses 2'?161:o.large&&name==='PLAYER STATUS DATA'?1001:rows.length,getLastColumn:()=>6,getRange:(r,c,h=1,w=1)=>{reads++;return {getDisplayValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>String(rows[r-1+i]?.[c-1+j]??''))),getValues:()=>[[o.badDate?'bad':new Date('2026-10-25T12:00:00Z'),'token']],getFormulas:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>o.formula&&name==='PLAYER STATUS DATA'&&i===1&&j===2?'=SOMETHING()':'')),setValue(){writes++;throw Error('Must not write');},clearContent(){writes++;throw Error('Must not clear');}};}}]));
 if(o.missing)delete sheets.Control;
 const ss={getId:()=>o.wrongSheet?'wrong':sheetId,getName:()=> 'Beauty — Identity Registration TEST — DO NOT USE LIVE.',getSpreadsheetTimeZone:()=>o.zone||'Europe/Berlin',getSpreadsheetLocale:()=> 'en_GB',getSheetByName:n=>sheets[n]};
 const c=vm.createContext({...authFixture,Date,ScriptApp:{getScriptId:()=>o.wrongScript?'wrong':id},LockService:{getScriptLock:()=>({tryLock:()=>{events.push('lock');return !o.busy;},releaseLock:()=>events.push('release')})},SpreadsheetApp:{openById:actual=>{reads++;assert.equal(actual,sheetId);return ss;}},Utilities:{formatDate:d=>d.toISOString().slice(0,10)}});
 vm.runInContext(`const BEAUTY_IDENTITY_APPROVED_SCRIPT_='${id}';const SHEET_ID='${sheetId}';`+fs.readFileSync(base+'HubTestBridge.gs','utf8')+'\n'+fs.readFileSync(base+'HubTestEventPreview.gs','utf8'),c);
 return {events,get reads(){return reads;},get writes(){return writes;},call:i=>c.beautyHubTest('eventload',i)};
}
test('Event inspection wrong project and external input are rejected before reads',()=>{const f=fixture({wrongScript:true});assert.throws(()=>f.call({}),/identity mismatch/);assert.equal(f.reads,0);const ok=fixture();for(const i of [{sheetId:'live'},{date:'2026-10-26'},[]])assert.throws(()=>ok.call(i));assert.equal(ok.reads,0);});
test('Event inspection busy lock does not access sheets',()=>{const f=fixture({busy:true});assert.equal(f.call({}).code,'BUSY');assert.equal(f.reads,0);assert.equal(f.writes,0);});
test('Event inspection reports current control and exact legacy reset counts without writes',()=>{const f=fixture(),r=f.call({});assert.equal(r.success,true);assert.equal(r.inspectionOnly,true);assert.equal(r.writesEnabled,false);assert.equal(r.eventDate,'2026-10-25');assert.equal(r.resetPlan.deleteStatusRows,2);assert.equal(r.resetPlan.retainNameCorrectionRows,1);assert.equal(r.resetPlan.deleteBlankOrGarbageRows,1);assert.equal(r.resetPlan.clearRetainedEventCells,3);assert.equal(r.resetPlan.responseRows,161);assert.equal(r.resetPlan.visiblePlayers,1);assert.equal(r.resetPlan.preserveMasterList,true);assert.equal(f.writes,0);assert.deepEqual(f.events,['lock','release']);});
test('Event inspection flags retained source column behavior for explicit review',()=>{const f=fixture(),r=f.call({});assert.equal(r.resetPlan.retainedSourceRows,1);assert.equal(r.warnings.length,1);assert.match(r.warnings[0],/source column F/);assert.equal(f.writes,0);});
test('Event inspection reports header timezone formula and date blockers without mutation',()=>{for(const o of [{header:true},{zone:'UTC'},{formula:true},{badDate:true}]){const f=fixture(o),r=f.call({});assert.equal(r.success,true);assert.ok(r.blockers.length>0);assert.equal(r.writesEnabled,false);assert.equal(f.writes,0);}});
test('Event inspection handles missing and oversized layouts without suggesting write readiness',()=>{for(const o of [{missing:true},{large:true}]){const f=fixture(o),r=f.call({});assert.equal(r.resetPlan,null);assert.ok(r.blockers.length);assert.equal(r.writesEnabled,false);assert.equal(f.writes,0);}});
test('Event inspection wrong returned identity fails safely and releases lock',()=>{const f=fixture({wrongSheet:true});assert.equal(f.call({}).code,'READ_FAILED');assert.equal(f.writes,0);assert.equal(f.events.at(-1),'release');});
test('Event inspection save action is unsupported at the server boundary',()=>{const f=fixture();assert.throws(()=>f.call({action:'save',confirmed:true,date:'2026-10-26'}));assert.equal(f.reads,0);});
function ui() {
 let resolve;const requests=[],listeners={};
 class El {
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.disabled=false;this.textContent='';this.className='';this.classList={contains:n=>this.className.split(' ').includes(n)};}
  appendChild(e){e.parent=this;this.children.push(e);return e;}setAttribute(){}addEventListener(k,f){this.handlers[k]=f;}remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}focus(){document.activeElement=this;}
 }
 const document={activeElement:null,createElement:t=>new El(t),addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]};document.body=new El('body');const button=new El('button');button.className='event-button';document.querySelectorAll=()=>[button];button.focus();
 const c=vm.createContext({...authFixture,URL,document,BeautyHubServices:{endpoint:'https://beauty.invalid/hub?page=hubdata',request:url=>{requests.push(url);return new Promise(r=>resolve=r);}}});vm.runInContext(fs.readFileSync('public/js/hub-event-date-guard.js','utf8')+'\n'+fs.readFileSync('public/js/hub-test-event-control.js','utf8'),c);
 const walk=e=>[e,...e.children.flatMap(walk)];return {document,button,requests,listeners,find:label=>walk(document.body).find(e=>e.textContent===label),reply:result=>resolve({json:async()=>result})};
}
const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
test('Event popup loads read-only data and date editing plus close cannot save',async()=>{const h=ui();h.button.handlers.click();h.reply({success:true,inspectionOnly:true,writesEnabled:false,eventDate:'2026-10-25',resetPlan:{visiblePlayers:7,responseRows:161,deleteStatusRows:7,retainNameCorrectionRows:2,clearRetainedEventCells:6},blockers:[]});await settle();assert.equal(h.find('CONFIRM DATE CHANGE — NOT ENABLED').disabled,true);assert.equal(new URL(h.requests[0]).searchParams.get('page'),'eventcontrol');h.find('New event date').children[0].value='2026-11-02';assert.equal(h.requests.length,1);h.find('CLOSE').handlers.click();assert.equal(h.document.body.children.length,0);assert.equal(h.requests.length,1);assert.equal(h.document.activeElement,h.button);});
test('Event popup ignores a late response after Escape closes it',async()=>{const h=ui();h.button.handlers.click();h.listeners.keydown({key:'Escape',preventDefault(){}});h.reply({success:true,inspectionOnly:true,writesEnabled:false});await settle();assert.equal(h.document.body.children.length,0);assert.equal(h.requests.length,1);assert.equal(h.document.activeElement,h.button);});
