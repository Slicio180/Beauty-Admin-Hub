const {test}=require('node:test');
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('apps-script/registration-identity-test/remote-app/HubEventContext.gs','utf8');
function harness(){
 const props=new Map(),cache=new Map(),calls=[];let seq=0,locked=false;
 const c={Date,JSON,Map,Set,Proxy,encodeURIComponent,decodeURIComponent,beautyHubRequestToken_:'session',
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  LockService:{getScriptLock:()=>({tryLock:()=>{locked=true;return true;},releaseLock:()=>locked=false})},
  Utilities:{getUuid:()=>String(++seq).padStart(32,'0'),formatDate:d=>d.toISOString().slice(0,10)},
  beautyHubTestGuard_:()=>{},beautyHubAuthRequire_:()=>({uid:'owner'}),beautyPoolAuth_:()=> 'auth',
  beautyHubEventDateValid_:v=>/^20\d\d-\d\d-\d\d$/.test(v)&&new Date(v+'T12:00Z').toISOString().slice(0,10)===v,
  beautyHubTransferFetch_:(path,auth,payload)=>{calls.push({path,payload});if(path.startsWith('league/get'))return {league:{lgid:'lg_Club_1234',title:'Club League',admin_id:'owner'}};if(path.startsWith('league/tournament/list'))return {list:[]};return {tournament:{tdid:'t_Open_1234',title:'Open',team_games:0,admin_id:'owner',t_date:Date.parse('2026-11-09T12:00Z')/1000}};}
 };
 vm.createContext(c);vm.runInContext(source,c);
 return {c,props,cache,calls,service:(a,i={})=>c.beautyContextService_(a,i),locked:()=>locked};
}
const context=(extra={})=>({version:1,mode:'tournament',leagueId:'',eventId:'t_Open_1234',date:'2026-11-09',sheetId:'isolated_workbook_1234567890',revision:'a'.repeat(32),title:'Open',...extra});
test('URL-only league input supports portal and ranking links and extracts no client title',()=>{
 const {c}=harness();assert.equal(c.beautyContextUrl_('league','https://n01darts.com/n01/league/portal.php?lgid=lg_Club_1234'),'lg_Club_1234');
 assert.equal(c.beautyContextUrl_('league','https://n01darts.com/n01/league/l_stats.php?id=lg_Club_1234&tab=rank'),'lg_Club_1234');
 assert.equal(c.beautyContextUrl_('league','https://n01darts.com/n01/league/l_stats.html?id=lg_Club_1234&tab=rank'),'lg_Club_1234');
});
test('URL parser rejects other hosts credentials wrong kinds duplicated IDs and injected IDs',()=>{
 const {c}=harness();for(const url of ['https://evil.test/?lgid=lg_Club_1234','https://n01darts.com.evil.test/n01/league/portal.php?lgid=lg_Club_1234','https://user@n01darts.com/n01/league/portal.php?lgid=lg_Club_1234','https://n01darts.com/n01/league/portal.php?lgid=lg_Club_1234&lgid=lg_Other_4444','https://n01darts.com/n01/league/portal.php?lgid=lg_X%26evil','http://n01darts.com/n01/league/portal.php?lgid=lg_Club_1234'])assert.throws(()=>c.beautyContextUrl_('league',url));
 assert.throws(()=>c.beautyContextUrl_('tournament','https://n01darts.com/n01/league/season.php?id=t_Open_1234'));
});
test('Check league is GET-only and Add to Hub persists the provider title once',()=>{
 const h=harness(),checked=h.service('check',{kind:'league',url:'https://n01darts.com/n01/league/portal.php?lgid=lg_Club_1234'});assert.equal(checked.success,true);assert.equal(checked.item.title,'Club League');assert.equal(h.props.size,0);
 const added=h.service('add',{ticket:checked.ticket});assert.equal(added.success,true);assert.equal(h.service('list').connections.filter(x=>x.id==='lg_Club_1234').length,1);assert(h.calls.every(x=>!x.payload));assert.equal(h.locked(),false);assert.equal(h.service('add',{ticket:checked.ticket}).success,false);
});
test('Standalone check rejects an event that belongs to a league',()=>{
 const h=harness();h.c.beautyHubTransferFetch_=()=>({tournament:{tdid:'t_Open_1234',lgid:'lg_Club_1234',title:'League event',admin_id:'owner',team_games:0,t_date:Date.now()/1000}});
 assert.equal(h.service('check',{kind:'tournament',url:'https://n01darts.com/n01/tournament/comp.php?id=t_Open_1234'}).success,false);assert.equal(h.props.size,0);
});
test('Public read access alone cannot connect an event without account administration',()=>{
 const h=harness();h.c.beautyHubTransferFetch_=()=>({league:{lgid:'lg_Club_1234',title:'Public league'}});assert.equal(h.service('check',{kind:'league',url:'https://n01darts.com/n01/league/portal.php?lgid=lg_Club_1234'}).success,false);
});
test('Event checks return all matches rather than silently choosing one',()=>{
 const h=harness(),original=h.c.beautyHubTransferFetch_;h.c.beautyHubTransferFetch_=(path,...args)=>path.startsWith('league/tournament/list')?{list:['t_A_1','t_B_2'].map(tdid=>({tdid,lgid:'lg_Club_1234',title:tdid,t_date:Date.parse('2026-11-09T12:00Z')/1000}))}:original(path,...args);
 assert.equal(h.service('find',{leagueId:'lg_Club_1234',date:'2026-11-09'}).events.length,2);assert.equal(h.props.size,0);
});
test('Incomplete provider list does not become a false no-event result',()=>{
 const h=harness(),original=h.c.beautyHubTransferFetch_;h.c.beautyHubTransferFetch_=(path,...args)=>path.startsWith('league/tournament/list')?{list:Array(1000).fill({})}:original(path,...args);assert.equal(h.service('find',{leagueId:'lg_Club_1234',date:'2026-11-09'}).success,false);
});
test('Same-date event switches invalidate old requests before any mutation',()=>{
 const h=harness();h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context()));h.c.beautyHubWorkspaceId_();h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context({eventId:'t_Second_1234',revision:'b'.repeat(32)})));
 assert.throws(()=>h.c.beautyContextAssert_(),/changed/);assert.throws(()=>h.c.beautyContextBind_({_context:'a'.repeat(32)},true));
});
test('Missing or stale player context is rejected even when the event date is unchanged',()=>{
 const h=harness();h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context()));h.c.beautyHubWorkspaceId_();assert.throws(()=>h.c.beautyContextBind_({eventDate:'2026-11-09'},true));assert.throws(()=>h.c.beautyContextBind_({_context:'b'.repeat(32)},true));assert.equal(h.c.beautyContextBind_({_context:'a'.repeat(32),eventDate:'2026-11-09'},true).eventDate,'2026-11-09');
});
test('Standalone scope uses its event ID and exposes no league ID',()=>{
 const h=harness();h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context()));assert.equal(h.c.beautyHubLeagueId_(),'');assert.equal(h.c.beautyHubScopeId_(),'t_Open_1234');assert.equal(h.c.beautyHubEventScopeId_(),'t_Open_1234');assert.match(h.c.beautyContextEventUrl_('t_Open_1234'),/tournament\/comp/);
});
test('Two league events on the same date retain separate attention namespaces',()=>{
 const h=harness();h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context({mode:'league',leagueId:'lg_Club_1234'})));const first=h.c.beautyHubEventScopeId_();h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context({mode:'league',leagueId:'lg_Club_1234',eventId:'t_B_1234'})));assert.notEqual(first,h.c.beautyHubEventScopeId_());assert.equal(h.c.beautyHubScopeId_(),'lg_Club_1234');
});
test('Activation publishes only after workspace provisioning succeeds and never starts Nakka',()=>{
 const h=harness();h.props.set('BEAUTY_CONNECTIONS_V1',JSON.stringify([{mode:'tournament',id:'t_Open_1234',title:'Open'}]));h.c.beautyContextCreateWorkspace_=()=>{assert(!h.props.has('BEAUTY_EVENT_CONTEXT_V1'));assert(h.locked());return 'isolated_workbook_1234567890';};
 const r=h.service('activate',{mode:'tournament',leagueId:'',eventId:'t_Open_1234',date:'2026-11-09'});assert.equal(r.success,true);assert.equal(r.active.sheetId,'isolated_workbook_1234567890');assert(h.calls.every(c=>!c.payload));assert.equal(h.locked(),false);
});
test('Failed workspace provisioning retains the existing active event',()=>{
 const h=harness();h.props.set('BEAUTY_CONNECTIONS_V1',JSON.stringify([{mode:'tournament',id:'t_Open_1234',title:'Open'}]));h.props.set('BEAUTY_EVENT_CONTEXT_V1',JSON.stringify(context()));const before=h.props.get('BEAUTY_EVENT_CONTEXT_V1');h.c.beautyContextCreateWorkspace_=()=>{throw Error('copy failed');};assert.equal(h.service('activate',{mode:'tournament',leagueId:'',eventId:'t_Open_1234',date:'2026-11-09'}).success,false);assert.equal(h.props.get('BEAUTY_EVENT_CONTEXT_V1'),before);assert.equal(h.locked(),false);
});
test('Existing workspace is reused when returning to an earlier event',()=>{
 const h=harness();h.props.set('BEAUTY_EVENT_WORKBOOK_t_Open_1234','existing_workbook_1234567890');h.c.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getRange:()=>({getValue:()=>new Date('2026-11-09T12:00Z')})})})};assert.equal(h.c.beautyContextCreateWorkspace_(context()),'existing_workbook_1234567890');
});
test('The permanent master list stays shared while event roster sheets are isolated',()=>{
 const h=harness(),base={getSheetByName:name=>({source:'master',name})};h.c.SpreadsheetApp={openById:id=>{assert.equal(id,h.c.beautyHubBaseSheet_());return base;}};
 const event={id:'isolated',getId(){return this.id;},getSheetByName(name){return {source:this.id,name};}};
 const routed=h.c.beautyContextMasterWorkbook_(event);assert.equal(routed.getSheetByName("PLAYER'S MASTER LIST").source,'master');assert.equal(routed.getSheetByName("TONIGHT'S PLAYERS").source,'isolated');assert.equal(routed.getId(),'isolated');
});
function workspaceHarness(migrate){
 const h=harness(),date=new Date('2026-11-09T12:00:00Z');
 h.c.Utilities.parseDate=v=>new Date(v+'T12:00:00Z');
 const formula=JSON.parse(fs.readFileSync('tests/fixtures/tonight-event-formula.json','utf8'));
 const sourceFormula=formula.after;
 function sheet(name,values,formulas=[]){return {name,values:values.map(r=>r.slice()),formulas:formulas.map(r=>r.slice()),getName(){return this.name;},setName(n){this.name=n;return this;},getMaxRows:()=>10,getMaxColumns:()=>6,getDataRange(){return {getValues:()=>this.values,getFormulas:()=>this.formulas};},getRange(row,col,rows=1,cols=1){if(typeof row==='string'){col=row[0].charCodeAt(0)-64;row=Number(row.slice(1));}const sh=this;return {getValue:()=>sh.values[row-1]?.[col-1],getValues:()=>Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>sh.values[row+r-1]?.[col+c-1]??'')),getFormula:()=>sh.formulas[row-1]?.[col-1]||'',setFormula(v){sh.formulas[row-1]??=[];sh.formulas[row-1][col-1]=v;},setValue(v){sh.values[row-1]??=[];sh.values[row-1][col-1]=v;},setValues(v){v.forEach((r,i)=>r.forEach((v,j)=>{sh.values[row+i-1]??=[];sh.values[row+i-1][col+j-1]=v;}));},clearContent(){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){sh.values[row+r-1]??=[];sh.values[row+r-1][col+c-1]='';}}};},copyTo(dest){const copy=sheet(this.name,this.values,this.formulas);dest.sheets.push(copy);return copy;}};}
 const src={sheets:[sheet('Control',[['date'],[date]]),sheet('Form responses 2',[['timestamp','name'],[date,'Anna','','JA','hello','HUB'],[new Date('2026-11-08T12:00Z'),'Previous','','NEJ','','HUB']]),sheet('PLAYER STATUS DATA',[['name','old','status'],['Anna','', 'IN','JA','hello','HUB'],['Corrected','Old','','','','']]),sheet("TONIGHT'S PLAYERS",[['name','old','status'],['Anna','','IN']], [[],[sourceFormula]]),sheet("PLAYER'S MASTER LIST",[['name'],['Anna']])],getSheetByName(n){return this.sheets.find(s=>s.name===n);}};
 const dest={sheets:[],getId:()=> 'created_workbook_1234567890',setSpreadsheetTimeZone(){},setSpreadsheetLocale(){},getSheets(){return this.sheets;},getSheetByName:src.getSheetByName,deleteSheet(){}};
 h.c.SpreadsheetApp={openById:()=>src,create:()=>dest,flush(){}};
 if(migrate)h.props.set('BEAUTY_SELECTED_TEST_EVENTlg_M2wQ_4189',JSON.stringify({id:'t_Open_1234',date:'2026-11-09'}));
 return {...h,dest};
}
test('Reopening the legacy event migrates only its registrations and preserves IN status',()=>{
 const h=workspaceHarness(true);h.c.beautyContextCreateWorkspace_(context());
 assert.equal(h.dest.getSheetByName('Form responses 2').values[1][1],'Anna');assert.equal(h.dest.getSheetByName('Form responses 2').values[2][1],'');
 assert.equal(h.dest.getSheetByName("TONIGHT'S PLAYERS").values[1][2],'IN');assert.equal(h.dest.getSheetByName('PLAYER STATUS DATA').values[1][2],'IN');
 assert.doesNotMatch(h.dest.getSheetByName("TONIGHT'S PLAYERS").formulas[1][0],/A2:A>=Control/);
 assert.equal(h.props.get('BEAUTY_EVENT_WORKBOOK_t_Open_1234'),h.dest.getId());assert(!h.props.has('BEAUTY_EVENT_WORKBOOK_t_Open_1234_PENDING'));
});
test('A different event starts with an empty roster while keeping permanent name corrections',()=>{
 const h=workspaceHarness(false);h.c.beautyContextCreateWorkspace_(context());
 assert.equal(h.dest.getSheetByName('Form responses 2').values[1][1],'');assert.equal(h.dest.getSheetByName("TONIGHT'S PLAYERS").values[1][2],'');
 assert.equal(h.dest.getSheetByName('PLAYER STATUS DATA').values[1][0],'Corrected');assert.equal(h.dest.getSheetByName('PLAYER STATUS DATA').values[1][1],'Old');assert.equal(h.dest.getSheetByName('PLAYER STATUS DATA').values[1][2],'');
});
