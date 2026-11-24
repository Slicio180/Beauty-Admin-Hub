const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=__dirname;
function rig(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');let code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('Independent four-view public LIVE cast'));
 const nodes=new Map(),intervals=[],listeners={},calls={stop:0,refresh:0,fast:0};let opts;
 function el(id){if(nodes.has(id))return nodes.get(id);const n={id,parentElement:{hidden:false},children:[],dataset:{},hidden:false,checked:true,value:'6',textContent:'',clientWidth:1000,clientHeight:1700,classList:{toggle(){},contains(){return false;}},style:{setProperty(){}},handlers:{},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},replaceChildren(...v){this.children=v;},appendChild(n){this.children.push(n);n.parentElement=this;return n;},querySelectorAll:()=>[],addEventListener(k,f){this.handlers[k]=f;},contains:()=>false};nodes.set(id,n);return n;}
 const c={console,Date,JSON,document:{hidden:false,getElementById:el,createElement:tag=>el(tag+Math.random()),addEventListener(){},querySelectorAll:()=>[]},navigator:{onLine:true},innerWidth:1080,fetch:()=>{},setInterval:(fn,ms)=>(intervals.push({fn,ms}),intervals.length),clearInterval(){},addEventListener(k,fn){listeners[k]=fn;},dispatchEvent(){},Event:class{constructor(type){this.type=type;}},BeautyNakkaStageFeed:{create(o){opts=o;return {stop:()=>calls.stop++,refresh:async options=>{calls.refresh++;calls.lastOptions=options;},refreshLive:()=>calls.fast++,setPlan(){}};}}};
 c.window=c;vm.createContext(c);code=code.replace('render();if(automatic)load();','window.auditState=()=>({data,feed,castTarget,rosterUnavailable});render();if(automatic)load();');vm.runInContext(code,c);
 return {c,calls,el,intervals,options:()=>opts};
}

(async()=>{
 const results=[];function check(name,fn){fn();results.push({name,result:'PASS'});}
 const r=rig('LiveCastView.html'),a={eventId:'t_example',leagueId:'lg_example',eventDate:'2026-11-16',eventContext:'same-event'};
 r.c.BeautyCastShell.playersUpdated(a);await new Promise(setImmediate);
 const first=r.options(),good={title:'Synthetic event',views:{pools:true,t:true,s2:true},pools:[{}],knockouts:[{},{}]};
 first.onData(good);r.el('stagePreview').appendChild(r.el('last-good-pools'));
 r.c.BeautyCastShell.playersUnavailable();
 check('Roster failure retains last confirmed Nakka data and feed',()=>{assert.equal(r.c.auditState().data,good);assert(r.c.auditState().feed);assert.equal(r.calls.stop,0);assert.equal(r.el('stagePreview').children.length,1);});
 check('Roster failure exposes uncertainty warning',()=>{assert.equal(r.el('staleNotice').hidden,false);assert.equal(r.c.auditState().rosterUnavailable,true);assert.match(r.el('stageStatus').textContent,/Spelarlistans anslutning/);});
 first.onData(good);
 check('Successful Nakka update does not hide missing roster verification',()=>assert.equal(r.el('staleNotice').hidden,false));
 r.c.BeautyCastShell.playersUpdated(a);
 check('Same-event roster recovery retains the feed',()=>{assert.equal(r.c.auditState().rosterUnavailable,false);assert.equal(r.calls.stop,0);});
 await r.intervals.find(t=>t.ms===10000).fn();await new Promise(setImmediate);
 check('Automatic shell refresh opts into feed backoff',()=>assert.equal(r.calls.lastOptions.automatic,true));
 r.c.BeautyCastShell.playersUpdated({...a,eventContext:'new-event',eventId:'t_new'});await new Promise(setImmediate);
 check('Confirmed event change clears old data and stops old feed',()=>{assert.equal(r.c.auditState().data,null);assert.equal(r.calls.stop,1);assert.equal(r.el('stagePreview').children.length,0);});
 first.onData(good);
 check('Late reply from previous event cannot repopulate the screen',()=>assert.equal(r.c.auditState().data,null));
 const second=r.options();r.c.BeautyCastShell.playersUpdated({...a,eventContext:'new-event',eventId:'t_third'});await new Promise(setImmediate);second.onData(good);
 check('Changed event ID is isolated even with a reused context token',()=>{assert.equal(r.calls.stop,2);assert.equal(r.c.auditState().data,null);});
 const cold=rig('LiveCastView.html');cold.c.BeautyCastShell.playersUnavailable();
 check('Cold roster failure never invents an event or feed',()=>{assert.equal(cold.c.auditState().data,null);assert.equal(cold.c.auditState().feed,null);assert.equal(cold.c.auditState().castTarget,null);});
 fs.writeFileSync(path.join(__dirname,'shell-results.json'),JSON.stringify({status:'PASS',checks:results.length,scope:'Actual shell with synthetic DOM and feed; not rendered browser acceptance',results},null,2));console.log(JSON.stringify({status:'PASS',checks:results.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
