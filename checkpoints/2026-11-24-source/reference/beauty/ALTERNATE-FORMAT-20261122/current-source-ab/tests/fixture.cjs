const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const work=path.resolve(__dirname,'../..');
const sourceFiles={server:path.join(work,'case-c/roster-rejection-fix/installed-readback/HubTestPools.gs'),html:path.join(work,'case-c/responsive/installed-readback/HubTest.html')};
const hashes={server:'3f41286018feec8747b9d516d36d8fb22e81410367ba666ac756d699ca26c465',html:'844585c07a85da1d7c2c3d0bc0fda39d45d9dd8cc562d6b6963b948fb4bccaa1'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [k,f]of Object.entries(sourceFiles))assert.equal(sha(fs.readFileSync(f)),hashes[k],k+' saved readback identity');
const source=fs.readFileSync(sourceFiles.server,'utf8'),html=fs.readFileSync(sourceFiles.html,'utf8');
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(kind){
 const backupPath=path.join(work,kind==='A'?'case-b/evidence/case-a-durable-backup.json':'case-c/evidence/case-b-durable-backup.json');
 const expectedPath=path.join(work,kind==='A'?'CASE-A-EXPECTED.json':'case-b/CASE-B-EXPECTED.json');
 const backup=JSON.parse(fs.readFileSync(backupPath)),expected=JSON.parse(fs.readFileSync(expectedPath));
 const p={},calls=[],actions=[];let serial=100,account={uid:'local-test-owner',sessionBinding:'session-one'},outage=false;
 const clock=Date.parse(backup.draw.frozenAt)+60000;
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 const context={version:1,mode:'league',sheetId:expected.eventMasterWorkbook,leagueId:'lg_M2wQ_4189',eventId:expected.eventId,date:expected.date,title:'Beauty TEST Alternate Formats 2026-11-22',revision:expected.contextRevision};
 const names=backup.draw.roster.map(p=>p.name).sort();
 const data={success:true,eventDate:context.date,players:names.map(player=>({player,status:'IN'}))};
 const profiles=names.map((name,i)=>({lpid:'L'+String(i).padStart(3,'0'),name,average:null,reason:'No recorded darts',points:0}));
 const rules={limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01'};
 const event={tdid:context.eventId,lgid:context.leagueId,title:context.title,status:20,private:1,entry_lock:1,updateTime:1,t_date:Date.parse(context.date+'T12:00:00Z')/1000,league:1,team_games:0,
  rr_setting:{round_robin:1,robin_count:2,robin_player_count:3,point_w:2,point_d:1,point_l:0,...rules},lg_setting:{league:0},rr_table:[['','',''],['','','']],
  t_setting:{tournament:1,t_player_count:4,t3:0,...rules},s2_setting:kind==='B'?{tournament:1,t_player_count:2,t3:0,...rules}:{tournament:0},
  entry_list:profiles.map((p,i)=>({tpid:'T'+String(i).padStart(3,'0'),name:p.name}))};
 const stats={fresh:true,leagueId:context.leagueId,fetchedAt:backup.draw.source.fetchedAt,profiles,identityProfiles:profiles};
 const c={console,Date:ClockDate,PropertiesService:{getScriptProperties:()=>({getProperty:k=>p[k]??null,setProperty:(k,v)=>{p[k]=v;},deleteProperty:k=>delete p[k]})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},CacheService:{getScriptCache:()=>({})},
  Utilities:{getUuid:()=> (++serial).toString(16).padStart(32,'0'),formatDate:d=>d.toISOString().slice(0,10)},
  SHEET_ID:context.sheetId,beautyHubRequestToken_:'LOCAL_ONLY_TOKEN',BEAUTY_IDENTITY_WRITES_ENABLED_:true};
 vm.createContext(c);vm.runInContext(source,c,{filename:sourceFiles.server});
 Object.assign(c,{beautyHubTestGuard_(){},beautyHubAuthRequire_:()=>clone(account),beautyHubNakkaEvent_:()=>({status:'MATCHED'}),beautyHubActiveTestTarget_:()=>({id:context.eventId,title:context.title}),
  beautyHubNakkaDate_:()=>({date:context.date}),beautyHubLeagueId_:()=>context.leagueId,beautyContextRead_:()=>clone(context),beautyContextStandalone_:()=>false,
  beautyHubTransferHash_:v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('base64url'),getBeautyHubData_:()=>clone(data),beautyPoolAuth_:()=> 'LOCAL_ONLY_AUTH',
  beautyPoolStats_:()=>{if(outage)throw Error('Simulated provider outage');return clone(stats);},beautyHubTransferEntries_:v=>clone(v.list),
  beautyHubTransferFetch_:(url,auth,body)=>{calls.push({url,write:body!==undefined});if(body!==undefined)throw Error('Unexpected simulated provider write');if(outage)throw Error('Simulated provider outage');if(url.startsWith('tournament/get?'))return {tournament:clone(event)};if(url.startsWith('league/entry/list?'))return {list:profiles.map(({lpid,name})=>({lpid,name}))};throw Error('Unexpected simulated GET '+url);}});
 const key=()=> 'BEAUTY_POOL_DRAFT_'+c.beautyPoolHash_([context.eventId,account.uid]);
 const pointer=()=>JSON.parse(p[key()]||'null');
 const saved=()=>{const ptr=pointer();return JSON.parse(Array.from({length:ptr.n},(_,i)=>p[key()+'_'+ptr.ticket+'_'+i]).join(''));};
 const seedRecord=record=>{const text=JSON.stringify(record),ticket='a'.repeat(32),n=Math.ceil(text.length/1800);for(let i=0;i<n;i++)p[key()+'_'+ticket+'_'+i]=text.slice(i*1800,(i+1)*1800);p[key()]=JSON.stringify({ticket,n,hash:c.beautyPoolHash_(text)});};
 const roster=c.beautyPoolRoster_(),mappings=c.beautyPoolMappings_(roster,stats,event.entry_list,null);
 assert.deepEqual(clone(roster.rows).map(p=>p.id).sort(),backup.draw.roster.map(p=>p.id).sort(),'fixture reproduces recorded player IDs');
 seedRecord({schema:2,context,uid:account.uid,session:c.beautyPoolHash_(account.sessionBinding),target:context.eventId,
  draw:backup.draw,draftChoices:backup.choices,drawSettings:{preferredSize:3,scheme:'preferredPlan'},mappings:mappings.map(({id,name,lpid,tpid,linkExposed})=>({id,name,lpid,tpid,linkExposed})),
  rosterSignature:roster.signature,date:roster.date,eventHash:c.beautyPoolHash_(event),statsHash:c.beautyPoolHash_(profiles),ready:true,version:'expired-local-approval',formatMode:'top2-rest',boardPlan:{old:true}});
 const run=(action,input)=>{actions.push(action);return clone(c.beautyHubPool_(action,clone(input)));};
 const load=()=>run('poolload',{refresh:'false'});
 const boardInput=()=>({available:[1,2,3],choices:[{poolId:0,boards:[2]},{poolId:1,boards:[2]}]});
 return {kind,c,p,calls,actions,context,data,event,profiles,stats,backup,expected,backupPath,expectedPath,run,load,saved,pointer,key,boardInput,
  account:value=>{if(value)account=value;return clone(account);},outage:value=>{outage=value;}};
}

// A small DOM double for functional rendering assertions only, never geometry/device acceptance.
class Node{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.events={};this.className='';this.value='';this.checked=false;this.disabled=false;this._text='';}
 get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 set textContent(v){this._text=v==null?'':String(v);this.children=[];}
 appendChild(child){if(child.parentElement){const i=child.parentElement.children.indexOf(child);if(i>=0)child.parentElement.children.splice(i,1);}this.children.push(child);child.parentElement=this;return child;}
 replaceChildren(...children){this.children=[];this._text='';children.forEach(c=>this.appendChild(c));}
 setAttribute(k,v){this.attributes[k]=String(v);}
 addEventListener(k,fn){this.events[k]=fn;}
 matches(selector){if(selector.startsWith('.'))return this.className.split(' ').includes(selector.slice(1));if(selector.startsWith('[data-')){const key=selector.slice(6,-1).replace(/-([a-z])/g,(_,x)=>x.toUpperCase());return Object.hasOwn(this.dataset,key);}return this.tagName===selector;}
 querySelectorAll(selector){const selectors=selector.split(',');return this.children.flatMap(n=>[...(selectors.some(s=>n.matches(s))?[n]:[]),...n.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
function uiFixture(f){
 const ui=html.slice(html.indexOf('/* Identity TEST seeded Pool Planner.'));
 function fragment(start,end){const a=ui.indexOf(start),b=ui.indexOf(end,a);assert(a>=0&&b>a);return ui.slice(a,b);}
 const panel=new Node('section'),controls={};
 for(const name of ['boards','size','draw-scheme','pool-draw','saved-plan-settings','draw-utilities','fresh']){const n=new Node(name==='boards'||name==='size'?'input':'div');n.dataset[name.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]='';panel.appendChild(n);controls[name]=n;}
 controls.boards.value='9';controls.size.value='4';controls['draw-scheme'].value='perBoard';panel.open=true;
 const messages=[],calls=[],timers=new Map();let timer=0,generation=1;
 const el=(tag,text,parent)=>{const n=new Node(tag);if(text!==null&&text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n;};
 const section=(tag,cls,parent)=>{const n=el(tag,null,parent);n.className=cls;return n;};
 const button=(text,parent,fn)=>{const n=el('button',text,parent);n.addEventListener('click',fn);return n;};
 const c={console,JSON,Error,Number,String,Set,Math,Promise,Event:function(t){this.type=t;},root:{BeautyPoolBoards:f.c.BeautyPoolBoards,beautyHubData:{...f.data,eventContext:f.context.revision},
  setTimeout(fn){timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id)},
  BeautyHubAuth:{generation:()=>generation,isCurrent:n=>n===generation},BeautyPoolSeeding:f.c.BeautyPoolSeeding,
  document:{createTextNode:t=>el('#text',t)},host:panel,panel,el,section,button,numeric:el,averageLabel:n=>String(n),
  state:null,frozen:null,workflow:null,approval:{old:true},startReview:{old:true},busy:false,epoch:0,jobSerial:0,sourceLoadFailed:false,invalid:false,invalidReason:'',lastRoster:'',hubAvailable:true,
  plannedBoards:null,boardChoices:{},cardLabels:{},swapped:[],pendingChoices:null,choicesTimer:null,lastSavedChoices:'',
  fingerprint:d=>JSON.stringify(d),message:t=>messages.push(t),steps(){},renderSource(){},renderSettings(){},renderBoardChoices(){},renderMatchPlan(){},renderGameSettings(){},queueNote(){},
  selectedBoards:()=>[1,2,3],selectedBoardsSafe:()=>[1,2,3],seedBoardChoices(){},boardInput:()=>f.boardInput(),
  request:async(action,input)=>{calls.push(action);const r=f.run(action,input);if(!r.success){const e=Error(r.error);if(r.code==='POOL_DRAFT_REPLACED'||r.code==='POOL_DRAFT_ROSTER_CHANGED'&&r.uncertain===false)e.code=r.code;throw e;}return r;}};
 vm.createContext(c);
 vm.runInContext(fragment(' function clearChoices(){',' function settingsChanged(')+fragment(' async function run(job){',' function bindings(')+fragment(' function renderDraw(){',' // Native single-elimination overrides:')+fragment(' async function load(send,refresh){',' function mount(dialog){'),c);
 const load=()=>c.run(send=>c.load(send,false));
 const review=()=>c.run(async send=>{c.approval=await send('poolprepare',{ticket:c.frozen.ticket,format:'top2-rest',boardPlan:JSON.stringify(f.boardInput())});c.frozen.ticket=c.approval.ticket;c.renderDraw();});
 return {c,panel,controls,calls,messages,load,review,rotate:()=>generation++};
}
module.exports={fixture,uiFixture,sourceFiles,hashes,sha,clone,work};
