const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ui(initial){
 const make=text=>{const classes=new Set(),attrs={};return {textContent:text,dataset:{},attrs,classes,classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k],addEventListener:(name,fn)=>{(events[text+':'+name]??=[]).push(fn);}};};
 const events={},nodes=['Dashboard','Beauty Live','Pool Planner','Event Control','Nakka','System Status','Instructions'].map(make),title=make(''),requests=[],pending=[],intervals=[];
 const c={Date,JSON,Object,document:{hidden:false,getElementById:id=>id==='dashboardNavButton'?nodes[0]:id==='nakkaTournamentTitle'?title:null,querySelectorAll:()=>nodes,addEventListener:(name,fn)=>(events[name]??=[]).push(fn)},addEventListener:(name,fn)=>(events['window:'+name]??=[]).push(fn),setInterval:fn=>intervals.push(fn),BeautyHubServices:{request:url=>{requests.push(url);return new Promise((resolve,reject)=>pending.push({resolve:r=>resolve({json:async()=>r}),reject}));}},beautyHubData:initial};c.window=c;
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/js/hub-chrome.js','utf8'),c);
 return {c,nodes,title,requests,pending,intervals,chrome:c.BeautyHubChrome,nav:c.BeautyHubNavigation,emit:name=>Promise.all((events[name]||[]).map(fn=>fn()))};
}
const result=(date='2026-10-27',title='Nakka tournament title')=>({success:true,status:'MATCHED',eventDate:date,event:{id:'t_RqC2_2034',date,title}});
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('Header reads literal tournament title from authenticated service rather than a fixed branding label',async()=>{
 const u=ui();u.chrome.update({eventDate:'2026-10-27'});assert.equal(u.title.dataset.state,'loading');assert.equal(u.requests[0],'https://beauty.invalid/hub?page=nakkaevent');u.pending.shift().resolve(result('2026-10-27','<img onerror=evil()>'));await settle();assert.equal(u.title.textContent,'<img onerror=evil()>');assert.equal(u.title.dataset.state,'matched');
});
test('Header clears old tournament immediately and rejects an old response after date changes',async()=>{
 const u=ui();u.chrome.update({eventDate:'2026-10-27'});u.chrome.update({eventDate:'2026-10-28'});u.pending.shift().resolve(result());await settle();assert.equal(u.title.textContent,'Checking Nakka…');u.pending.shift().resolve(result('2026-10-28','New date tournament'));await settle();assert.equal(u.title.textContent,'New date tournament');
});
test('Header does not invent a title for ambiguous missing malformed or wrong-date events',async()=>{
 for(const r of [{success:true,status:'AMBIGUOUS'},{success:true,status:'NOT_FOUND'},{...result(),event:{title:'',date:'2026-10-27',id:'t_TEST'}},result('2026-10-28')]){
  const u=ui();u.chrome.update({eventDate:'2026-10-27'});u.pending.shift().resolve(r);await settle();assert.equal(u.title.dataset.state,'unavailable');assert.match(u.title.textContent,/unavailable/);
 }
});
test('Header failed read is sanitized and session lock discards late private event title',async()=>{
 const u=ui();u.chrome.update({eventDate:'2026-10-27'});u.pending.shift().reject(Error('secret'));await settle();assert.doesNotMatch(u.title.textContent,/secret/);
 const request=u.chrome.refresh();await u.emit('beauty-hub-locked');u.pending.shift().resolve(result('2026-10-27','Private event'));await request;assert.equal(u.title.textContent,'Sign in to view tournament');
});
test('Header coalesces reads and periodic refresh runs only while visible with a selected event',async()=>{
 const u=ui();u.chrome.update({eventDate:'2026-10-27'});u.chrome.update({eventDate:'2026-10-27'});await u.chrome.refresh();assert.equal(u.requests.length,1);
 u.pending.shift().resolve(result());await settle();u.c.document.hidden=true;u.intervals[0]();assert.equal(u.requests.length,1);u.c.document.hidden=false;u.intervals[0]();assert.equal(u.requests.length,2);u.pending.shift().resolve(result());await settle();await u.emit('beauty-hub-locked');u.intervals[0]();assert.equal(u.requests.length,2);
});
test('Header initializes even when Hub data arrived before the chrome script',async()=>{
 const u=ui({eventDate:'2026-10-27'});assert.equal(u.requests.length,1);u.pending.shift().resolve(result());await settle();assert.equal(u.title.textContent,'Nakka tournament title');
});
test('Sidebar active icon text marker and aria-current follow the current section exclusively',()=>{
 const u=ui();u.nav.activate(u.nodes[4]);assert(u.nodes[4].classes.has('active'));assert.equal(u.nodes[4].attrs['aria-current'],'page');assert(!u.nodes[0].classes.has('active'));assert.equal(u.nodes[0].attrs['aria-current'],undefined);
 u.nav.activate(u.nodes[3]);assert.equal(u.nodes.filter(n=>n.classes.has('active')).length,1);assert(u.nodes[3].classes.has('active'));u.nav.dashboard();assert(u.nodes[0].classes.has('active'));assert.equal(u.nodes[3].attrs['aria-current'],undefined);
});
test('Sidebar returns to Dashboard on session lock and after returning from the separate Live tab',async()=>{
 const u=ui();u.nav.activate(u.nodes[1]);await u.emit('window:focus');assert(u.nodes[0].classes.has('active'));u.nav.activate(u.nodes[4]);await u.emit('beauty-hub-locked');assert(u.nodes[0].classes.has('active'));
});
