const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rules = require('../public/js/name-resolution.js');
const NEW = rules.newPlayerOption;
const input = (extra = {}) => ({ selectedName: NEW, newName: 'Demo Anna', ...extra });
const different = extra => input({ identityChoice: 'different', identityBase: 'Demo Anna', identityDetail: 'Karla', identityConfirmedName: 'Demo Anna (Karla)', ...extra });
test('identity conflict requires a choice before resolving an existing typed name', () => {
 const r=rules.resolve(input(), ['Demo Anna'], []); assert.equal(r.code,'NAME_CONFLICT'); assert.equal(r.baseName,'Demo Anna');
});
test('identity comparison normalizes case whitespace and Unicode accents', () => {
 assert.equal(rules.resolve(input({newName:'  DEMO   ANNA '}),['Demo Anna'],[]).code,'NAME_CONFLICT');
 assert.equal(rules.resolve(input({newName:'Demo A\u030anna'}),['Demo Ånna'],[]).code,'NAME_CONFLICT');
});
test('new unique name needs no identifying detail', () => {
 assert.deepEqual(rules.resolve(input({newName:'Demo Erika'}), ['Demo Anna'], []),{success:true,player:'Demo Erika',isNew:true});
});
test('existing player not registered tonight can be selected without extra prompt', () => {
 assert.equal(rules.resolve({selectedName:'Demo Anna'},['Demo Anna'],[]).success,true);
});
test('already registered selected player receives the same identity popup contract', () => {
 assert.equal(rules.resolve({selectedName:'Demo Anna'},['Demo Anna'],['Demo Anna']).code,'NAME_CONFLICT');
});
test('thats me reuses existing player and never creates a second master identity', () => {
 assert.deepEqual(rules.resolve(input({identityChoice:'existing',identityBase:'Demo Anna'}),['Demo Anna'],[]),{success:true,player:'Demo Anna',isNew:false});
});
test('thats me blocks a second registration tonight', () => {
 assert.equal(rules.resolve(input({identityChoice:'existing',identityBase:'Demo Anna'}),['Demo Anna'],['Demo Anna']).code,'ALREADY_REGISTERED');
});
test('different person gets a distinct confirmed display name', () => {
 assert.deepEqual(rules.resolve(different(),['Demo Anna'],['Demo Anna']),{success:true,player:'Demo Anna (Karla)',isNew:true});
});
test('different person must confirm the exact proposed display name', () => {
 assert.equal(rules.resolve(different({identityConfirmedName:''}),['Demo Anna'],[]).code,'CONFIRM_NAME');
 assert.equal(rules.resolve(different({identityConfirmedName:'Demo Karla Anna'}),['Demo Anna'],[]).code,'CONFIRM_NAME');
});
test('blank excessive or unsafe detail is rejected', () => {
 for(const detail of ['', ' ', 'K'.repeat(61), '(Karla)', '<img>', '=Karla']) assert.equal(rules.resolve(different({identityDetail:detail}),['Demo Anna'],[]).code,'INVALID_DETAIL');
});
test('reused identifying detail is rejected even with case differences', () => {
 assert.equal(rules.resolve(different(),['Demo Anna','DEMO ANNA (KARLA)'],[]).code,'DETAIL_IN_USE');
});
test('stale or forged conflict bases are rejected', () => {
 assert.equal(rules.resolve(different({identityBase:'Demo Björn'}),['Demo Anna'],[]).code,'STALE_IDENTITY');
 assert.equal(rules.resolve(different({newName:'Demo Erika'}),['Demo Anna'],[]).code,'STALE_IDENTITY');
});
test('ambiguous identical master rows require organiser help', () => {
 assert.equal(rules.resolve(input(),['Demo Anna','DEMO ANNA'],[]).code,'AMBIGUOUS_NAME');
});
test('unknown selections and invalid identity choices cannot create players', () => {
 assert.equal(rules.resolve({selectedName:'Unknown'},['Demo Anna'],[]).code,'UNKNOWN_PLAYER');
 assert.equal(rules.resolve(input({identityChoice:'yes'}),['Demo Anna'],[]).code,'INVALID_CHOICE');
});

