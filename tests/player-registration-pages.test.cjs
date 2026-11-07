const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base='apps-script/registration-identity-test/remote-app/';
for(const [file,rpc]of [['RemoteRegistration.html','submitRegistration'],['KioskTest.html','submitKioskRegistration']]){
 const html=fs.readFileSync(base+file,'utf8');
 test(file+' loads minimal registration context and hides form on wrong event day',()=>{
  let ok,loaded;const nodes={loading:{style:{},innerText:''},formArea:{style:{}},registrationEventLabel:{textContent:''}};
  const runner={withSuccessHandler:f=>{ok=f;return runner;},withFailureHandler:()=>runner,getTestRegistrationContext:()=>{}};
  const c=vm.createContext({document:{getElementById:id=>nodes[id]},google:{script:{run:runner}},buildPlayerList:n=>loaded=n});
  const a=html.indexOf('function loadPlayers()'),b=html.indexOf('function buildPlayerList(',a);vm.runInContext("let registrationEventDate='';\n"+html.slice(a,b),c);
  c.loadPlayers();ok({success:true,eventDate:'2026-10-27',eventTitle:'AIK Måndagsdartarna 2026-10-27',registrationAvailable:true,names:['Anna']});assert.deepEqual(loaded,['Anna']);assert.equal(nodes.formArea.style.display,'block');assert.equal(nodes.registrationEventLabel.textContent,'AIK Måndagsdartarna 2026-10-27');
  c.loadPlayers();ok({success:true,registrationAvailable:false,eventDate:'2026-10-28',names:['Anna']});assert.equal(nodes.formArea.style.display,'none');assert.match(nodes.loading.innerText,/SPELDATUMET/);
 });
 test(file+' actual submit sends date through its own RPC with no client source or staff credential',async()=>{
  let pending,captured,registered;const ids={playerName:{value:'Anna'},newPlayerName:{value:''},message:{value:'hello'},submitButton:{disabled:false,innerText:''}};
  const runner={withSuccessHandler:f=>{pending=f;return runner;},withFailureHandler:()=>runner,[rpc]:data=>{captured=data;pending({success:true,player:'Anna',nakka:{entryConfirmed:true}});}};
  const c=vm.createContext({document:{getElementById:id=>ids[id],querySelector:()=>({value:'JA, JAG GODKÄNNER'})},google:{script:{run:runner}},hideError(){},showError:s=>{throw Error(s);},showSuccess:(p,n)=>registered={p,n},BeautyIdentityDialog:{submit:(send,data)=>send(data)}});
  const a=html.indexOf('async function submitForm()'),b=html.indexOf('function showSuccess(',a);vm.runInContext(html.slice(html.indexOf('function beautyPlayerError('),html.indexOf('function loadPlayers()'))+"const NEW_PLAYER_OPTION='MITT NAMN FINNS INTE I LISTAN';let registrationEventDate='2026-10-27';let registrationEventContext='event-revision-1';\n"+html.slice(a,b),c);
  await c.submitForm();assert.equal(captured.eventDate,'2026-10-27');assert.equal(captured._context,'event-revision-1');assert.equal(captured.selectedName,'Anna');assert.equal(captured.source,undefined);assert.equal(captured.token,undefined);assert.equal(registered.p,'Anna');assert.equal(registered.n.entryConfirmed,true);assert.equal(ids.submitButton.disabled,false);
 });
 test(file+' success distinguishes saved registration from Nakka attention and keeps five-second next-player return',()=>{
  const ids={registrationOutcome:{textContent:''},registeredPlayer:{textContent:''},registrationScreen:{style:{}},successScreen:{style:{}}};let timer,delay;
  const c=vm.createContext({document:{getElementById:id=>ids[id]},window:{scrollTo(){}},setTimeout:(fn,ms)=>{timer=fn;delay=ms;},nextPlayer:()=>{}});
  const a=html.indexOf('function showSuccess('),b=html.indexOf('function nextPlayer()',a);vm.runInContext(html.slice(a,b),c);
  c.showSuccess('Anna',{entryConfirmed:true});assert.equal(ids.registeredPlayer.textContent,'Anna');assert.match(ids.registrationOutcome.textContent,/bekräftad/);assert.equal(delay,5000);assert.equal(timer,c.nextPlayer);
  c.showSuccess('Anna',{entryConfirmed:false});assert.match(ids.registrationOutcome.textContent,/Anmäl dig inte igen/);assert.equal(ids.successScreen.style.display,'block');assert.equal(ids.registrationScreen.style.display,'none');
 });
 test(file+' Swedish error boundary preserves identity fields and never exposes unknown server prose',()=>{
  const c=vm.createContext({});vm.runInContext(html.slice(html.indexOf('function beautyPlayerError('),html.indexOf('function loadPlayers()')),c);
  const conflict={success:false,code:'INVALID_DETAIL',baseName:'English Name',error:'Enter your nickname'};const mapped=c.beautyPlayerResult(conflict);assert.equal(mapped.code,conflict.code);assert.equal(mapped.baseName,'English Name');assert.match(mapped.error,/Skriv ett giltigt/);assert.equal(conflict.error,'Enter your nickname');
  const unknown=c.beautyPlayerResult({success:false,code:'UNKNOWN_SERVICE_CODE',error:'Internal raw English error'});assert.match(unknown.error,/Kontrollera med arrangören innan du försöker igen/);assert.doesNotMatch(unknown.error,/Internal|English/);const saved={success:true,player:'English Name',nakka:{entryConfirmed:true}};assert.equal(c.beautyPlayerResult(saved),saved);
 });
 test(file+' context-load failure shows Swedish help instead of raw service errors',()=>{
  let failed,shown;const nodes={loading:{style:{}},formArea:{style:{}}};const runner={withSuccessHandler(){return runner;},withFailureHandler(fn){failed=fn;return runner;},getTestRegistrationContext(){}};const c=vm.createContext({document:{getElementById:id=>nodes[id]},google:{script:{run:runner}},showError:text=>shown=text});const a=html.indexOf('function loadPlayers()'),b=html.indexOf('function buildPlayerList(',a);vm.runInContext(html.slice(a,b),c);c.loadPlayers();failed(Error('raw English error'));assert.match(shown,/Spelarlistan kunde inte hämtas/);assert.doesNotMatch(shown,/raw English/);assert.equal(nodes.formArea.style.display,'none');
 });

}
test('Central player TEST pages preserve Swedish shared identity modules and parse all inline scripts',()=>{
 const rules=fs.readFileSync('public/js/name-resolution.js','utf8'),dialog=fs.readFileSync('public/js/identity-dialog.js','utf8');
 for(const f of ['RemoteRegistration.html','KioskTest.html']){const h=fs.readFileSync(base+f,'utf8');assert.ok(h.includes(rules));assert.ok(h.includes(dialog));for(const s of h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);}
});
