const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');let checks=0;
const ok=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function env(){const props={},books={};let creates=0,deny=false;const accesses=[];
 class Sheet{constructor(){this.rows=[];}setName(n){this.name=n;return this;}getRange(row,col,n=1,w=1){if(row==='A1'){row=1;col=1;}return{setValue:v=>{this.rows[row-1]??=[];this.rows[row-1][col-1]=v;},getValue:()=>this.rows[row-1]?.[col-1],setValues:values=>values.forEach((r,i)=>this.rows[row+i-1]=r.slice()),getValues:()=>this.rows.slice(row-1,row-1+n).map(r=>r.slice(col-1,col-1+w))};}getLastRow(){return this.rows.length;}appendRow(row){this.rows.push(row);}}
 const c={Set,Date,JSON,Error,beautyHubTestGuard_:()=>{if(deny)throw Error('AUTH');},beautyHubAuthRequire_:()=>{},beautyHubBaseSheet_:()=> 'MONDAY',beautyContextRead_:()=>({sheetId:'OTHER'}),PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>props[k]=v})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{getUuid:()=> 'id-'+Math.random()},SpreadsheetApp:{flush(){},create:()=>{creates++;const ss={sheets:[new Sheet()],getId:()=> 'AIK',getSheets(){return this.sheets;},getSheetByName(n){return this.sheets.find(s=>s.name===n);},insertSheet(n){const s=new Sheet().setName(n);this.sheets.push(s);return s;}};books.AIK=ss;return ss;},openById:id=>{accesses.push(id);assert.equal(id,'AIK');return books[id];}}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/BeautyAikInternal.js','utf8'),c);
 return {c,props,books,accesses,creates:()=>creates,deny:()=>deny=true,call:(a,i={})=>c.beautyAikInternal(a,i,'token')};}
const e=env();
ok('read does not provision',()=>{assert.equal(e.call('read').configured,false);assert.equal(e.creates(),0);});
ok('setup creates own empty roster and is idempotent',()=>{assert.equal(e.call('setup').players.length,0);e.call('setup');assert.equal(e.creates(),1);});
for(const name of ['Alfa','Beta','Gamma','Delta'])e.call('addPlayer',{name});
ok('normalized duplicate rejected',()=>assert.throws(()=>e.call('addPlayer',{name:'  ALFA  '}),/already/));
ok('spreadsheet formula rejected',()=>assert.throws(()=>e.call('addPlayer',{name:'=IMPORTXML(x)'}),/Invalid/));
const p=e.call('read').players.map(p=>p.id),draft={requestId:'12345678-1234-1234-1234-123456789012',title:'Dubbel-KM',date:'2026-11-15',kind:'km',format:'doubles',entries:[[p[0],p[1]],[p[2],p[3]]],tournamentUrl:'https://n01darts.com/n01/tournament/comp.php?id=t_test_1'};
ok('double pairs save and retry returns one event',()=>{e.call('saveDraft',draft);assert.equal(e.call('saveDraft',draft).events.length,1);});
ok('changed retry rejected',()=>assert.throws(()=>e.call('saveDraft',{...draft,title:'Other'}),/identifier/));
ok('league URL rejected',()=>assert.throws(()=>e.call('saveDraft',{...draft,tournamentUrl:'https://n01darts.com/n01/league/season.php?id=t_test_1'}),/not a league/));
ok('duplicate player across pairs rejected',()=>assert.throws(()=>e.call('saveDraft',{...draft,entries:[[p[0],p[1]],[p[0],p[3]]]}),/repeated/));
ok('incomplete pairs rejected',()=>assert.throws(()=>e.call('saveDraft',{...draft,entries:[[p[0]],[p[1]]]}),/two players/));
ok('unknown player rejected',()=>assert.throws(()=>e.call('saveDraft',{...draft,entries:[[p[0],p[1]],['unknown',p[3]]]}),/Unknown/));
ok('invalid calendar date rejected',()=>assert.throws(()=>e.call('saveDraft',{...draft,date:'2026-02-30'}),/date/));
ok('singles saved from master IDs',()=>{assert.equal(e.call('saveDraft',{...draft,requestId:'22345678-1234-1234-1234-123456789012',format:'singles',entries:p.map(id=>[id])}).events.length,2);});
ok('only own workbook opened',()=>assert.ok(e.accesses.every(id=>id==='AIK')));
ok('uncertain setup never recreates',()=>{const a=env();a.props.BEAUTY_AIK_INTERNAL_TEST_V1=JSON.stringify({status:'CREATING'});assert.throws(()=>a.call('setup'),/incomplete/);assert.equal(a.creates(),0);});
ok('wrong marker blocks writes',()=>{e.books.AIK.getSheetByName('AIK CONFIG').rows[0][0]='WRONG';assert.throws(()=>e.call('addPlayer',{name:'Epsilon'}),/identity/);});
ok('auth rejects before workbook creation',()=>{const a=env();a.deny();assert.throws(()=>a.call('setup'),/AUTH/);assert.equal(a.creates(),0);});
console.log(checks+' checks passed');
