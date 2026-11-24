const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../candidate/BeautyAlternateCaseB20261122.gs'),'utf8');
const clone=v=>JSON.parse(JSON.stringify(v));
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const ctx={console,Date,Set,beautyPoolHash_:hash,beautyPoolEqual_:(a,b)=>hash(a)===hash(b),beautyPoolCopy_:clone,beautyPoolProjection_:v=>{v=clone(v);delete v.updateTime;return v;}};
vm.createContext(ctx);vm.runInContext(source,ctx);
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function core(options={}){
 const base={context:{eventId:'t_DsKC_9692'},event:{updateTime:1},plan:{s2_setting:{tournament:1}}},calls=[];let j=null,after=false;
 const io={guard:()=>{calls.push('guard');if(options.guard)throw Error('guard');},journal:()=>j,base:()=>base,observe:()=>({event:after?{updateTime:2}:{updateTime:1}}),hash,now:()=> '2026-11-22T16:00:00Z',before:()=>{if(options.changed)throw Error('changed');},save:(next,prior)=>{assert.equal(j,prior);calls.push('save:'+next.state);j=next;if(options.saveFail)throw Error('storage');},update:()=>{assert.equal(j.state,'ATTEMPTED');calls.push('update');after=true;if(options.writeFailure)throw Error('uncertain');},verify:()=>{if(options.readbackFailure)throw Error('readback');},report:(j,b,o,n)=>({state:j.state,writes:n}),read:()=>({state:j.state,writes:0})};
 return {io,calls,getJournal:()=>j};
}
test('intent persists before exactly one provider update',()=>{const e=core(),r=ctx.beautyAltBApplyCore_(e.io);assert.equal(r.state,'VERIFIED');assert.equal(r.writes,1);assert.deepEqual(e.calls,['guard','save:ATTEMPTED','update','save:VERIFIED']);});
test('verified repeat reads without another provider write',()=>{const e=core();ctx.beautyAltBApplyCore_(e.io);assert.equal(ctx.beautyAltBApplyCore_(e.io).writes,0);assert.equal(e.calls.filter(c=>c==='update').length,1);});
for(const k of ['guard','changed','saveFail'])test(k+' failure blocks external update',()=>{const e=core({[k]:true});assert.throws(()=>ctx.beautyAltBApplyCore_(e.io));assert(!e.calls.includes('update'));});
for(const k of ['writeFailure','readbackFailure'])test(k+' retains attempt and forbids replay',()=>{const e=core({[k]:true});assert.throws(()=>ctx.beautyAltBApplyCore_(e.io));assert.equal(e.getJournal().state,'ATTEMPTED');assert.throws(()=>ctx.beautyAltBApplyCore_(e.io),/NO_RETRY/);assert.equal(e.calls.filter(c=>c==='update').length,1);});
const stage={tournament:1,t_player_count:4,t3:0,limit:1,limit_leg_count:2,drawMode:0,startScore:501,match_type:'01'};
const before={tdid:'t_DsKC_9692',status:20,private:1,entry_lock:1,updateTime:1,t_setting:stage,rr_table:[['','',''],['','','']],entry_list:[{name:'synthetic'}]};
test('plan changes only second-stage settings, retaining match rules',()=>{const p=clone(ctx.beautyAltBPlan_(before));assert.deepEqual(Object.keys(p),['s2_setting']);assert.deepEqual(p.s2_setting,{...stage,t_player_count:2});assert.equal(before.t_setting.t_player_count,4);});
for(const change of [{s2_setting:{tournament:1}},{t_setting:{...stage,limit_leg_count:3}},{t_setting:{...stage,startScore:301}}])test('unexpected format blocked: '+JSON.stringify(change),()=>assert.throws(()=>ctx.beautyAltBPlan_({...before,...change}),/STAGE_BASELINE/));
const base={event:before,plan:clone(ctx.beautyAltBPlan_(before)),sheetHash:'sheets',rosterSignature:'roster'};
test('readback accepts exact second stage plus new update time',()=>ctx.beautyAltBVerifyAfter_(base,{event:{...before,...base.plan,updateTime:2},sheetHash:'sheets',roster:{signature:'roster'}}));
for(const change of [{status:30},{private:0},{entry_list:[]},{rr_table:[['player']]}])test('unexpected provider side effect rejected: '+Object.keys(change)[0],()=>assert.throws(()=>ctx.beautyAltBVerifyAfter_(base,{event:{...before,...base.plan,...change,updateTime:2},sheetHash:'sheets',roster:{signature:'roster'}}),/READBACK_REVIEW/));
for(const change of [{sheetHash:'changed'},{roster:{signature:'changed'}}])test('local preservation mismatch rejected: '+Object.keys(change)[0],()=>assert.throws(()=>ctx.beautyAltBVerifyAfter_(base,{event:{...before,...base.plan,updateTime:2},sheetHash:'sheets',roster:{signature:'roster'},...change}),/READBACK_REVIEW/));
function scope(change={}){
 const c=ctx.beautyAltBConfig_(),props={BEAUTY_EVENT_CONTEXT_V1:JSON.stringify(c.context),BEAUTY_ALTERNATE_FIXTURE_20261122_V1:JSON.stringify({state:'ACTIVE',eventId:c.context.eventId,scriptId:c.scriptId,sheetId:c.context.sheetId,nextContext:JSON.stringify(c.context)}),['BEAUTY_EVENT_WORKBOOK_'+c.context.eventId]:c.context.sheetId};
 Object.assign(ctx,{PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null})},ScriptApp:{getScriptId:()=>change.scriptId||c.scriptId,getProjectTriggers:()=>change.triggers||[]},Session:{getActiveUser:()=>({getEmail:()=>change.active||c.owner}),getEffectiveUser:()=>({getEmail:()=>change.effective||c.owner})},beautyHubTestGuard_:()=>{},beautyPoolDraftContext_:()=>({...c.context,...change.context}),SHEET_ID:c.context.sheetId,beautyHubBaseSheet_:()=>c.context.sheetId});
 if(change.mapping)props['BEAUTY_EVENT_WORKBOOK_'+c.context.eventId]=change.mapping;
 if(change.send)props['BEAUTY_POOL_SEND_'+c.context.eventId]='{}';
 return props;
}
test('exact alternate fixture scope accepted',()=>{scope();assert.equal(ctx.beautyAltBGuard_().context.eventId,'t_DsKC_9692');});
for(const change of [{scriptId:'original'},{active:'other@example.test'},{effective:'other@example.test'},{triggers:[{}]},{context:{eventId:'t_GgaQ_0921'}},{mapping:'original'},{send:true}])test('scope refusal: '+Object.keys(change)[0],()=>{scope(change);assert.throws(()=>ctx.beautyAltBGuard_());});
test('helper exposes no entry, send, start, sheet or trigger mutation',()=>{assert(!/\.setValue\(|\.setValues\(|\.newTrigger\(|\.deleteTrigger\(|entry\/update|tournament\/create|status\s*:\s*30/.test(source));assert.equal((source.match(/beautyHubTransferFetch_\('tournament\/update'/g)||[]).length,1);});
console.log(JSON.stringify({result:'PASS',tests:count,scope:'local refusal and preservation checks; native acceptance pending'}));
