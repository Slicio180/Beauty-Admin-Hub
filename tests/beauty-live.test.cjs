
// Authorized fixture for existing feature tests; auth itself is tested separately.
const authFixture={beautyHubActiveTestTarget_:()=>({id:'t_QHaG_7792',title:'Beauty Registration TEST event DO NOT USE LIVE'}),beautyHubCastHtml_:file=>({file,setTitle(){return this;}}),beautyHubAuthRequire_:()=>({uid:'fixture'}),beautyHubRequestToken_:'fixture',BeautyHubAuth:{token:()=> 'fixture',generation:()=>0,isCurrent:()=>true,expired(){}}};
process.chdir(require('node:path').resolve(__dirname,'..'));
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const model=require('../public/js/beauty-live-model.js'),base='apps-script/registration-identity-test/remote-app/';
const feed=players=>({success:true,players});
test('Live Swedish order strips private fields without mutating input',()=>{const input=feed([{name:'Östen',message:'PRIVATE',status:'OUT'},{name:'Åsa'},{name:'Adam'},{name:'Ägir'}]);const out=model.project(input,'alphabetical');assert.deepEqual(out.map(p=>p.name),['Adam','Åsa','Ägir','Östen']);assert.deepEqual(Object.keys(out[0]),['name','registeredAt','rank','points','average']);assert.equal(input.players[0].name,'Östen');});
test('Live timestamps sort earliest first with missing values last',()=>{assert.deepEqual(model.project(feed([{name:'C'},{name:'B',registeredAt:2},{name:'A',registeredAt:1}]),'registration').map(p=>p.name),['A','B','C']);});
test('Live ranking projection places unranked last and preserves zero points',()=>{const out=model.project(feed([{name:'C',rank:0},{name:'B',rank:2,points:25},{name:'A',rank:1,points:0}]),'ranking');assert.deepEqual(out.map(p=>p.name),['A','B','C']);assert.equal(out[0].points,0);});
function server(blocked=false){let reads=0;const rows=[[new Date('2026-10-25T12:00:00Z'),'Adam',''],[new Date('2026-10-25T11:00:00Z'),'Adam',''],[new Date('2026-10-24T12:00:00Z'),'Adam',''],[new Date('2026-10-25T13:00:00Z'),'MITT NAMN FINNS INTE I LISTAN','Bea']];const c=vm.createContext({...authFixture,Date,beautyHubTestGuard_:()=>{if(blocked)throw Error('blocked');},getBeautyHubData_:()=>({success:true,eventDate:'2026-10-25',masterPlayers:['PRIVATE'],players:[{player:'Adam',consent:'NO',message:'PRIVATE',status:'OUT'},{newPlayer:'Bea'},{player:'Unknown'}]}),SHEET_ID:'TEST',SpreadsheetApp:{openById:id=>{reads++;assert.equal(id,'TEST');return {getSheetByName:n=>{assert.equal(n,'Form responses 2');return {getLastRow:()=>rows.length+1,getRange:(...a)=>{assert.deepEqual(a,[2,1,rows.length,3]);return {getValues:()=>rows};}};}};}},Utilities:{formatDate:d=>d.toISOString().slice(0,10)},Session:{getScriptTimeZone:()=>'Europe/Stockholm'},ScriptApp:{getService:()=>({getUrl:()=> 'https://script.google.com/test/dev'})}});vm.runInContext(fs.readFileSync(base+'BeautyLiveTest.gs','utf8'),c);return {c,reads:()=>reads};}
test('Live feed exposes only public fields and earliest same-event registration',()=>{const s=server(),out=JSON.parse(JSON.stringify(s.c.beautyLiveTestData()));assert.equal(out.rankingAvailable,false);assert.equal(out.players[0].registeredAt,new Date('2026-10-25T11:00:00Z').getTime());assert.equal(out.players[1].name,'Bea');assert.equal(out.players[2].registeredAt,null);assert.doesNotMatch(JSON.stringify(out),/PRIVATE|consent|message|status|masterPlayers/);});
test('Live guard rejects feed and URL before service access',()=>{const s=server(true);assert.throws(()=>s.c.beautyLiveTestData(),/blocked/);assert.throws(()=>s.c.beautyLiveTestUrl(),/blocked/);assert.equal(s.reads(),0);});
test('Live build reproduces and scripts parse with original AIK fonts',()=>{const file=base+'BeautyLiveTest.html',before=fs.readFileSync(file,'utf8');cp.execFileSync(process.execPath,['scripts/build-beauty-live.cjs']);assert.equal(fs.readFileSync(file,'utf8'),before);for(const m of before.matchAll(/<script>\n([\s\S]*?)<\/script>/g))new vm.Script(m[1]);assert.match(before,/lang="sv"/);assert.match(before,/KVÄLLENS SPELARE/);assert.match(before,/#ffd700/);assert.match(before,/data:font\/woff2;base64/);});
function client(width=1440){const nodes={};function node(){return {classList:{add(){},remove(){}},setAttribute(){},querySelectorAll(){return [];},style:{setProperty(k,v){this[k]=v;}},scrollTop:0,scrollHeight:1000,clientHeight:500,textContent:'',dataset:{},children:[],value:'alphabetical',checked:false,disabled:false,events:{},replaceChildren(){this.children=[];},append(n){this.children.push(n);},addEventListener(e,fn){this.events[e]=fn;}};}for(const id of ['liveScroll','liveNames','liveCount','liveStatus','liveSort','liveStats','livePage','rankingOrder','liveFullscreen','liveColumns','liveSettings','liveSettingsOpen','liveSettingsClose','liveStatsSource','liveStatsState'])nodes[id]=node();const timeouts=[],intervals=[];let success,failure;const runner={withSuccessHandler(fn){success=fn;return this;},withFailureHandler(fn){failure=fn;return this;},beautyLiveTestData(){}};const c=vm.createContext({...authFixture,Date,Intl,innerHeight:900,innerWidth:width,document:{getElementById:id=>nodes[id],createElement:node},window:{addEventListener(){}},setTimeout:(fn,ms)=>{timeouts.push({fn,ms});return timeouts.length;},clearTimeout(){},setInterval:(fn,ms)=>intervals.push({fn,ms}),google:{script:{run:runner}}});vm.runInContext(fs.readFileSync('public/js/beauty-live-model.js','utf8')+'\n'+fs.readFileSync('public/js/beauty-live.js','utf8'),c);return {nodes,timeouts,intervals,ok:d=>success(d),fail:()=>failure()};}
test('Live refresh updates count safely and retains names on connection failure',()=>{const c=client();c.ok(feed([{name:'<img onerror=bad>'}]));assert.equal(c.nodes.liveCount.textContent,'1');assert.equal(c.nodes.liveNames.children[0].children[0].children[1].textContent,'<img onerror=bad>');assert.equal(c.nodes.liveStats.disabled,true);assert.equal(c.timeouts.at(-1).ms,15000);c.timeouts.at(-1).fn();c.ok(feed([{name:'A'},{name:'B'}]));assert.equal(c.nodes.liveCount.textContent,'2');c.timeouts.at(-1).fn();c.fail();assert.equal(c.nodes.liveCount.textContent,'2');assert.equal(c.nodes.liveStatus.dataset.state,'error');});
test('Live thirty-player pages rotate with stable numbering and retain page on unchanged refresh',()=>{
 const c=client(),data=feed(Array.from({length:65},(_,i)=>({name:'Player '+String(i).padStart(3,'0')})));
 c.ok(data);assert.equal(c.nodes.liveNames.children.length,30);assert.match(c.nodes.livePage.textContent,/Sida 1 \/ 3/);
 c.intervals[0].fn();assert.equal(c.nodes.liveNames.children[0].children[0].children[0].textContent,'31');assert.match(c.nodes.livePage.textContent,/31–60/);
 c.timeouts.at(-1).fn();c.ok(data);assert.match(c.nodes.livePage.textContent,/Sida 2/);
 c.intervals[0].fn();assert.equal(c.nodes.liveNames.children.length,5);assert.match(c.nodes.livePage.textContent,/61–65/);
 c.intervals[0].fn();assert.match(c.nodes.livePage.textContent,/Sida 1/);
});
test('Live empty and single page do not rotate or scroll',()=>{
 const c=client();c.ok(feed([]));assert.match(c.nodes.liveNames.children[0].textContent,/Inga spelare/);
 c.timeouts.at(-1).fn();c.ok(feed([{name:'Adam'}]));c.intervals[0].fn();assert.match(c.nodes.livePage.textContent,/Sida 1 \/ 1/);assert.equal(c.nodes.liveScroll.scrollTop,0);
});

test('Live route is additive guarded TEST HTML and rejects configuration injection',()=>{const route=fs.readFileSync(base+'Code.js','utf8').split('/* CANDIDATE')[0];let guard=0;const c=vm.createContext({...authFixture,BEAUTY_IDENTITY_APPROVED_SCRIPT_:'TEST',ScriptApp:{getScriptId:()=> 'TEST'},beautyHubTestGuard_:()=>guard++,HtmlService:{createHtmlOutputFromFile:file=>({file,addMetaTag(){return this;},setTitle(){return this;}})}});vm.runInContext(route,c);assert.equal(c.doGet({parameter:{page:'live'}}).file,'BeautyLiveTest');assert.equal(guard,1);assert.equal(c.doGet({parameter:{page:'hub'}}).file,'HubTest');assert.equal(c.doGet({parameter:{}}).file,'RemoteRegistration');assert.throws(()=>c.doGet({parameter:{page:'live',sheet:'other'}}));});

test('Live thirty-player slot boundaries fit wide and narrow screens without duplicates',()=>{
 for(const width of [1440,390])for(const n of [1,15,16,30,31,60,65,90]){
  const c=client(width);c.ok(feed(Array.from({length:n},(_,i)=>({name:'Player '+String(i).padStart(3,'0')}))));
  const cols=width<700?2:3,rows=width<700?15:10;assert.equal(Number(c.nodes.liveNames.style['--live-columns']),cols);
  assert.equal(c.nodes.liveNames.children.length,Math.min(n,30));
  const slots=new Set(c.nodes.liveNames.children.map(item=>item.style.gridColumn+':'+item.style.gridRow));assert.equal(slots.size,Math.min(n,30));
  c.nodes.liveNames.children.forEach((item,i)=>{assert.equal(item.children[0].children[0].textContent,String(i+1));assert.ok(Number(item.style.gridColumn)<=cols);assert.ok(Number(item.style.gridRow)<=rows);});
 }
});
test('Live real ranking values and ties survive paging; statistics respect the selected sorting mode',()=>{
 const c=client();c.ok({success:true,rankingAvailable:true,statsAvailable:true,players:[{name:'Z',rank:7,points:0,average:0},{name:'A',rank:2,points:40,average:54.123},{name:'B',rank:2,points:40},{name:'C'}]});
 c.nodes.liveStats.checked=true;c.nodes.liveSort.value='ranking';c.nodes.liveStats.events.change();
 assert.equal(c.nodes.liveNames.children[0].children[0].children[0].textContent,'2');assert.equal(c.nodes.liveNames.children[1].children[0].children[0].textContent,'2');
 assert.equal(c.nodes.liveNames.children[2].children[0].children[0].textContent,'7');assert.equal(c.nodes.liveNames.children[2].children[1].textContent,'0.00');assert.equal(c.nodes.liveNames.children[2].children.length,2);
 assert.equal(c.nodes.liveNames.children[3].children[0].children[0].textContent,'—');
});
test('Live cached statistics label stale or failed snapshots and reject old or ambiguous data',()=>{
 const s=server();const now=new Date().toISOString();
 s.c.beautyPoolKey_=v=>v.toLowerCase();s.c.PropertiesService={getScriptProperties:()=>({getProperty:()=>null})};
 let snapshot={leagueId:'lg_tM2v_3523',fetchedAt:now,profiles:[{name:'Adam',average:40.83,points:25,secret:'PRIVATE'}]};
 s.c.beautyPoolLastGood_=()=>snapshot;
 let out=JSON.parse(JSON.stringify(s.c.beautyLiveTestData()));assert.equal(out.statsAvailable,true);assert.equal(out.rankingAvailable,false);assert.equal(out.players[0].average,40.83);assert.equal(out.players[0].points,25);assert.doesNotMatch(JSON.stringify(out),/PRIVATE/);
 snapshot.profiles.push({name:'Adam',average:60,points:50});out=s.c.beautyLiveTestData();assert.equal(out.players[0].average,null);
 snapshot.fetchedAt='2020-01-01T00:00:00Z';assert.equal(s.c.beautyLiveTestData().statsAvailable,false);
 snapshot.fetchedAt=new Date(Date.now()-360000).toISOString();assert.equal(s.c.beautyLiveTestData().statsStale,true);assert.equal(s.c.beautyLiveTestData().statsAvailable,true);
 snapshot.fetchedAt=now;s.c.PropertiesService={getScriptProperties:()=>({getProperty:()=>String(Date.now()+1)})};assert.equal(s.c.beautyLiveTestData().statsAvailable,true);assert.equal(s.c.beautyLiveTestData().statsStale,true);
});

test('Live display shows only average without forcing rank sorting',()=>{
 const c=client();c.ok({success:true,statsAvailable:true,rankingAvailable:true,players:[{name:'Z',rank:1,points:102,average:54.94},{name:'A',rank:2,points:0,average:0}]});
 c.nodes.liveStats.checked=true;c.nodes.liveStats.events.change();
 assert.equal(c.nodes.liveNames.children[0].children[0].children[1].textContent,'A');
 assert.equal(c.nodes.liveNames.children[1].children[1].textContent,'54.94');assert.equal(c.nodes.liveNames.children[1].children.length,2);assert.deepEqual(c.nodes.liveColumns.children[0].children.map(n=>n.textContent),['SPELARE','SNITT']);
 assert.equal(c.nodes.liveColumns.hidden,false);assert.equal(c.nodes.liveColumns.children.length,3);
 c.timeouts.at(-1).fn();c.ok({success:true,statsAvailable:true,statsStale:true,players:[{name:'A',average:0,points:0}]});
 assert.equal(c.nodes.liveStats.checked,true);assert.match(c.nodes.liveStatsSource.textContent,/inte uppdaterade/);
});
test('Live settings pause page rotation and return keyboard focus on close',()=>{
 const c=client();let focused=false;c.nodes.liveSettings.showModal=()=>{c.nodes.liveSettings.open=true;};c.nodes.liveSettings.close=()=>{c.nodes.liveSettings.open=false;c.nodes.liveSettings.events.close();};c.nodes.liveSettingsOpen.focus=()=>{focused=true;};
 c.ok(feed(Array.from({length:31},(_,i)=>({name:'P'+i}))));c.nodes.liveSettingsOpen.events.click();c.intervals[0].fn();assert.match(c.nodes.livePage.textContent,/Sida 1/);c.nodes.liveSettingsClose.events.click();assert.equal(focused,true);
});
test('Live automatic stats refresh requires staff authorization and releases its lock',()=>{
 const s=server();let calls=0,released=0;s.c.beautyHubAuthRequire_=token=>{if(token!=='staff')throw Error('auth');};
 s.c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})};s.c.beautyPoolAuth_=()=> 'private';s.c.beautyPoolStats_=(auth,force)=>{assert.equal(auth,'private');assert.equal(force,true);calls++;return {fresh:true,fetchedAt:'now',profiles:[{name:'PRIVATE'}]};};
 assert.throws(()=>s.c.beautyLiveRefreshStats('bad'),/auth/);assert.equal(calls,0);
 const out=s.c.beautyLiveRefreshStats('staff');assert.equal(out.fresh,true);assert.equal(calls,1);assert.equal(released,1);assert.doesNotMatch(JSON.stringify(out),/PRIVATE|private/);
 s.c.beautyPoolStats_=()=>{throw Error('provider');};assert.throws(()=>s.c.beautyLiveRefreshStats('staff'),/provider/);assert.equal(released,2);
});
test('Live staff timer refreshes only unlocked visible sessions and prevents overlap',()=>{
 const events={},timers=[];let calls=0,success;const c=vm.createContext({document:{hidden:false,addEventListener:(e,f)=>events[e]=f},window:{BeautyHubAuth:{token:()=> 'staff'}},setInterval:f=>timers.push(f),setTimeout:()=>1,clearTimeout(){},google:{script:{run:{withSuccessHandler(f){success=f;return this;},withFailureHandler(){return this;},beautyLiveRefreshStats(t){assert.equal(t,'staff');calls++;}}}}});
 vm.runInContext(fs.readFileSync('public/js/hub-live-stats.js','utf8'),c);timers[0]();assert.equal(calls,0);events['beauty-hub-opened']();assert.equal(calls,1);timers[0]();assert.equal(calls,1);success();timers[0]();assert.equal(calls,2);success();events['beauty-hub-locked']();timers[0]();assert.equal(calls,2);
});
test('inline list submenu toggles inside display menu and preserves sort and statistics controls',()=>{
 const c=client();let focused=false;c.nodes.liveSettingsOpen.focus=()=>{focused=true;};c.nodes.liveSettingsOpen.events.click();assert.equal(c.nodes.liveSettings.hidden,false);assert.equal(c.nodes.liveSettings.open,true);c.nodes.liveSettingsOpen.events.click();assert.equal(c.nodes.liveSettings.hidden,true);assert.equal(c.nodes.liveSettings.open,false);assert.equal(focused,true);c.ok(feed([{name:'B',registeredAt:1},{name:'A',registeredAt:2}]));c.nodes.liveSort.value='registration';c.nodes.liveSort.events.change();assert.equal(c.nodes.liveNames.children[0].children[0].children[1].textContent,'B');
});
