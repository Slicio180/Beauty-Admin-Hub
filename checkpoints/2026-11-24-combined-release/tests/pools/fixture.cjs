const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const candidate=path.resolve(__dirname,'../../application');
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(n=6){
 const p={},calls=[],faults=[];let uuid=0,account={uid:'test-owner',sessionBinding:'session-one'};
 const context={version:1,mode:'league',sheetId:'test-workbook',revision:'a'.repeat(32),date:'2026-11-21',eventId:'t_test_fixture',leagueId:'lg_test_fixture',title:'Local isolated fixture'};
 const data={success:true,eventDate:context.date,players:Array.from({length:n},(_,i)=>({player:'Synthetic Pool '+(i+1),status:'IN'}))};
 const profiles=data.players.map((p,i)=>({lpid:'L'+String(i).padStart(3,'0'),name:p.player,average:40+i,reason:'',points:i}));
 const event={tdid:context.eventId,lgid:context.leagueId,title:context.title,status:20,updateTime:1,t_date:Date.parse('2026-11-21T12:00:00Z')/1000,league:1,team_games:0,
  rr_setting:{round_robin:1,match_type:'01',limit:1,limit_leg_count:3},lg_setting:{league:0},entry_list:profiles.map((p,i)=>({tpid:'T'+String(i).padStart(3,'0'),lpid:p.lpid,name:p.name})),rr_table:[]};
 const c={console,PropertiesService:{getScriptProperties:()=>({
  getProperty:k=>p[k]??null,setProperty:(k,v)=>{const hit=faults.findIndex(f=>f(k,v));if(hit>=0){faults.splice(hit,1);throw Error('Injected storage failure');}p[k]=v;},deleteProperty:k=>delete p[k]
 })},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},CacheService:{getScriptCache:()=>({})},Utilities:{getUuid:()=> (++uuid).toString(16).padStart(32,'0'),formatDate:d=>d.toISOString().slice(0,10)},SHEET_ID:context.sheetId,beautyHubRequestToken_:'local-test-token',BEAUTY_IDENTITY_WRITES_ENABLED_:true};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(candidate,'LivePlanner.gs'),'utf8'),c);
 Object.assign(c,{
  beautyHubTestGuard_(){},beautyHubAuthRequire_:()=>clone(account),beautyHubNakkaEvent_:()=>({status:'MATCHED'}),beautyHubActiveTestTarget_:()=>({id:context.eventId,title:context.title}),
  beautyHubNakkaDate_:()=>({date:context.date}),beautyHubLeagueId_:()=>context.leagueId,beautyLiveContextRead_:()=>clone(context),beautyLiveTarget_:()=>clone(context),beautyContextStandalone_:()=>false,
  beautyHubTransferHash_:v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex'),getBeautyHubData_:()=>clone(data),beautyPoolAuth_:()=> 'Local fixture auth',
  beautyPoolStats_:()=>({fresh:true,leagueId:context.leagueId,fetchedAt:new Date().toISOString(),profiles:clone(profiles),identityProfiles:clone(profiles)}),
  beautyHubTransferEntries_:v=>clone(v.list),
  beautyHubTransferFetch_:(url,auth,body)=>{calls.push({url,write:!!body});if(body)throw Error('Unexpected provider write');if(url.startsWith('tournament/get?'))return {tournament:clone(event)};if(url.startsWith('league/entry/list?'))return {list:profiles.map(({lpid,name})=>({lpid,name}))};throw Error('Unexpected GET '+url);}
 });
 const key=()=> 'BEAUTY_POOL_DRAFT_'+c.beautyPoolHash_([context.eventId,account.uid]);
 const pointer=()=>JSON.parse(p[key()]||'null');
 const saved=()=>{const ptr=pointer();return JSON.parse(Array.from({length:ptr.n},(_,i)=>p[key()+'_'+ptr.ticket+'_'+i]).join(''));};
 const overwrite=r=>{const ptr=pointer(),text=JSON.stringify(r),count=Math.ceil(text.length/1800);for(let i=0;i<count;i++)p[key()+'_'+ptr.ticket+'_'+i]=text.slice(i*1800,(i+1)*1800);p[key()]=JSON.stringify({...ptr,n:count,hash:c.beautyPoolHash_(text)});};
 const run=(action,input)=>clone(c.beautyHubPool_(action,clone(input)));
 const load=()=>run('poolload',{refresh:'false'});
 const draw=()=>{const state=load();if(!state.success)throw Error(state.error);return run('pooldraw',{bindings:JSON.stringify(state.mappings.map(({id,lpid,tpid})=>({id,lpid,tpid}))),reviewed:'true',sizes:JSON.stringify(n===3?[3]:n===4?[4]:[3,3]),draftTicket:state.draftTicket,choices:JSON.stringify({boards:'5, 6',plannedBoards:[5,6],preferredSize:3,scheme:'preferredPlan',format:'preserve',boardChoices:{},cardLabels:{}})});};
 return {c,p,calls,faults,context,data,event,profiles,run,load,draw,key,pointer,saved,overwrite,account:value=>{if(value)account=value;return clone(account);}};
}
module.exports={fixture,candidate,clone};
