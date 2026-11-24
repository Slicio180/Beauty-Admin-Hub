const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {fixture:workerFixture,clone,hash}=require('../../BACKGROUND-CLAIM-REVIEW-20261122/tests/fixture.cjs');
function fixture(){
 const f=workerFixture();f.enable();const workerKey=f.config.key,cfg=JSON.parse(f.props[workerKey]);
 cfg.triggerUid='9153037705028829184';f.props[workerKey]=JSON.stringify(cfg);
 f.triggers[0]={getUniqueId:()=>cfg.triggerUid,getHandlerFunction:()=>f.config.handler,getEventType:()=> 'CLOCK'};
 const services=Object.fromEntries(['beautyRegistrationRecoveryPrefix_','beautyRegistrationRecoveryKey_','beautyRegistrationRecoveryResume_'].map(k=>[k,f.c[k]]));
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../../BACKGROUND-CLAIM-REVIEW-20261122/candidate/HubTestAttention.gs'),'utf8'),f.c);Object.assign(f.c,services);
 const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'../../BACKGROUND-CLAIM-REVIEW-20261122/evidence/native-final.json'),'utf8')).report;
 const obs={context:clone(f.context),roster:{date:f.context.date,rows:prior.hubPlayers.map(r=>({name:r.player||r.name,status:r.status}))},
  event:clone(prior.event),stats:{profiles:clone(prior.identities)},stable:clone(prior.currentPreservation)};
 const draft={draw:{seed:1323494965},draftChoices:{preferredSize:3,format:'preserve'}},base={key:'fixture-draft',draft:clone(draft)};
 f.props['unrelated-evidence']='preserve exact';f.props['BEAUTY_NAKKA_TRANSFER_'+f.context.eventId+'_prior']='preserve transfer';
 f.props['registration-prior']=JSON.stringify({version:1,name:'prior',eventId:f.context.eventId,state:'COMPLETE'});
 Object.assign(f.c,{
  beautyPlayerRecoveryKey_:name=>'recovery-'+name,beautyHubTransferTarget_:()=>f.context.eventId,beautyHubEventScopeId_:()=>f.context.eventId,
  beautyHubRegistrationDiagnosticRead_:()=>null,beautyContextToken_:()=>f.context.revision,beautyHubActiveTestTarget_:()=>({id:f.context.eventId,title:f.context.title}),
  beautyHubNakkaDate_:()=>({date:f.context.date}),beautyPoolHash_:hash,
  beautyPoolFourScope_:()=>clone(f.context),beautyPoolFourObserve_:()=>clone(obs),beautyPoolFourGet_:()=>clone(base),
  beautyPoolFourDraft_:()=>({raw:'immutable draft pointer',value:clone(draft)}),beautyPoolFourBaseline_:()=>{},beautyPoolFourCanonical_:clone,
  beautyPoolEntries_:()=>clone(prior.entries),beautyHubSpreadsheet_:()=>({getSheetByName:()=>({getLastRow:()=>20})}),
  getBeautyHubData_:()=>({eventDate:f.context.date,players:obs.roster.rows.map(x=>({player:x.name,status:x.status}))})
 });
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../candidate/BeautyExhaustionFixture20261122.gs'),'utf8'),f.c);
 const getProps=f.c.PropertiesService.getScriptProperties;
 let hook=()=>{};
 f.c.PropertiesService.getScriptProperties=()=>{const p=getProps();return {...p,
  setProperty(k,v){hook('set',k,v);if(Buffer.byteLength(v)>8500)throw Error('PROPERTY_TOO_LARGE');return p.setProperty(k,v);},
  deleteProperty(k){hook('delete',k);f.writes.push({key:k,delete:true});delete f.props[k];}};};
 const cfg2=f.c.beautyExhaustionConfig_(),keys=f.c.beautyExhaustionKeys_(f.context);
 const marker=()=>JSON.parse(f.props[cfg2.key]||'null');
 const seed=()=>f.c.beautySeedExhaustionFixture20261122();
 const finish=()=>{seed();delete f.props['registration-prior'];f.tick();f.props['registration-prior']=JSON.stringify({version:1,name:'prior',eventId:f.context.eventId,state:'COMPLETE'});};
 return {...f,obs,draft,base,fixtureConfig:cfg2,keys,marker,seed,finish,hook:fn=>hook=fn,
  read:()=>f.c.beautyReadExhaustionFixture20261122(),capture:()=>f.c.beautyCaptureExhaustionFixture20261122(),
  retire:()=>f.c.beautyRetireExhaustionFixture20261122(),restore:()=>f.c.beautyRestoreExhaustionArchive20261122()};
}
module.exports={fixture,clone,hash};
