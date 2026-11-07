const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.attrs={};this.disabled=false;this._text='';this.classList={add:()=>{}};}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ');}
 append(...ns){for(const n of ns){n.parent=this;this.children.push(n);}}replaceChildren(){this._text='';this.children=[];}
 setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){(this.events[k]??=[]).push(f);}fire(k='click'){if(!this.disabled)for(const f of this.events[k]||[])f({preventDefault(){}});}
 all(){return this.children.flatMap(n=>[n,...n.all()]);}querySelectorAll(q){return this.all().filter(n=>q.split(',').includes(n.tag));}querySelector(){return null;}
 showModal(){this.open=true;}close(){this.open=false;}remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}focus(){}reportValidity(){return !!this.value;}
}
function ui(){
 const body=new Node('body'),calls=[],events={},queue=[];let setup=0,refresh=0;
 const document={body,activeElement:null,createElement:t=>new Node(t),getElementById:()=>null,querySelectorAll:()=>[],addEventListener:(k,f)=>{(events[k]??=[]).push(f);},dispatchEvent:e=>{for(const f of events[e.type]||[])f();}};
 const window={beautyHubData:{eventDate:'2026-11-09',activeEvent:{mode:'league',leagueId:'lg_Club_1234'}},BeautyEveningSetup:{open:()=>setup++},BeautyHubNavigation:{dashboard:()=>{}},BeautyHubChrome:{refresh:()=>refresh++}};
 const c={window,document,Date,Event:class{constructor(type){this.type=type;}},loadBeautyHubData:async()=>{},BeautyHubServices:{context:(action,input)=>{calls.push({action,input});return new Promise((resolve,reject)=>queue.push({resolve,reject}));}}};
 vm.runInNewContext(fs.readFileSync('public/js/hub-event-selector.js','utf8'),c);
 const tick=async()=>{for(let i=0;i<40;i++)await Promise.resolve();},find=t=>body.all().find(n=>n.tag==='button'&&n._text===t),field=t=>body.all().find(n=>n.tag==='input'&&n.type===t);
 const reply=async value=>{queue.shift().resolve(value);await tick();};
 const open=async()=>{window.BeautyEventSelector.open();await reply({connections:[{mode:'league',id:'lg_Club_1234',title:'AIK Måndagsdartarna'},{mode:'tournament',id:'t_Open_1234',title:'Saturday Open',date:'2026-11-07'}],active:{mode:'league',leagueId:'lg_Club_1234',date:'2026-11-09'}});};
 return {window,body,calls,queue,tick,find,field,reply,open,setup:()=>setup,refresh:()=>refresh};
}
test('Existing league check and Start Event activate its ID then refresh the dashboard',async()=>{
 const h=ui();await h.open();h.find('LEAGUE').fire();h.find('EXISTING LEAGUE').fire();h.find('AIK Måndagsdartarna').fire();assert.equal(h.field('date').value,'2026-11-09');h.find('CHECK FOR EVENT').fire();assert.equal(h.calls.at(-1).action,'find');await h.reply({events:[{id:'t_Monday_1234',title:'Monday',date:'2026-11-09'}]});assert(h.find('CHANGE EVENT DATE'));h.find('START EVENT').fire();h.find('START EVENT').fire();assert.equal(h.calls.filter(c=>c.action==='activate').length,1);assert.equal(h.calls.at(-1).input.eventId,'t_Monday_1234');await h.reply({success:true});assert.equal(h.body.children.length,0);assert.equal(h.refresh(),1);assert.equal(h.setup(),0);
});
test('Add New League contains URL only and uses the title returned by Nakka',async()=>{
 const h=ui();await h.open();h.find('LEAGUE').fire();h.find('ADD NEW LEAGUE').fire();assert.equal(h.body.all().filter(n=>n.tag==='input').length,1);h.field('url').value='https://n01darts.com/n01/league/portal.php?lgid=lg_New_1234';h.find('CHECK LEAGUE').fire();await h.reply({item:{mode:'league',id:'lg_New_1234',title:'New AIK League'},ticket:'review'});assert.match(h.body.textContent,/New AIK League/);h.find('ADD TO HUB').fire();assert.equal(h.calls.at(-1).input.ticket,'review');await h.reply({item:{mode:'league',id:'lg_New_1234',title:'New AIK League'}});assert(h.find('CHECK FOR EVENT'));
});
test('New Tournament checks URL, adds connection, activates standalone context and opens Event Setup',async()=>{
 const h=ui();await h.open();h.find('TOURNAMENT').fire();h.find('NEW TOURNAMENT').fire();h.field('url').value='https://n01darts.com/n01/tournament/comp.php?id=t_Open_1234';h.find('CHECK TOURNAMENT').fire();const item={mode:'tournament',id:'t_Open_1234',title:'Saturday Open',date:'2026-11-07'};await h.reply({item,ticket:'checked'});h.find('ADD TO HUB').fire();await h.reply({item});assert.equal(h.calls.at(-1).action,'activate');assert.equal(h.calls.at(-1).input.leagueId,'');assert.equal(h.calls.at(-1).input.eventId,'t_Open_1234');await h.reply({success:true});assert.equal(h.setup(),1);assert.equal(h.body.children.length,0);
});
test('Missing league event offers creation and keeps Change Event Date available',async()=>{
 const h=ui();await h.open();h.find('LEAGUE').fire();h.find('EXISTING LEAGUE').fire();h.find('AIK Måndagsdartarna').fire();h.find('CHECK FOR EVENT').fire();await h.reply({events:[]});assert(h.find('MAKE NEW EVENT FOR THIS LEAGUE'));h.find('CHANGE EVENT DATE').fire();assert(h.field('date'));assert.equal(h.calls.filter(c=>c.action==='activate'||c.action==='draft').length,0);
});
test('Connection failure stays visible and never advances or activates an event',async()=>{
 const h=ui();await h.open();h.find('LEAGUE').fire();h.find('ADD NEW LEAGUE').fire();h.field('url').value='https://example.test';h.find('CHECK LEAGUE').fire();h.queue.shift().reject(Error('League could not be verified'));await h.tick();assert.match(h.body.textContent,/League could not be verified/);assert.equal(h.find('CHECK LEAGUE').disabled,false);assert.equal(h.calls.some(c=>c.action==='add'||c.action==='activate'),false);
});
