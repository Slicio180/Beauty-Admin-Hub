'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),{fix}=require('./fix.cjs');
const R=require('../Beauty-Public-Rollout/rollout.cjs');
let base=R.prepared(R.PROJECTS.find(p=>p.key==='hub'),'https://script.google.com/macros/s/fixture/exec');
for(const [p,f] of [['Beauty-Nakka-Live-Panel','install-panel.cjs'],['Beauty-Compact-Date','compact.cjs'],['Beauty-2.0-Release','cleanup.cjs'],['Beauty-Automatic-Brackets','fix.cjs'],['Beauty-Compact-Settings','fix.cjs']])base=require('../'+p+'/'+f).fix(base);
let checks=0;
for(const login of [false,true])for(const panels of [false,true]){
 let before=base;if(login)before=require('../Beauty-Login-Text-Fix/cleanup.cjs').fix(before);if(panels)before=require('../Beauty-Matching-Event-Panels/fix.cjs').fix(before);
 const after=fix(before),changed=after.filter((f,i)=>f.source!==before[i].source).map(f=>f.name).sort();assert.deepEqual(changed,['LiveEventContext','LiveHub','LivePlanner','LiveRegister']);
 for(const f of after.filter(f=>f.type==='SERVER_JS'))new vm.Script(f.source);
 const target={eventId:'t_Ig9A_5138',leagueId:'lg_tM2v_3523',date:'2026-11-09',mode:'league'};
 let event;
 const good={tdid:target.eventId,lgid:target.leagueId,title:'AIK MÅNDAGSDARTARNA 2026-11-09',league:0,team_games:0,status:10,admin_id:'verified-admin',t_date:Date.parse('2026-11-09T12:00:00Z')/1000,updateTime:1,rr_setting:{round_robin:1,match_type:'01'},lg_setting:{league:0}};
 const ctx={Date,Utilities:{formatDate:d=>d.toISOString().slice(0,10)},beautyLiveTarget_:()=>target,beautyLiveRegistrationApi_:()=>({tournament:event}),beautyLiveSheetsRead_:()=>({values:[[target.date]]}),beautyLiveDate_:v=>v,UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({tournament:event})})},beautyHubTransferFetch_:()=>({tournament:event}),beautyHubActiveTestTarget_:()=>({id:target.eventId,title:good.title}),beautyHubLeagueId_:()=>target.leagueId,beautyPoolError_:m=>{throw Error(m)},beautyPoolMode_:()=> 'rr',beautyPoolRoster_:()=>({date:target.date}),beautyHubNakkaDate_:()=>({date:target.date})};vm.createContext(ctx);
 const names={LiveEventContext:'beautyLiveContextEvent_',LiveRegister:'beautyLiveRegistrationEvent_',LiveHub:'beautyLiveEventRead_',LivePlanner:'beautyPoolEvent_'};
 for(const [file,name]of Object.entries(names)){
 const source=after.find(f=>f.name===file).source,start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);vm.runInContext(source.slice(start,end<0?undefined:end),ctx);
 const call=()=>ctx[name](name==='beautyLiveContextEvent_'?target:{});
 for(const league of [0,1]){event={...good,league};call();checks++;}
 for(const bad of [{tdid:'t_deleted_0000'},{lgid:'lg_wrong_0000'},{lgid:''},{team_games:1},{t_date:good.t_date+86400}]){event={...good,...bad};assert.throws(call,file+' must reject '+JSON.stringify(bad));checks++;}
 if(file==='LiveEventContext'){event={...good,admin_id:''};assert.throws(call);checks++;}
 if(file==='LiveRegister'||file==='LivePlanner'){event={...good,status:40};assert.throws(call);checks++;}
 }
 for(const file of ['LiveEventContext','LiveRegister','LiveHub']){
 const name=names[file];target.mode='tournament';target.leagueId='';event={...good,lgid:''};ctx[name](file==='LiveEventContext'?target:{});checks++;
 event={...good};assert.throws(()=>ctx[name](file==='LiveEventContext'?target:{}));checks++;
 }
 console.log('PASS source variant: login cleanup='+login+', matching panels='+panels);
}
assert.throws(()=>fix(base.filter(f=>f.name!=='LiveHub')));checks++;
console.log(checks+' identity/registration/planner checks passed; all server files parse; only four intended files change.');
