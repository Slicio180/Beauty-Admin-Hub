const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {fixture,candidate,clone}=require('./fixture.cjs');
const html=fs.readFileSync(path.join(candidate,'LiveHubView.html'),'utf8');
const ui=html.slice(html.indexOf('/* Identity TEST seeded Pool Planner.'));
const fragment=(start,end)=>ui.slice(ui.indexOf(start),ui.indexOf(end,ui.indexOf(start)));
const extracted=[fragment(' function clearChoices(){',' function settingsChanged('),fragment(' async function run(job){',' function disable(){'),fragment(' async function load(send,refresh){',' function mount(dialog){')].join('\n');
const closeSource=ui.match(/workspace.close=async\(\)=>\{.*?return true;\};/)[0];
const navigation=ui.split('\n').find(l=>l.includes("for(const nav of document.querySelectorAll('.sidebar > button'))"));
const beforeunload=ui.split('\n').find(l=>l.includes("root.addEventListener('beforeunload'"));
const lockHandler=ui.split('\n').find(l=>l.includes("document.addEventListener('beauty-hub-locked'"));
function harness(){
 const f=fixture(),draw=f.draw();assert.equal(draw.success,true);let generation=1;
 const timers=new Map(),events={},messages=[],calls=[],renders=[];let serial=0;
 const controls={'[data-boards]':{value:'5, 6'},'[data-size]':{value:'3'},'[data-draw-scheme]':{value:'preferredPlan'},'[data-event-format]':{value:'preserve'}};
 const host={open:true,hidden:false,querySelector:key=>controls[key],dispatchEvent(){},close(){this.open=false;}};
 const c={JSON,Error,console,URL,Promise,Event:function(type){this.type=type;},root:{beautyHubData:{success:true,eventDate:f.context.date,eventContext:f.context.revision,players:f.data.players},
  setTimeout(fn){const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),addEventListener:(name,fn)=>events[name]=fn},
  document:{querySelector:()=>null,body:{classList:{remove(){}}},addEventListener:(name,fn)=>events[name]=fn},
  BeautyHubAuth:{generation:()=>generation,isCurrent:n=>n===generation},host,panel:{querySelector:key=>controls[key]},
  frozen:clone(draw),state:{draftTicket:draw.ticket,stats:{fresh:true}},workflow:null,approval:null,startReview:null,busy:false,epoch:0,jobSerial:0,sourceLoadFailed:false,invalid:false,invalidReason:'',lastRoster:'',
  plannedBoards:[5,6],boardChoices:clone(draw.draftChoices.boardChoices),cardLabels:clone(draw.draftChoices.cardLabels),swapped:[],pendingChoices:null,choicesTimer:null,lastSavedChoices:JSON.stringify(draw.draftChoices),
  selectedBoardsSafe:()=>{try{return Array.from(f.c.BeautyPoolBoards.parseBoards(controls['[data-boards]'].value));}catch(e){return [];}},
  fingerprint:d=>JSON.stringify(d),message:t=>messages.push(t),disable(){},renderSource(){},renderSettings(){},renderDraw:()=>renders.push({format:c.root.beautyPoolFormatChoice,boards:controls['[data-boards]'].value,draw:c.frozen?.draw,invalid:c.invalid,invalidReason:c.invalidReason}),
  request:async(action,input)=>{calls.push({action,input});const r=f.run(action,input);if(!r.success){const error=Error(r.error);if(r.code)error.code=r.code;throw error;}return r;}
 };
 vm.createContext(c);vm.runInContext(extracted,c);
 return {c,f,controls,host,messages,calls,renders,timers,events,rotate:()=>generation++,fire:async()=>{const queued=[...timers.values()];timers.clear();for(const fn of queued)await fn();await new Promise(r=>setImmediate(r));}};
}
const checks=[];async function test(name,fn){await fn();checks.push(name);}
async function main(){
await test('Change saves only after acknowledgement and rotates the actual server ticket',async()=>{
 const u=harness(),old=u.c.frozen.ticket;u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();assert.ok(u.c.pendingChoices);assert.equal(u.c.frozen.ticket,old);assert.equal(await u.c.run(async()=>{}),true);assert.equal(u.c.pendingChoices,null);assert.notEqual(u.c.frozen.ticket,old);assert.equal(u.f.saved().draftChoices.format,'top2-rest');
});
await test('Rapid edits coalesce to the latest choice for the same draw',async()=>{
 const u=harness();u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();u.controls['[data-event-format]'].value='top2-bottom2';u.c.queueChoices();await u.fire();assert.equal(u.calls.length,1);assert.equal(u.f.saved().draftChoices.format,'top2-bottom2');
});
await test('Pending save is flushed before another planner action without recursive run deadlock',async()=>{
 const u=harness();u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();let saw;
 assert.equal(await u.c.run(async send=>{saw=u.c.frozen.ticket;await send('poolprepare',{ticket:saw,format:'preserve'});}),true);
 assert.deepEqual(u.calls.map(c=>c.action),['pooldraftchoices','poolprepare']);assert.notEqual(saw,u.calls[0].input.ticket);
});
await test('Delayed acknowledgement keeps the actual workspace open, then closes',async()=>{
 const u=harness();u.c.workspace=u.host;vm.runInContext(closeSource,u.c);const original=u.c.request;let reply;
 u.c.request=(...args)=>new Promise(resolve=>{reply=()=>original(...args).then(resolve);});
 u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();const closing=u.host.close();await Promise.resolve();assert.equal(u.host.open,true);assert.ok(u.c.pendingChoices);
 await reply();assert.equal(await closing,true);assert.equal(u.host.open,false);assert.equal(u.f.saved().draftChoices.format,'top2-rest');
});
await test('Failed save keeps the actual workspace open and retains dirty choices',async()=>{
 const u=harness();u.c.workspace=u.host;vm.runInContext(closeSource,u.c);u.c.request=async()=>{throw Error('offline');};u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();assert.equal(await u.host.close(),false);assert.equal(u.host.open,true);assert.ok(u.c.pendingChoices);assert.match(u.messages.at(-1),/not confirmed saved/);
});
await test('Invalid typed board text remains dirty and prevents navigation',async()=>{
 const u=harness();u.controls['[data-boards]'].value='oops';u.c.queueChoices();assert.ok(u.c.pendingChoices);assert.equal(await u.c.allowClose(),false);assert.ok(u.c.pendingChoices);assert.equal(u.host.open,true);
});
for(const [name,change]of[
 ['replaced draft',u=>u.c.frozen=clone(u.c.frozen)],['changed event context',u=>u.c.root.beautyHubData.eventContext='different'],['changed epoch',u=>u.c.epoch++],['new login',u=>u.rotate()],['closed planner',u=>u.host.open=false]
])await test(name+' cancels the queued old save before RPC',async()=>{const u=harness();u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();change(u);await u.c.run(async()=>{});assert.equal(u.calls.length,0);});
await test('Late save response cannot update a replacement draw',async()=>{
 const u=harness(),replacement=clone(u.c.frozen);let reply;u.c.request=()=>new Promise(resolve=>reply=resolve);u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();u.c.frozen=replacement;reply({success:true,ticket:'b'.repeat(32),draftChoices:{},requiresRedraw:false});assert.equal(await saving,false);assert.notEqual(replacement.ticket,'b'.repeat(32));
});
await test('A later same-draw edit is rebased only after the previous save receipt',async()=>{
 const u=harness(),original=u.c.request;let reply;u.c.request=(...args)=>new Promise(resolve=>{reply=()=>original(...args).then(resolve);});
 u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();u.controls['[data-event-format]'].value='top2-bottom2';u.c.queueChoices();u.c.request=original;await reply();assert.equal(await saving,true);assert.equal(u.f.saved().draftChoices.format,'top2-bottom2');assert.equal(u.c.pendingChoices,null);assert.equal(u.calls.length,2);
});
await test('Load restores format and choices before rendering, without autosaving defaults',async()=>{
 const u=harness(),before=u.c.frozen.draw,choices=clone(u.c.frozen.draftChoices);choices.format='top2-rest';choices.preferredSize=4;choices.cardLabels[0].group=7;choices.cardLabels[0].manualGroup=true;
 const saved=u.f.run('pooldraftchoices',{ticket:u.c.frozen.ticket,choices:JSON.stringify(choices)});assert.equal(saved.success,true);u.c.frozen=null;u.c.boardChoices={};u.c.cardLabels={};u.c.root.beautyPoolFormatChoice='preserve';
 assert.equal(await u.c.run(send=>u.c.load(send,false)),true);assert.equal(u.renders.at(-1).format,'top2-rest');assert.equal(u.controls['[data-size]'].value,'4');assert.equal(u.c.cardLabels[0].manualGroup,true);assert.deepEqual(u.c.frozen.draw,before);assert.deepEqual(u.calls.map(c=>c.action),['poolload']);assert.equal(u.c.pendingChoices,null);assert.equal(u.c.approval,null);assert.equal(u.c.invalid,true);
});
await test('Reverting group preferences refreshes the invalidation display only after save acknowledgement',async()=>{
 const u=harness();u.controls['[data-size]'].value='4';u.c.queueChoices();assert.equal(await u.c.run(async()=>{}),true);assert.equal(u.renders.at(-1).invalid,true);
 const before=clone(u.c.frozen.draw),original=u.c.request;let reply;u.c.request=(...args)=>new Promise(resolve=>{reply=()=>original(...args).then(resolve);});
 u.controls['[data-size]'].value='3';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();assert.equal(u.renders.at(-1).invalid,true);
 await reply();assert.equal(await saving,true);assert.equal(u.renders.at(-1).invalid,false);assert.equal(u.renders.at(-1).invalidReason,'');assert.deepEqual(u.c.frozen.draw,before);assert.equal(u.f.saved().requiresRedraw,false);assert.equal(u.c.approval,null);
});
await test('Definitive stale rejection releases navigation and reloads the authoritative draw without overwrite',async()=>{
 const u=harness();u.f.load();const before=clone(u.f.saved());u.controls['[data-size]'].value='4';u.c.queueChoices();assert.equal(await u.c.run(async()=>{}),false);
 assert.equal(u.c.pendingChoices,null);assert.equal(u.c.invalid,true);assert.equal(u.c.state.stats.fresh,false);assert.deepEqual(u.f.saved(),before);assert.equal(await u.c.allowClose(),true);assert.match(u.messages.at(-1),/Reopen the planner/);assert.doesNotMatch(u.messages.at(-1),/not confirmed saved/);
 assert.equal(await u.c.run(send=>u.c.load(send,false)),true);assert.equal(u.controls['[data-size]'].value,'3');assert.deepEqual(u.c.frozen.draw,before.draw);assert.equal(u.c.invalid,false);assert.equal(u.c.approval,null);
});
await test('An uncoded failure with similar text retains pending edits',async()=>{
 const u=harness();u.c.request=async()=>{throw Error('Pool review was replaced. Reopen the planner to load its saved draw.');};u.controls['[data-size]'].value='4';u.c.queueChoices();assert.equal(await u.c.run(async()=>{}),false);assert.ok(u.c.pendingChoices);assert.equal(await u.c.allowClose(),false);
});
await test('Busy response keeps pending choices and close remains blocked',async()=>{
 const u=harness();u.c.request=async()=>{throw Error('Another TEST operation is running. Wait before reviewing.');};u.controls['[data-size]'].value='4';u.c.queueChoices();assert.equal(await u.c.run(async()=>{}),false);assert.ok(u.c.pendingChoices);assert.equal(await u.c.allowClose(),false);
});
await test('Late stale rejection cannot clear a replacement draft or its pending choice',async()=>{
 const u=harness();let reject;u.c.request=()=>new Promise((resolve,no)=>reject=no);u.controls['[data-size]'].value='4';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();
 u.c.frozen=clone(u.c.frozen);u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();const next=u.c.pendingChoices;reject(Object.assign(Error('older request'),{code:'POOL_DRAFT_REPLACED'}));assert.equal(await saving,false);assert.equal(u.c.pendingChoices,next);assert.equal(u.c.invalid,false);
});
await test('Definitive stale rejection clears all coalesced choices only for that old draft',async()=>{
 const u=harness();let reject;u.c.request=()=>new Promise((resolve,no)=>reject=no);u.controls['[data-size]'].value='4';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();
 reject(Object.assign(Error('replaced'),{code:'POOL_DRAFT_REPLACED'}));assert.equal(await saving,false);assert.equal(u.c.pendingChoices,null);assert.equal(u.c.choicesTimer,null);assert.equal(await u.c.allowClose(),true);
});
await test('Actual request boundary forwards only the recognised definitive stale code',async()=>{
 const u=harness();u.c.BeautyHubServices={endpoint:'https://example.invalid/dev',request:async()=>({json:async()=>({success:false,error:'stale',code:'POOL_DRAFT_REPLACED'})})};
 vm.runInContext(fragment(' async function request(page,input){',' async function run(job){'),u.c);
 await assert.rejects(u.c.request('pooldraftchoices',{}),e=>e.code==='POOL_DRAFT_REPLACED');
 u.c.BeautyHubServices.request=async()=>({json:async()=>({success:false,error:'unknown',code:'OTHER'})});await assert.rejects(u.c.request('pooldraftchoices',{}),e=>e.code===undefined);
});
await test('Failed load retains the last visible draw and disables fresh statistics',async()=>{
 const u=harness(),before=clone(u.c.frozen.draw);u.c.request=async()=>{throw Error('provider read failed');};assert.equal(await u.c.run(send=>u.c.load(send,false)),false);assert.deepEqual(u.c.frozen.draw,before);assert.equal(u.c.state.stats.fresh,false);assert.equal(u.c.sourceLoadFailed,true);
});
await test('Actual sidebar listener waits for save before replaying navigation once',async()=>{
 const u=harness();u.c.workspace=u.host;u.c.button={};vm.runInContext(closeSource,u.c);let handler,clicks=0;
 const nav={addEventListener:(name,fn)=>handler=fn,click:()=>clicks++};u.c.document.querySelectorAll=()=>[nav];vm.runInContext(navigation,u.c);
 const original=u.c.request;let reply;u.c.request=(...args)=>new Promise(resolve=>{reply=()=>original(...args).then(resolve);});u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();let stopped=0;handler({preventDefault(){stopped++;},stopImmediatePropagation(){stopped++;}});await Promise.resolve();assert.equal(stopped,2);assert.equal(clicks,0);assert.equal(u.host.open,true);await reply();await new Promise(r=>setImmediate(r));assert.equal(clicks,1);assert.equal(u.host.open,false);
});
await test('Actual beforeunload guard warns only for pending save or active operation',async()=>{
 const u=harness();vm.runInContext(beforeunload,u.c);let warnings=0;const event={preventDefault(){warnings++;}};u.events.beforeunload(event);assert.equal(warnings,0);u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();u.events.beforeunload(event);assert.equal(warnings,1);assert.equal(event.returnValue,'');
});
await test('Authentication lock clears queued choices and rejects a late reply',async()=>{
 const u=harness();u.c.panel.querySelector=key=>u.controls[key]||{replaceChildren(){}};u.c.renderSource=()=>{};u.c.renderDraw=()=>{};vm.runInContext(lockHandler,u.c);
 let reply;u.c.request=()=>new Promise(resolve=>reply=resolve);u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();u.events['beauty-hub-locked']();assert.equal(u.c.pendingChoices,null);assert.equal(u.c.frozen,null);reply({success:true,ticket:'b'.repeat(32),draftChoices:{}});assert.equal(await saving,false);assert.equal(u.c.frozen,null);
});
await test('Added player rejection releases navigation and permits a fresh load without altering the saved draw',async()=>{
 const u=harness(),before=clone(u.f.saved());u.f.data.players.push({player:'Synthetic later player',status:'IN'});
 u.controls['[data-size]'].value='4';u.c.queueChoices();assert.equal(await u.c.run(async()=>{}),false);
 assert.equal(u.c.pendingChoices,null);assert.equal(u.c.invalid,true);assert.equal(u.c.state.stats.fresh,false);assert.deepEqual(u.f.saved(),before);assert.equal(await u.c.allowClose(),true);assert.doesNotMatch(u.messages.at(-1),/not confirmed saved/);
 assert.equal(await u.c.run(send=>u.c.load(send,true)),true);assert.deepEqual(u.f.saved(),before);assert.ok(u.c.state.draftIssue);assert.equal(u.c.state.restoredDraft,null);assert.equal(u.c.state.stats.fresh,true);assert.deepEqual(u.c.frozen.draw,before.draw);
});
await test('A coded roster rejection for an older request cannot clear a replacement draw pending choice',async()=>{
 const u=harness();let reject;u.c.request=()=>new Promise((resolve,no)=>reject=no);u.controls['[data-size]'].value='4';u.c.queueChoices();const saving=u.c.run(async()=>{});await Promise.resolve();
 u.c.frozen=clone(u.c.frozen);u.controls['[data-event-format]'].value='top2-rest';u.c.queueChoices();const next=u.c.pendingChoices;
 reject(Object.assign(Error('roster changed'),{code:'POOL_DRAFT_ROSTER_CHANGED'}));assert.equal(await saving,false);assert.equal(u.c.pendingChoices,next);
});
await test('Uncoded roster error keeps unsaved choices and blocked navigation',async()=>{
 const u=harness();u.c.request=async()=>{throw Error('The IN roster or event date changed. These choices were rejected.');};u.controls['[data-size]'].value='4';u.c.queueChoices();assert.equal(await u.c.run(async()=>{}),false);assert.ok(u.c.pendingChoices);assert.equal(await u.c.allowClose(),false);
});
await test('Actual RPC boundary accepts roster code only with explicit non-uncertain receipt',async()=>{
 const u=harness();u.c.BeautyHubServices={endpoint:'https://example.invalid/dev'};vm.runInContext(fragment(' async function request(page,input){',' async function run(job){'),u.c);
 for(const uncertain of [false,true,undefined]){u.c.BeautyHubServices.request=async()=>({json:async()=>({success:false,error:'roster changed',code:'POOL_DRAFT_ROSTER_CHANGED',uncertain})});await assert.rejects(u.c.request('pooldraftchoices',{}),e=>e.code===(uncertain===false?'POOL_DRAFT_ROSTER_CHANGED':undefined));}
});
fs.writeFileSync(path.join(__dirname,'client-results.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks,scope:'Extracted actual candidate lifecycle functions, handler fixture and close/navigation/auth/unload listeners with simulated DOM/transport. Native acceptance pending.'},null,2));
console.log('PASS:',checks.length,'client lifecycle checks');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
