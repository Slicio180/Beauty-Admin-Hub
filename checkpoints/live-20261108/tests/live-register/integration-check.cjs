const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {prepare,normalize,ADDITIONS}=require('../Beauty-LIVE-Registration.cjs');
const baseline=JSON.parse(fs.readFileSync('live-status/prepared.json')).files;
let checks=0;const test=(name,f)=>{f();checks++;console.log('PASS '+name);};
test('installer preserves native status formatting and diagnostic file',()=>{
 const before=structuredClone(baseline);before.find(f=>f.name==='LiveStatus').source+='\n// Native verified checkpoint\n';before.push({name:'LiveLayoutCheck',type:'SERVER_JS',source:'function beautyLiveLayoutCheck() {}'});
 const after=prepare(before);assert.equal(after.find(f=>f.name==='LiveStatus').source,before.find(f=>f.name==='LiveStatus').source);assert.ok(after.find(f=>f.name==='LiveLayoutCheck'));assert.equal(after.length,before.length+1);assert.equal(normalize(prepare(after)),normalize(after));
});
test('installer refuses changed Hub, changed login and unknown files',()=>{
 for(const name of ['LiveHub','LiveLoginAuth','LivePreflight']){const before=structuredClone(baseline);before.find(f=>f.name===name).source+='\n// changed';assert.throws(()=>prepare(before),/differs/);}
 assert.throws(()=>prepare([...baseline,{name:'Unknown',type:'SERVER_JS',source:''}]),/Unexpected/);
});
test('installer refuses status without native row-limit fix',()=>{const before=structuredClone(baseline);before.find(f=>f.name==='LiveStatus').source=before.find(f=>f.name==='LiveStatus').source.replace('getRange(101, 1','getRange(999, 1');assert.throws(()=>prepare(before),/row-limit/);});
test('manifest retains owner-only access and requests Forms for backup choices',()=>{const m=JSON.parse(ADDITIONS.find(f=>f.name==='appsscript').source);assert.equal(m.webapp.access,'MYSELF');assert.ok(m.oauthScopes.includes('https://www.googleapis.com/auth/forms'));assert.equal(m.oauthScopes.length,3);});
const moduleSource=ADDITIONS.find(f=>f.name==='LiveRegister').source;
test('real transport uses fixed endpoints, RAW append and rejects redirects/errors',()=>{
 let calls=[],status=200,body={result:0};const c={Date,BEAUTY_LIVE_TARGET_:{sheetId:'fixed'},PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='N01_API_USER'?'fixture-user':'fixture-pass'})},Utilities:{base64Encode:v=>Buffer.from(v).toString('base64')},ScriptApp:{getOAuthToken:()=>'fixture-token'},UrlFetchApp:{fetch:(url,options)=>{calls.push({url,options});return {getResponseCode:()=>status,getContentText:()=>JSON.stringify(body)};}}};vm.createContext(c);vm.runInContext(moduleSource,c);
 c.beautyLiveRegistrationApi_('league/entry/update',{lgid:'league',add:[{name:'Person'}]});assert.equal(calls[0].url,'https://push.n01darts.com/api/v1/league/entry/update');assert.equal(calls[0].options.followRedirects,false);assert.equal(calls[0].options.method,'post');
 body={updates:{updatedRows:1}};c.beautyLiveRegistrationAppend_("'Form responses 2'!A:F",[123,'Name','','JA','note','HUB']);assert.match(calls[1].url,/valueInputOption=RAW/);assert.match(calls[1].url,/spreadsheets\/fixed\//);assert.equal(JSON.parse(calls[1].options.payload).values[0][5],'HUB');
 status=302;assert.throws(()=>c.beautyLiveRegistrationAppend_('A:F',[]),/uncertain/);assert.throws(()=>c.beautyLiveRegistrationApi_('league/get'),/failed/);
 status=200;body={result:4};assert.throws(()=>c.beautyLiveRegistrationApi_('league/get'),/confirm/);
});
test('real event gate validates fixed identity, date, singles and unstarted state',()=>{
 const c={Date,BEAUTY_LIVE_TARGET_:{eventId:'event',leagueId:'league',date:'2026-11-09'},Utilities:{formatDate:()=> '2026-11-09'}};vm.createContext(c);vm.runInContext(moduleSource,c);
 const good={tdid:'event',lgid:'league',league:1,team_games:0,status:10,t_date:1794182400};let event={...good};c.beautyLiveRegistrationApi_=()=>({tournament:event});c.beautyLiveRegistrationEvent_();
 for(const patch of [{tdid:'wrong'},{lgid:'wrong'},{status:30},{team_games:1},{league:0},{t_date:0/0}]){event={...good,...patch};assert.throws(()=>c.beautyLiveRegistrationEvent_(),/not open/);}
});
test('RPC authenticates, rejects stale context, and blocks status during pending registration',()=>{
 let calls=0,pending=false;const c={beautyLiveLoginGuard_:()=>{},beautyHubAuthRequire_:token=>{if(token!=='valid')throw Error('auth');},beautyLiveRegister_:(input)=>{calls++;assert.ok(!('_context' in input));return {success:true};},PropertiesService:{getScriptProperties:()=>({getProperty:()=>pending?'{}':null})}};vm.createContext(c);vm.runInContext(ADDITIONS.find(f=>f.name==='LiveHub').source,c);
 assert.equal(c.beautyHubTest('register',{_context:'live-20261109'},'bad').code,'AUTH_REQUIRED');assert.equal(calls,0);
 assert.equal(c.beautyHubTest('register',{_context:'wrong'},'valid').code,'STALE_EVENT');assert.equal(calls,0);
 assert.equal(c.beautyHubTest('register',{_context:'live-20261109'},'valid').success,true);pending=true;assert.equal(c.beautyHubTest('status',{_context:'live-20261109'},'valid').code,'REGISTRATION_REVIEW_REQUIRED');
});
test('Register button enabled; unrelated operation buttons remain gated',()=>{const html=ADDITIONS.find(f=>f.name==='LiveHubView').source;const ids=html.match(/const ids=new Set\((\[[^\n]+\])/)[1];assert.ok(!ids.includes('registerPlayerButton'));assert.ok(ids.includes('poolPlannerButton'));assert.ok(ids.includes('eventControlNavButton'));assert.ok(html.includes("if (false && window.BeautyPlayerRemoval)"));assert.ok(!html.includes('The TEST spreadsheet layout'));});
console.log(JSON.stringify({result:'PASS',cases:checks,nativeServices:false}));
