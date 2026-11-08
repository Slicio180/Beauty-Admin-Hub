const assert=require('node:assert/strict'),vm=require('node:vm'),{fix}=require('./fix.cjs'),R=require('../Beauty-Public-Rollout/rollout.cjs');
let files=R.prepared(R.PROJECTS.find(p=>p.key==='hub'),'https://script.google.com/macros/s/test/exec');
for(const [p,f]of [['Beauty-Nakka-Live-Panel','install-panel.cjs'],['Beauty-Compact-Date','compact.cjs'],['Beauty-2.0-Release','cleanup.cjs'],['Beauty-Automatic-Brackets','fix.cjs'],['Beauty-Compact-Settings','fix.cjs'],['Beauty-Linked-Event-Fix','fix.cjs']])files=require('../'+p+'/'+f).fix(files);
(async()=>{let checks=0;for(const panels of [false,true]){
const before=panels?require('../Beauty-Matching-Event-Panels/fix.cjs').fix(files):files,after=fix(before);
assert.deepEqual(after.filter((f,i)=>f.source!==before[i].source).map(f=>f.name),['LiveCastView']);
const html=after.find(f=>f.name==='LiveCastView').source,scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const js of scripts)new vm.Script(js);
const ctx={module:{exports:{}},AbortSignal};vm.createContext(ctx);vm.runInContext(scripts.find(s=>s.includes('root.BeautyNakkaStageFeed=api')),ctx);
const target={eventId:'t_Ig9A_5138',leagueId:'lg_tM2v_3523',eventDate:'2026-11-09'};
const good={tdid:target.eventId,lgid:target.leagueId,title:'AIK MÅNDAGSDARTARNA 2026-11-09',league:0,team_games:0,t_date:Date.parse('2026-11-09T12:00:00Z')/1000,updateTime:1};
for(const [change,valid]of [[{},true],[{league:1},true],[{tdid:'t_old_1234'},false],[{lgid:'lg_other_1234'},false],[{lgid:''},false],[{team_games:1},false],[{t_date:good.t_date+86400},false]]){
let data=null,error=null;const event={...good,...change};
const feed=ctx.module.exports.create({target,fetch:async url=>({ok:true,json:async()=>url.includes('tournament/get?')?{result:0,tournament:event}:{result:0,groups:[]}}),model:{project:r=>({title:r.tournament.title,eventDate:r.tournament.t_date})},onData:d=>data=d,onError:e=>error=e});
await feed.refresh();assert.equal(!!data,valid);assert.equal(!!error,!valid);if(valid){assert.equal(data.title,good.title);assert.equal(data.eventDate,good.t_date);}checks++;}
console.log('PASS real Live feed with '+(panels?'matching':'compact')+' panels; all inline scripts parse');
}console.log(checks+' feed identity checks passed; only LiveCastView changes.');})().catch(e=>{console.error(e);process.exitCode=1;});
