const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.disabled=false;this.checked=false;this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ');}
 appendChild(n){n.parent=this;this.children.push(n);return n;}replaceChildren(){this._text='';this.children=[];}
 setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){(this.events[k]??=[]).push(fn);}fire(k='click'){if(this.disabled)return;for(const fn of this.events[k]||[])fn({preventDefault(){}});}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}querySelectorAll(q){return this.all().filter(n=>q.split(',').includes(n.tag));}
 showModal(){this.open=true;}close(){this.open=false;}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}focus(){}checkValidity(){return true;}
}
function fixture(){
 const document={body:new Node('body'),events:{},createElement:t=>new Node(t),createTextNode:t=>{const n=new Node('#text');n.textContent=t;return n;},addEventListener(k,f){(this.events[k]??=[]).push(f);},dispatchEvent(e){for(const f of this.events[e.type]||[])f();},getElementById:()=>null};
 const calls=[],queue=[],window={},context={window,document,URL,Date,Event:class{constructor(type){this.type=type;}},BeautyHubServices:{endpoint:'https://beauty.invalid/hub',request(raw){calls.push(Object.fromEntries(new URL(raw).searchParams));return new Promise(resolve=>queue.push(r=>resolve({json:async()=>r})));}}};
 vm.runInNewContext(fs.readFileSync('public/js/hub-evening-setup.js','utf8'),context);
 const tick=async()=>{for(let i=0;i<32;i++)await Promise.resolve();},find=t=>document.body.all().find(n=>n.tag==='button'&&n._text===t),field=t=>document.body.all().find(n=>n.attrs['aria-label']===t);
 const setup={event:{title:'AIK Hub TEST 2026-11-08',date:'2026-11-08',status:'Accepting entries',url:'https://n01darts.com/n01/league/season.php?id=t_G2r0_6084'},format:'Round Robin only',rows:[{title:'Groups',text:'First to 1 leg · 39 darts per player per leg (13 rounds)'},{title:'Slutspel 1',text:'Off'},{title:'Slutspel 2',text:'Off'}],config:{groups:{legs:1,maxDarts:39},stage1:null,stage2:null},editable:true,registered:0,pools:'No pools sent',boardNote:'Boards in Pool Planner',checkedAt:'2026-11-06T22:10:00Z'};
 async function loaded(){window.BeautyEveningSetup.open();queue.shift()({success:true,setup,version:'native-revision'});await tick();}
 return {document,window,calls,queue,tick,find,field,setup,loaded,text:()=>document.body.textContent};
}
test('Evening Setup opens directly with actual saved choices and no settings write',async()=>{
 const f=fixture();await f.loaded();assert.match(f.text(),/Round Robin only/);assert.match(f.text(),/First to 1 leg.*39 darts/);assert.match(f.text(),/Slutspel 1 Off Slutspel 2 Off/);assert.equal(f.find('CHANGE SETTINGS').disabled,false);assert.deepEqual(f.calls.map(c=>c.page),['eveningsetup']);f.window.BeautyEveningSetup.open();assert.equal(f.document.body.children.length,1);assert.equal(f.calls.length,1);
});
test('Evening Setup reviews changed options and requires acknowledgement before one save',async()=>{
 const f=fixture();await f.loaded();f.find('CHANGE SETTINGS').fire();f.field('groups Legs to win').value='3';f.find('REVIEW CHANGES').fire();assert.equal(f.calls.at(-1).page,'eveningprepare');assert.equal(f.calls.at(-1).version,'native-revision');assert.equal(JSON.parse(f.calls.at(-1).settings).groups.legs,3);assert.equal(JSON.parse(f.calls.at(-1).settings).stage1,null);
 f.queue.shift()({success:true,ticket:'new-review',title:'AIK Hub TEST',date:'2026-11-08',format:'Round Robin only',summary:['Groups first to 3 legs']});await f.tick();assert.equal(f.find('SAVE EVENT SETTINGS').disabled,true);f.find('SAVE EVENT SETTINGS').fire();assert.equal(f.calls.length,2);
 const ack=f.document.body.all().find(n=>n.tag==='input');ack.checked=true;ack.fire('change');const save=f.find('SAVE EVENT SETTINGS');save.fire();save.fire();assert.equal(f.calls.length,3);assert.equal(f.calls.at(-1).ticket,'new-review');assert.equal(f.calls.at(-1).page,'eveningsave');f.queue.shift()({success:true,message:'Saved and verified'});await f.tick();assert.match(f.text(),/Saved and verified/);assert(f.find('SHOW SAVED EVENT SETUP'));assert.equal(f.find('SAVE EVENT SETTINGS'),undefined);
});
test('Evening Setup Back keeps the draft while a new review needs fresh acknowledgement',async()=>{
 const f=fixture();await f.loaded();f.find('CHANGE SETTINGS').fire();f.field('groups Legs to win').value='4';f.find('REVIEW CHANGES').fire();f.queue.shift()({success:true,ticket:'old',summary:[]});await f.tick();f.find('BACK TO CHANGES').fire();assert.equal(f.field('groups Legs to win').value,'4');assert.equal(f.calls.length,2);f.find('REVIEW CHANGES').fire();f.queue.shift()({success:true,ticket:'new',summary:[]});await f.tick();assert.equal(f.find('SAVE EVENT SETTINGS').disabled,true);
});
test('Evening Setup checks an existing creation automatically and opens editing without another user step',async()=>{
 const f=fixture();f.setup.editable=false;f.setup.blocked='Existing event check pending';f.setup.creationReviewRequired=true;await f.loaded();assert.equal(f.calls.at(-1).page,'nakkacreaterecover');assert.equal(f.find('VERIFY EXISTING EVENT'),undefined);f.queue.shift()({success:true});await f.tick();assert.equal(f.calls.at(-1).page,'eveningsetup');f.setup.editable=true;f.setup.blocked='';f.setup.creationReviewRequired=false;f.queue.shift()({success:true,setup:f.setup,version:'now'});await f.tick();assert.equal(f.find('CHANGE SETTINGS').disabled,false);assert.deepEqual(f.calls.map(v=>v.page),['eveningsetup','nakkacreaterecover','eveningsetup']);
});
test('Evening Setup keeps saved choices visible when the automatic existing-event check fails without retrying',async()=>{
 const f=fixture();f.setup.editable=false;f.setup.blocked='Existing event check pending';f.setup.creationReviewRequired=true;await f.loaded();f.queue.shift()({success:false,error:'The native rules differ. Inspect Nakka.'});await f.tick();assert.match(f.text(),/Round Robin only/);assert.match(f.text(),/native rules differ/);assert.equal(f.find('CHANGE SETTINGS').disabled,true);assert.equal(f.find('VERIFY EXISTING EVENT'),undefined);assert.equal(f.calls.length,2);
});
test('Evening Setup drops late responses on lock and uncertain saves expose no retry button',async()=>{
 const f=fixture();f.window.BeautyEveningSetup.open();f.document.dispatchEvent(new Event('beauty-hub-locked'));f.queue.shift()({success:true,setup:f.setup,version:'late'});await f.tick();assert.equal(f.document.body.children.length,0);
 await f.loaded();f.find('CHANGE SETTINGS').fire();f.find('REVIEW CHANGES').fire();f.queue.shift()({success:true,ticket:'one',summary:[]});await f.tick();const ack=f.document.body.all().find(n=>n.tag==='input');ack.checked=true;ack.fire('change');f.find('SAVE EVENT SETTINGS').fire();f.queue.shift()({success:false,uncertain:true,error:'Do not retry. Inspect Nakka.'});await f.tick();assert.match(f.text(),/Do not retry/);assert.equal(f.find('SAVE EVENT SETTINGS'),undefined);assert(f.find('RELOAD SAVED SETUP'));
});
test('Monday preset resets complete match rules before review and allows later organiser overrides',async()=>{
 const f=fixture();await f.loaded();f.find('CHANGE SETTINGS').fire();f.field('groups Legs to win').value='4';f.field('stage1 Final legs to win').value='2';f.find('USE MONDAY SETUP — RR + A/B').fire();assert.equal(f.calls.length,1);assert.equal(f.field('groups Legs to win').value,'2');for(const label of ['Enable Groups / Round Robin','Enable Slutspel 1','Enable Slutspel 2'])assert.equal(f.field(label).checked,true);
 f.document.body.all().find(n=>n.tag==='input'&&n.type==='checkbox'&&n.parent?._text==='Limit darts per leg ').checked=false;f.find('REVIEW CHANGES').fire();const settings=JSON.parse(f.calls.at(-1).settings);assert.equal(settings.groups.maxDarts,null);assert.equal(settings.stage1.maxDarts,39);assert.equal(settings.stage2.maxDarts,39);assert.equal(settings.groups.legs,2);assert.equal(settings.stage1.finalLegs,3);assert.equal(settings.stage2.finalLegs,2);assert.equal(settings.stage1.thirdPlace,false);assert.equal(settings.stage2.thirdPlace,false);assert.equal(f.calls.at(-1).page,'eveningprepare');
});
test('Event Setup preserves the installed absence of bulk cleanup controls',async()=>{
 const f=fixture();await f.loaded();assert.equal(f.find('CLEAN HUB TEST DATA'),undefined);assert(f.find('CHANGE EVENT DATE'));assert(f.find('CHANGE SETTINGS'));assert.equal(f.calls.length,1);
});
test('Missing-event Event Setup retains the date chooser without reintroducing cleanup',async()=>{
 const f=fixture();f.window.BeautyEveningSetup.open();f.queue.shift()({success:false,error:'No TEST event'});await f.tick();assert.equal(f.find('CLEAN HUB TEST DATA'),undefined);assert(f.find('CHANGE EVENT DATE'));assert(f.find('RELOAD EVENT SETUP'));assert.equal(f.calls.length,1);
});
