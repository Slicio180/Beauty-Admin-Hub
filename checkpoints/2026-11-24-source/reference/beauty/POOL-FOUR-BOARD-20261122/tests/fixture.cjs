const {fixture,clone}=require('../../POOL-RESTORATION-20261122/tests/fixture.cjs');
const fs=require('fs'),vm=require('vm'),path=require('path');
function setup(){
 const f=fixture(6),{c,p}=f;const logs=[],flags={owner:true,scope:true,stable:1,source:1,marker:1,trigger:'9153037705028829184'};
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../candidate/BeautyPoolFourBoardFixture20261122.gs'),'utf8'),c);
 const config=c.beautyPoolFourConfig_(),prop=c.PropertiesService.getScriptProperties();prop.getProperties=()=>clone(p);c.PropertiesService.getScriptProperties=()=>prop;
 c.console={log:v=>logs.push(JSON.parse(v))};
 Object.assign(c,{
  beautyBackgroundOwner_:()=>{if(!flags.owner)throw Error('OWNER_REQUIRED');},
  beautyResilienceScope_:()=>{if(!flags.scope)throw Error('CONTEXT_CHANGED');return clone(f.context);},
  beautyBackgroundReadConfig_:()=>({triggerUid:flags.trigger}),
  beautyResilienceStable_:()=>({sourceHash:flags.source,historyHash:flags.stable}),
  beautyResilienceConfig_:()=>({outageKey:'outage',terminateKey:'termination',timeoutKey:'timeout'}),
  beautyResilienceReadMarker_:k=>({state:k==='termination'?'REVIEW':'VERIFIED'})
 });
 p.outage='outage';p.termination='termination';p.timeout='timeout';
 config.players.forEach(([name,lpid,tpid],i)=>{f.data.players[i].player=name;Object.assign(f.profiles[i],{name,lpid,average:null});Object.assign(f.event.entry_list[i],{name,lpid,tpid});});
 f.draw();const r=f.saved(),byName=new Map(r.draw.roster.map(x=>[x.name,x]));
 r.draw.seed=config.seed;r.draw.frozenAt=config.frozen;
 [[4,3,0],[1,5,2]].forEach((ids,i)=>r.draw.pools[i].players=ids.map(j=>clone(byName.get(config.players[j][0]))));
 r.draftChoices={boards:'1, 2, 3',plannedBoards:[1,2,3],preferredSize:3,scheme:'preferredPlan',format:'preserve',boardChoices:{0:{count:1,boards:[2]},1:{count:1,boards:[2]}},cardLabels:{0:{board:2,group:7,manualGroup:true},1:{board:2,group:2}}};
 f.overwrite(r);
 const baseline=()=>c.beautyBackupSixPool20261122();
 const four=()=>{
  f.data.players[4].status=f.data.players[5].status='OUT';flags.source=4;
  const loaded=f.load();if(!loaded.success)throw Error(loaded.error);
  const draw=f.run('pooldraw',{bindings:JSON.stringify(loaded.mappings.map(({id,lpid,tpid})=>({id,lpid,tpid}))),reviewed:'true',sizes:'[4]',draftTicket:loaded.draftTicket,
   choices:JSON.stringify({boards:'1, 2, 3',plannedBoards:[1,2,3],preferredSize:4,scheme:'preferredPlan',format:'preserve',boardChoices:{},cardLabels:{}})});
  if(!draw.success)throw Error(draw.error);const saved=f.saved();saved.draftChoices.boardChoices={0:{count:2,boards:[1,3]}};saved.draftChoices.cardLabels={0:{board:1,group:8,manualGroup:true}};f.overwrite(saved);
  c.beautyCaptureFourPool20261122();return clone(f.saved());
 };
 const statusesBack=()=>{f.data.players[4].status=f.data.players[5].status='IN';flags.source=1;};
 return {...f,flags,logs,baseline,four,statusesBack,config,restore:()=>c.beautyRestoreSixPool20261122()};
}
module.exports={setup,clone};
