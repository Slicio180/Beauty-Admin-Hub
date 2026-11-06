const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const events={},ids={},body={};let refreshes=0,tick=null;
 class Node{
  constructor(){this.textContent='';this.hidden=false;this.children=[];this.events={};this.disabled=false;}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}click(){for(const fn of this.events.click||[])fn();}
  append(...nodes){this.children.push(...nodes);}replaceChildren(){this.children=[];this.textContent='';}focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}
  querySelector(){return ids.refresh;}
 }
 for(const id of ['nakkaStatusPanel','nakkaAttentionPanel','nakkaDiagnose','nakkaDiagnosis','nakkaCheckProgress','nakkaConnectedEvent','nakkaCheckTiming','nakkaCheckTimingResult','nakkaNavButton','attentionReviewTitle','refresh'])ids[id]=new Node();
 const c=vm.createContext({Date,Math,Number,document:{body,getElementById:id=>ids[id],createElement:()=>new Node(),addEventListener:(type,fn)=>(events[type]??=[]).push(fn)},window:{beautyHubData:{eventDate:'2026-11-02'},BeautyDashboard:{refresh:()=>{refreshes++;emit('beauty-nakka-check-start');}}},setInterval:fn=>{tick=fn;return 1;},clearInterval:()=>{tick=null;}});
 function emit(type,detail){for(const fn of events[type]||[])fn({type,detail});}
 vm.runInContext(fs.readFileSync('public/js/hub-nakka-workflow.js','utf8'),c);
 return {ids,c,emit,get refreshes(){return refreshes;},get ticking(){return !!tick;}};
}
const result={success:true,eventDate:'2026-11-02',event:{title:'Beauty Registration TEST event DO NOT USE LIVE',id:'t_QHaG_7792'},attention:{available:true,complete:true,items:[{name:'Anna'}]},clientMs:1200,timing:{totalMs:800,steps:[{stage:'nakka-read-batch',ms:500}]}};
test('Nakka troubleshooting uses the existing menu and opens the attention section before checks finish',()=>{
 const f=fixture();f.c.window.BeautyNakkaWorkflow.attention();assert.equal(f.refreshes,1);assert.equal(f.ids.attentionReviewTitle.focused,true);assert.equal(f.ids.nakkaAttentionPanel.scrolled,true);assert.equal(f.ids.nakkaDiagnose.disabled,true);assert.match(f.ids.nakkaCheckProgress.textContent,/Checking/);
});
test('Nakka troubleshooting explains event failures without claiming a verified connection or empty alerts',()=>{
 for(const code of ['EVENT_DATE_MISMATCH','EVENT_AMBIGUOUS','EVENT_UNAVAILABLE','STALE_CHECK','BUSY','CHECK_UNAVAILABLE']){
  const f=fixture();f.emit('beauty-nakka-check-start');f.emit('beauty-nakka-diagnosed',{success:false,code});assert.equal(f.ticking,false);assert.equal(f.ids.nakkaDiagnose.disabled,false);assert.notEqual(f.ids.nakkaDiagnosis.textContent,'');assert.equal(f.ids.nakkaConnectedEvent.textContent,'');assert.match(f.ids.nakkaCheckProgress.textContent,/incomplete/);
 }
 const f=fixture();f.emit('beauty-nakka-diagnosed',{...result,attention:{available:false,items:[]}});assert.match(f.ids.nakkaCheckProgress.textContent,/incomplete/);
});
test('Nakka troubleshooting shows current event player next step and measured server duration',()=>{
 const f=fixture();f.emit('beauty-nakka-diagnosed',result);assert.match(f.ids.nakkaConnectedEvent.textContent,/2026-11-02/);assert.match(f.ids.nakkaCheckProgress.textContent,/Choose a player below/);assert.equal(f.ids.nakkaCheckTiming.hidden,false);assert(f.ids.nakkaCheckTimingResult.children.some(n=>n.textContent.includes('Server: 0.8 s')));
 f.ids.nakkaNavButton.click();assert.equal(f.refreshes,0);f.emit('beauty-nakka-invalidated');f.ids.nakkaNavButton.click();assert.equal(f.refreshes,1);
});
test('Nakka troubleshooting clears private event and timing state on logout and stops progress updates',()=>{
 const f=fixture();f.emit('beauty-nakka-diagnosed',result);f.emit('beauty-nakka-check-start');f.emit('beauty-hub-locked');assert.equal(f.ticking,false);assert.equal(f.ids.nakkaConnectedEvent.textContent,'');assert.equal(f.ids.nakkaCheckTimingResult.children.length,0);assert.equal(f.ids.nakkaCheckTiming.hidden,true);assert.match(f.ids.nakkaDiagnosis.textContent,/Sign in/);
});

test('Generated TEST entry makes the entire attention label and number one button inside the existing Nakka menu',()=>{
 const html=fs.readFileSync('apps-script/registration-identity-test/remote-app/HubTest.html','utf8');const tile=html.match(/<button[^>]+id="attentionTile"[^>]*>([\s\S]*?)<\/button>/);assert.ok(tile);assert.match(tile[1],/NEEDS ATTENTION/);assert.match(tile[1],/id="attentionCount"/);assert.doesNotMatch(tile[0],/hidden|REVIEW/);assert.match(html,/<dialog id="nakkaStatusPanel"[\s\S]*id="nakkaWorkflow"[\s\S]*id="nakkaAttentionPanel"[\s\S]*<\/dialog>/);assert.match(html,/Players needing attention/);assert.match(html,/<summary>Advanced<\/summary>/);
});

test('Event view has automatic monitoring and player issues with optional checks hidden under Advanced',()=>{
 const html=fs.readFileSync('public/nakka-troubleshooting.html','utf8'),main=html.slice(0,html.indexOf('<details id="nakkaComparisonDetails"'));
 assert.equal((main.match(/<button/g)||[]).length,0);assert.match(html.slice(main.length),/CHECK NOW/);assert.match(main,/automatically every 30 seconds/);assert.doesNotMatch(main,/<a\b|CHECK AGAIN|CHECK EVENT|1\.|2\./);
 assert.match(html,/<summary>Advanced<\/summary>/);assert.doesNotMatch(html,/<a\b|id="nakkaEventCheck"/);
 const css=fs.readFileSync('public/css/beauty-dashboard.css','utf8');assert.match(css,/#attentionCard\[data-active="true"\] \.attention-card-button span::before\{background:#ff5252/);assert.doesNotMatch(css,/#attentionCard\[data-active="true"\]\{outline:/);assert.match(css,/#attentionCard\[data-active="true"\] #attentionCount\{color:#ff5252!important/);
});
