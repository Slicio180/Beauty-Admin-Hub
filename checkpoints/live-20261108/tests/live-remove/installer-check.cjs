const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {prepare,normalize,ADDITIONS}=require('../Beauty-LIVE-Removal.cjs');
const baseline=JSON.parse(fs.readFileSync('live-register/prepared.json')).files;
test('installer preserves registration, native status, manifest and extra diagnostic',()=>{
 const before=structuredClone(baseline);before.find(f=>f.name==='LiveStatus').source+='\n// Native verified source\n';before.push({name:'LiveLayoutCheck',type:'SERVER_JS',source:'function beautyLiveLayoutCheck(){}'});
 const after=prepare(before);
 for(const file of before.filter(f=>!['LiveHub','LiveHubView','LiveLoginAuth'].includes(f.name)))assert.equal(normalize([after.find(a=>a.name===file.name)]),normalize([file]));
 assert.ok(after.find(f=>f.name==='LiveLoginAuth').source.includes('6 * 60 * 60 * 1000'));
 assert.equal(after.length,before.length+1);assert.equal(normalize(prepare(after)),normalize(after));
});
test('installer rejects changed registration/login/Hub and unknown files',()=>{
 for(const name of ['LiveRegister','LiveLoginAuth','LiveHub']){const before=structuredClone(baseline);before.find(f=>f.name===name).source+='\nchanged';assert.throws(()=>prepare(before),/differs/);}
 assert.throws(()=>prepare([...baseline,{name:'Unknown',type:'SERVER_JS',source:''}]),/Unexpected/);
});
test('routes authenticate, require fixed context, and block status/registration during removal',()=>{
 let pending=false,calls=[];const c={beautyLiveLoginGuard_:()=>{},beautyHubAuthRequire_:token=>{if(token!=='valid')throw Error('auth');},PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='BEAUTY_LIVE_REMOVE_PENDING'&&pending?'{}':null})},beautyLiveRemove_:(action,input,token)=>{calls.push({action,input,token});return {success:true};}};
 vm.createContext(c);vm.runInContext(ADDITIONS.find(f=>f.name==='LiveHub').source,c);
 assert.equal(c.beautyHubTest('removepreview',{_context:'live-20261109'},'bad').code,'AUTH_REQUIRED');
 assert.equal(c.beautyHubTest('removesave',{_context:'wrong'},'valid').code,'STALE_EVENT');assert.equal(calls.length,0);
 assert.equal(c.beautyHubTest('removepreview',{_context:'live-20261109',player:'Person'},'valid').success,true);assert.equal(calls[0].action,'preview');assert.ok(!('_context' in calls[0].input));
 pending=true;for(const action of ['register','status'])assert.equal(c.beautyHubTest(action,{_context:'live-20261109'},'valid').code,'REMOVE_REVIEW');
});
test('trash button enabled while event setup and casting remain gated',()=>{
 const html=ADDITIONS.find(f=>f.name==='LiveHubView').source;assert.ok(html.includes('if (BeautyHubServices.statusWrites && window.BeautyPlayerRemoval)'));assert.ok(html.includes('Remove player from event'));assert.ok(html.includes('The permanent master-list player and league profile are kept.'));assert.ok(html.includes("['Live','Instructions']"));assert.ok(html.includes("'poolPlannerButton','eventControlNavButton'"));
});