function dialogHarness() {
 const listeners={};
 const document={activeElement:null,addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]};
 class Element {
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.hidden=false;this.textContent='';this.value='';this.className='';}
  appendChild(e){e.parent=this;this.children.push(e);return e;}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,f){this.listeners[k]=f;}
  emit(k,event={}){return this.listeners[k]?.({target:this,...event});}
  remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}
  focus(){document.activeElement=this;}
 }
 document.body=new Element('body');document.createElement=tag=>new Element(tag);
 const context=vm.createContext({document});
 for(const file of ['name-resolution.js','identity-dialog.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/js',file),'utf8'),context);
 const dialog=vm.runInContext('BeautyIdentityDialog',context);
 const find=cls=>{const walk=e=>[e,...e.children.flatMap(walk)];return walk(document.body).find(e=>e.className===cls);};
 return {document,listeners,dialog,find,context};
}
const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
test('identity dialog reveals detail only after choosing a different person', async()=>{
 const h=dialogHarness();const p=h.dialog.open({code:'NAME_CONFLICT',baseName:'Demo Anna'});
 assert.equal(h.find('identity-detail-area').hidden,true);
 h.find('identity-dialog').children.find(e=>e.textContent==='JAG ÄR EN ANNAN PERSON').emit('click');
 assert.equal(h.find('identity-detail-area').hidden,false);
 assert.equal(h.document.activeElement,h.find('identity-detail'));
 h.find('identity-cancel').emit('click');assert.equal(await p,null);
});
test('identity dialog requires review then explicit confirmation before sending detail', async()=>{
 const h=dialogHarness();let calls=0,created=[];
 const send=async data=>{calls++;const r=rules.resolve(data,['Demo Anna'],[]);if(r.success)created.push(r.player);return r;};
 const p=h.dialog.submit(send,input());await settle();
 h.find('identity-dialog').children.find(e=>e.textContent==='JAG ÄR EN ANNAN PERSON').emit('click');
 h.find('identity-detail').value='Karla';h.find('identity-detail').emit('input');
 const proceed=h.find('identity-detail-area').children.find(e=>e.tag==='button');
 proceed.emit('click');assert.equal(calls,1);assert.deepEqual(created,[]);assert.equal(proceed.textContent,'BEKRÄFTA');
 assert.match(h.find('identity-preview').textContent,/Demo Anna \(Karla\)/);
 proceed.emit('click');const r=await p;assert.equal(r.player,'Demo Anna (Karla)');assert.equal(calls,2);assert.deepEqual(created,['Demo Anna (Karla)']);
});
test('editing the detail after review requires confirmation again', async()=>{
 const h=dialogHarness();const p=h.dialog.open({code:'NAME_CONFLICT',baseName:'Demo Anna'});
 const input=h.find('identity-detail');input.value='Karla';
 const proceed=h.find('identity-detail-area').children.find(e=>e.tag==='button');proceed.emit('click');
 input.value='Karin';input.emit('input');assert.equal(proceed.textContent,'FORTSÄTT');
 proceed.emit('click');assert.match(h.find('identity-preview').textContent,/Karin/);
 h.find('identity-cancel').emit('click');await p;
});
test('identity dialog thats me returns the existing choice with canonical base', async()=>{
 const h=dialogHarness();const p=h.dialog.open({code:'NAME_CONFLICT',baseName:'Demo Anna'});
 h.find('identity-dialog').children.find(e=>e.textContent==='DET ÄR JAG').emit('click');
 assert.equal((await p).identityChoice,'existing');
});
for(const action of ['cancel','close','escape','backdrop']) test('identity dialog '+action+' cancels without resubmission',async()=>{
 const h=dialogHarness();let calls=0;
 const p=h.dialog.submit(async()=>{calls++;return {code:'NAME_CONFLICT',baseName:'Demo Anna'};},input());await settle();
 if(action==='cancel')h.find('identity-cancel').emit('click');
 if(action==='close')h.find('identity-close').emit('click');
 if(action==='escape')h.listeners.keydown({key:'Escape',preventDefault(){}});
 if(action==='backdrop')h.find('identity-overlay').emit('click');
 assert.equal((await p).code,'CANCELLED');assert.equal(calls,1);assert.equal(h.document.body.children.length,0);
});
test('identity submission never retries a transport failure',async()=>{
 const h=dialogHarness();let calls=0;await assert.rejects(h.dialog.submit(async()=>{calls++;throw new Error('Offline');},input()),/Offline/);assert.equal(calls,1);
});
test('identity dialog restores focus and traps keyboard tabbing',async()=>{
 const h=dialogHarness();const previous=h.document.createElement('button');previous.focus();
 const p=h.dialog.open({code:'NAME_CONFLICT',baseName:'Demo Anna'});
 const first=h.find('identity-close'),last=h.find('identity-cancel');
 first.focus();h.listeners.keydown({key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(h.document.activeElement,last);
 h.listeners.keydown({key:'Tab',shiftKey:false,preventDefault(){}});assert.equal(h.document.activeElement,first);
 first.emit('click');await p;assert.equal(h.document.activeElement,previous);
});

function candidateHarness(project) {
 const mutations=[];const master=['Demo Anna'];const tonight=['Demo Anna'];
 const sheet=(name,values)=>({getLastRow:()=>values.length+1,getRange:()=>({getDisplayValues:()=>values.map(v=>name==="TONIGHT'S PLAYERS"?[v,'']:[v])}),appendRow:row=>mutations.push(row)});
 const sheets={"PLAYER'S MASTER LIST":sheet('master',master),"TONIGHT'S PLAYERS":sheet("TONIGHT'S PLAYERS",tonight),'Form responses 2':sheet('responses',[])};
 const context=vm.createContext({console,Date,SpreadsheetApp:{openById:id=>{assert.equal(id,'1LktDD_A1Y6MyjBxyAGzKfAxHU4oc4cqrMzVjtAQZkBo');return {getSheetByName:n=>sheets[n]};},flush(){}},module:{exports:{}}});
 const file=path.join(__dirname,'../apps-script/registration-identity-candidate',project,'Code.js');
 vm.runInContext(fs.readFileSync(file,'utf8'),context);
 context.addPlayerToMasterList_=name=>master.push(name);
 context.updatePlayerStatusData_=()=>{};context.syncTonightStatusDisplay_=()=>{};
 return {context,mutations,master,call:data=>context.submitRegistrationIdentityCandidate_({consent:'JA, JAG GODKÄNNER',message:'test',source:'TEST',...data})};
}
for(const project of ['remote-app','automatic-nakka']) {
 test(project+' candidate gate blocks registration before any service access',()=>{
  const h=candidateHarness(project);h.context.SpreadsheetApp.openById=()=>{throw new Error('Must not access');};assert.equal(h.context.submitRegistration(input()).code,'BLOCKED');
 });
 test(project+' candidate conflict preflight performs no mutation',()=>{
  const h=candidateHarness(project);assert.equal(h.call(input()).code,'NAME_CONFLICT');assert.equal(h.mutations.length,0);assert.deepEqual(h.master,['Demo Anna']);
 });
 test(project+' candidate thats me blocks duplicate without mutation',()=>{
  const h=candidateHarness(project);assert.equal(h.call(input({identityChoice:'existing',identityBase:'Demo Anna'})).code,'ALREADY_REGISTERED');assert.equal(h.mutations.length,0);
 });
 test(project+' candidate saves only distinct confirmed name preserving original identity',()=>{
  const h=candidateHarness(project);const r=h.call(different());assert.equal(r.success,true);assert.equal(r.player,'Demo Anna (Karla)');assert.equal(h.mutations.length,1);assert.equal(h.mutations[0][2],'Demo Anna (Karla)');assert.deepEqual(h.master,['Demo Anna','Demo Anna (Karla)']);
 });
 test(project+' candidate invalid confirmation cannot mutate Sheets',()=>{
  const h=candidateHarness(project);assert.equal(h.call(different({identityConfirmedName:''})).code,'CONFIRM_NAME');assert.equal(h.mutations.length,0);
 });
}
for(const [project,filename] of [['remote-app','RemoteRegistration.html'],['automatic-nakka','Kiosk.html'],['automatic-nakka','RemoteRegistration.html']]) {
 test(project+'/'+filename+' actual submit handler resolves collision before candidate save',async()=>{
  const h=dialogHarness(),server=candidateHarness(project);let successName='',errorText='';
  const ids={playerName:{value:NEW},newPlayerName:{value:'Demo Anna'},message:{value:'hello'},submitButton:{disabled:false}};
  h.document.getElementById=id=>ids[id];h.document.querySelector=()=>({value:'NEJ, JAG GODKÄNNER INTE'});
  h.context.NEW_PLAYER_OPTION=NEW;h.context.hideError=()=>{};h.context.showError=text=>errorText=text;h.context.showSuccess=name=>successName=name;
  h.context.google={script:{get run(){let ok,bad;const rpc={withSuccessHandler(fn){ok=fn;return rpc;},withFailureHandler(fn){bad=fn;return rpc;},submitRegistration(data){try{ok(server.call(data));}catch(error){bad(error);}}};return rpc;}}};
  const html=fs.readFileSync(path.join(__dirname,'../apps-script/registration-identity-candidate',project,filename),'utf8');
  const start=html.indexOf('async function submitForm()');const end=html.indexOf('function showSuccess(',start);
  vm.runInContext(html.slice(start,end),h.context);
  const pending=h.context.submitForm();await settle();assert.equal(server.mutations.length,0);
  h.find('identity-dialog').children.find(e=>e.textContent==='JAG ÄR EN ANNAN PERSON').emit('click');
  h.find('identity-detail').value='Karla';h.find('identity-detail').emit('input');
  const confirm=h.find('identity-detail-area').children.find(e=>e.tag==='button');confirm.emit('click');assert.equal(server.mutations.length,0);confirm.emit('click');
  await pending;assert.equal(errorText,'');assert.equal(successName,'Demo Anna (Karla)');assert.equal(server.mutations.length,1);
  assert.equal(server.mutations[0][3],'NEJ, JAG GODKÄNNER INTE');assert.equal(ids.submitButton.disabled,false);
 });
}
for(const project of ['remote-app','automatic-nakka']) test(project+' candidate disables Form and Nakka integrations and is owner-only',()=>{
 const h=candidateHarness(project);
 assert.equal(h.context.syncMasterListToGoogleForm().skipped,true);
 assert.equal(h.context.registerPlayerWithN01_().skipped,true);
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps-script/registration-identity-candidate',project,'appsscript.json')));
 assert.equal(manifest.webapp.access,'MYSELF');assert.equal(manifest.webapp.executeAs,'USER_ACCESSING');
 assert.deepEqual(manifest.oauthScopes,['https://www.googleapis.com/auth/spreadsheets']);
});
test('remote and kiosk preserve shared Swedish identity sources while Hub loads English derivatives',()=>{
 const rulesSource=fs.readFileSync(path.join(__dirname,'../public/js/name-resolution.js'),'utf8');
 const uiSource=fs.readFileSync(path.join(__dirname,'../public/js/identity-dialog.js'),'utf8');
 for(const [project,file] of [['remote-app','RemoteRegistration.html'],['automatic-nakka','Kiosk.html'],['automatic-nakka','RemoteRegistration.html']]){
  const html=fs.readFileSync(path.join(__dirname,'../apps-script/registration-identity-candidate',project,file),'utf8');
  assert(html.includes(rulesSource));assert(html.includes(uiSource));
  for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
 }
 for(const file of ['index.html','preview.html']){
  const html=fs.readFileSync(path.join(__dirname,'../public',file),'utf8');
  assert(html.indexOf('js/name-resolution-en.js')>=0 && html.indexOf('js/name-resolution-en.js')<html.indexOf('js/hub-services.js'));
  assert(html.indexOf('js/identity-dialog-en.js')>=0 && html.indexOf('js/identity-dialog-en.js')<html.indexOf('js/app.js'));
 }
});
