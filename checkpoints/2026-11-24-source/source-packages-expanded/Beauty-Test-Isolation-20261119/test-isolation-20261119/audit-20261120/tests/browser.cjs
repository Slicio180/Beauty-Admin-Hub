const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {source,root}=require('./helpers.cjs');
const fixtures=path.resolve(root,'../display-review/incidents/20261116-cast-live-highlights');
const read=n=>JSON.parse(fs.readFileSync(path.join(fixtures,n),'utf8'));
const tournament=read('tournament.json'),standings=read('standings.json'),matches=read('matches.json');
const results=[],errors=[];let browser;
async function test(name,work){try{await work();results.push({name,ok:true});}catch(e){results.push({name,ok:false,error:e.message});}}
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.BEAUTY_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1080,height:1920}});
 await context.route('**/*',async route=>{
  const url=route.request().url();assert.equal(route.request().method(),'GET');
  if(url==='https://beauty-audit.invalid/')return route.fulfill({contentType:'text/html',body:source('BeautyDisplayRepairView.html')});
  if(url.includes('api.n01darts.com/api/v1/')){
   let body=url.includes('tournament/get?')?tournament:url.includes('tournament/standings?')?standings:url.includes('match/list?')?matches:{result:0,list:[]};
   if(url.includes('match/live?')){const mid=new URL(url).searchParams.get('mid'),file=path.join(fixtures,'live-'+mid+'.json');if(fs.existsSync(file))body=JSON.parse(fs.readFileSync(file));}
   return route.fulfill({contentType:'application/json',body:JSON.stringify(body),headers:{'access-control-allow-origin':'*'}});
  }
  return route.abort();
 });
 await context.addInitScript(({event,league})=>{
  window.auditPlayers=21;
  const roster=()=>({success:true,eventId:event,leagueId:league,eventDate:'2026-11-16',eventContext:'a'.repeat(32),eventTitle:'SYNTHETIC DISPLAY AUDIT',brand:'club',updatedAt:new Date().toISOString(),rankingAvailable:false,statsAvailable:true,statsStale:false,statsFetchedAt:new Date().toISOString(),players:Array.from({length:window.auditPlayers},(_,i)=>({name:'Synthetic Player '+String(i+1).padStart(2,'0'),registeredAt:null,rank:null,points:null,average:55}))});
  function api(success=()=>{},failure=()=>{}){return {withSuccessHandler:f=>api(f,failure),withFailureHandler:f=>api(success,f),beautyDisplayRepairTestData:()=>queueMicrotask(()=>success(roster())),beautyDisplayRepairTestPlan:()=>queueMicrotask(()=>success(null))};}
  window.google={script:{run:api()}};
 },{event:tournament.tournament.tdid,league:tournament.tournament.lgid});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://beauty-audit.invalid/');await page.locator('#liveNames li').nth(20).waitFor();await page.evaluate(()=>document.fonts.ready);
 for(const [n,columns]of [[21,1],[32,1],[33,2],[64,2]])await test('Portrait '+n+' players renders '+columns+' column(s)',async()=>{
  await page.evaluate(n=>{window.auditPlayers=n;BeautyLiveListControls.refresh();},n);await page.waitForFunction(n=>document.querySelectorAll('#liveNames li').length===n,n);
  const v=await page.locator('#liveNames').evaluate(n=>({columns:n.style.getPropertyValue('--live-columns'),rows:n.children.length}));assert.equal(v.columns,String(columns));assert.equal(v.rows,n);
 });
 await test('Portrait list last player remains reachable by scrolling',async()=>{const last=page.locator('#liveNames li').last();await last.scrollIntoViewIfNeeded();const a=await last.boundingBox(),b=await page.locator('#liveScroll').boundingBox();assert.ok(a.y+a.height<=b.y+b.height+1);});
 await page.setViewportSize({width:390,height:844});
 await test('Phone list has one column and every row has room for its name',async()=>{const v=await page.locator('#liveNames').evaluate(n=>({columns:n.style.getPropertyValue('--live-columns'),overlap:[...n.children].some((el,i,a)=>i&&el.getBoundingClientRect().top<a[i-1].getBoundingClientRect().bottom-1)}));assert.equal(v.columns,'1');assert.equal(v.overlap,false);});
 await test('Format selector is accessible through the display menu',async()=>{await page.locator('#displaySettings').click();assert.equal(await page.locator('#displayFormat').isVisible(),true);await page.locator('#displayFormat').selectOption('portrait');assert.equal(await page.locator('html').getAttribute('data-cast-portrait'),'true');});
 await test('Phone displays all seven captured pools in a scrollable column',async()=>{await page.locator('#tabGroup').click();await page.locator('.venue-pool-card').nth(6).waitFor();assert.equal(await page.locator('.venue-pool-card').count(),7);const last=page.locator('.venue-pool-card').last();await last.scrollIntoViewIfNeeded();const a=await last.boundingBox(),b=await page.locator('#stagePreview').boundingBox();assert.ok(a.y+a.height<=b.y+b.height+2);});
 await test('Eight synthetic pools fit one portrait column with scroll access',async()=>{
  const count=await page.evaluate(({tournament,standings})=>{const data=BeautyNakkaStages.project(tournament,standings,undefined,tournament.tournament.tdid,tournament.tournament.lgid);data.pools.push({...structuredClone(data.pools[6]),id:'rr_7',number:8,group:8});BeautyVenuePools.render(document,document.getElementById('stagePreview'),data,{view:'pools',scrollAll:true,width:390,height:600,size:6});return document.querySelectorAll('.venue-pool-card').length;},{tournament,standings});assert.equal(count,8);await page.locator('.venue-pool-card').last().scrollIntoViewIfNeeded();
 });
 await test('Both playoff tabs render without a JavaScript crash',async()=>{for(const id of ['#tabT','#tabS2']){await page.locator(id).click();assert.ok(await page.locator('#stagePreview').innerText());}});
 await test('Phone page has no document-level horizontal overflow',async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false));
 await test('No uncaught page errors in the rendered checks',()=>assert.deepEqual(errors,[]));
 // No screenshots are persisted; this task delivers audit text and code.
 await browser.close();browser=null;
 const out={scope:'Headless Chromium; all network responses intercepted locally. No Google/Nakka native acceptance.',passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,errors,results};fs.writeFileSync(path.join(root,'evidence/browser.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));process.exitCode=out.failed?1:0;
})().catch(async e=>{const out={status:results.length?'INCOMPLETE':'BLOCKED',reason:String(e.message).slice(0,3000),passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,results,scope:'Browser assertions are not acceptance evidence unless they actually ran.'};fs.writeFileSync(path.join(root,'evidence/browser.json'),JSON.stringify(out,null,2));console.error(e.message);if(browser)await browser.close();process.exitCode=1;});
