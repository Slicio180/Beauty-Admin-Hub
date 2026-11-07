'use strict';
// Loopback-only synthetic rehearsal. No Nakka transport or credentials are loaded.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {demoState}=require('./demo-state.cjs'),{planAssignment}=require('./qualification.cjs'),{coordinator,verifyTables}=require('./coordinator.cjs'),{badgePlan,autopilotPlan,verifyOperation}=require('./operations.cjs'),{fileStore}=require('./file-store.cjs'),{guideStore}=require('./guide-store.cjs'),{planGuideEdit,verifyGuide}=require('./guide-editor.cjs'),{togglePlan,monitor,tick,tickPlan,verifyTick,finishRehearsal}=require('./autopilot.cjs');
function createServer(options={}){const initial=demoState(),snapshot=initial.snapshot,auditDirectory=options.dataDirectory||fs.mkdtempSync(path.join(os.tmpdir(),'event-manager-rehearsal-')),audit=[],sessions=new Map(),store=fileStore(path.join(auditDirectory,'operations')),guides=guideStore(path.join(auditDirectory,'guides'),snapshot.event.tdid);let serviceStopped=false,serviceBusy=false;const serviceActor=crypto.randomBytes(24).toString('hex');sessions.set(serviceActor,Date.now());let stored=guides.read()||guides.save(0,initial.guide,crypto.createHash('sha256').update('rehearsal-initializer').digest('hex')),guide=stored.guide,guideRevision=stored.revision,url;
 const engine=coordinator({read:async()=>structuredClone({...snapshot,guide,guideRevision}),plan:(before,input)=>input.kind==='autopilot-toggle'?togglePlan(before,input):input.kind==='autopilot-tick'?tickPlan(before):input.kind==='guide'?planGuideEdit(before,input):input.kind==='qualify'?planAssignment(before,guide,input.pools):input.kind==='badge'?badgePlan(before,input):input.kind==='autopilot'?autopilotPlan(before,input):(()=>{throw Error('Unknown operation');})(),write:async({path:route,body},{actorHash})=>{
  if(route==='local/autopilot/tick'){const {guide:g,guideRevision:rev,...next}=body.next;Object.assign(snapshot,next);return;}
  if(route==='local/guide/update'){const saved=guides.save(body.expectedRevision,body.guide,actorHash);guide=saved.guide;guideRevision=saved.revision;return;}
  if(body.tdid!==snapshot.event.tdid)throw Error('Wrong rehearsal event');
  if(route==='tournament/update'){if(body.expect_update_time!==snapshot.event.updateTime)throw Error('Event changed');Object.assign(snapshot.event,body.set);}
  else if(route==='tournament/badge/update'){const key=`${body.ttype}-${body.round}-${body.index}`;if(body.str)snapshot.event.badge[key]={str:body.str,st:body.st};else delete snapshot.event.badge[key];}
  else if(route==='autopilot/update'){for(const [k,v]of Object.entries(body.config.types))snapshot.autopilot.config.types[k]={...snapshot.autopilot.config.types[k],...v};}
  else throw Error('Unsupported rehearsal path');snapshot.event.updateTime++;
 },verify:(before,p,after)=>p.operation==='autopilot-rehearsal'?verifyTick(before,p,after):p.operation==='guide'?verifyGuide(before,p,after):p.operation==='qualify'?verifyTables(before,p,after):verifyOperation(before,p,after),store,authorize:async actor=>{if(!sessions.has(actor)||Date.now()-sessions.get(actor)>21600000)throw Error('Reopen rehearsal to start a session');}});
 async function runAutomaticRehearsal(){if(serviceBusy||serviceStopped||!Object.values(snapshot.autopilot.config.types).some(c=>c.enable===1))return;serviceBusy=true;try{const result=tick({...snapshot,guide,guideRevision});if(!result.assigned.length&&JSON.stringify(result.next.event.badge)===JSON.stringify(snapshot.event.badge)&&JSON.stringify(result.held)===JSON.stringify(snapshot.autopilot.status?.held))return;const p=await engine.review(serviceActor,{kind:'autopilot-tick'}),r=await engine.confirm(serviceActor,p.ticket,true);audit.push({...r,automatic:true,time:new Date().toISOString()});if(!r.verified)serviceStopped=true;}catch{serviceStopped=true;}finally{serviceBusy=false;}}
 const timer=setInterval(runAutomaticRehearsal,250);timer.unref();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; font-src 'self'; frame-ancestors 'none'");res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  let actor=req.headers.cookie?.match(/(?:^|; )session=([a-f0-9]{48})(?:;|$)/)?.[1];
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  try{
   if(req.method==='GET'&&req.url==='/'){actor=crypto.randomBytes(24).toString('hex');sessions.set(actor,Date.now());res.setHeader('Set-Cookie',`session=${actor}; HttpOnly; SameSite=Strict; Path=/`);res.writeHead(200,{'Content-Type':'text/html'});return res.end(fs.readFileSync(path.join(__dirname,'../web/index.html')));}
   const assets={'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};if(req.method==='GET'&&assets[req.url]){const [file,type]=assets[req.url];res.writeHead(200,{'Content-Type':type});return res.end(fs.readFileSync(path.join(__dirname,'../web',file)));}
   if(!actor||!sessions.has(actor))return send(401,{error:'Open the rehearsal page first'});
   if(req.method==='GET'&&req.url==='/api/state')return send(200,{...snapshot,guide,guideRevision,audit,automatic:{...monitor(snapshot,snapshot.rehearsal.clock),stopped:serviceStopped},mode:'synthetic'});
   if(req.method!=='POST'||req.headers.origin!==url||req.headers['content-type']!=='application/json')return send(403,{error:'Blocked request'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)throw Error('Request too large');}const input=JSON.parse(raw);
   if(req.url==='/api/review')return send(200,await engine.review(actor,input));
   if(req.url==='/api/confirm'){const result=await engine.confirm(actor,input.ticket,input.confirmed);audit.push({...result,time:new Date().toISOString()});return send(200,result);}
   if(req.url==='/api/rehearsal-finish-match'){Object.assign(snapshot,finishRehearsal(snapshot,input));return send(200,{success:true});}
   if(req.url==='/api/rehearsal-advance-clock'){if(!Number.isInteger(input.minutes)||input.minutes<1||input.minutes>60)throw Error('Advance 1–60 minutes');snapshot.rehearsal.clock+=input.minutes*60000;snapshot.rehearsal.revision++;return send(200,{success:true});}
   if(req.url==='/api/finish-pool'){if(!Number.isInteger(input.pool)||!guide.groups[input.pool])throw Error('Invalid pool');snapshot.completion.groups['rr_'+input.pool]=1;snapshot.event.updateTime++;return send(200,{success:true});}
   send(404,{error:'Unknown route'});
  }catch(error){send(400,{error:error.message});}
 });
 return {server,start(port=0){return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>{url='http://127.0.0.1:'+server.address().port;resolve(url);}));},close(){clearInterval(timer);return new Promise(resolve=>server.close(()=>{if(!options.dataDirectory)fs.rmSync(auditDirectory,{recursive:true});resolve();}));}};
}
if(require.main===module)createServer({dataDirectory:process.env.EVENT_MANAGER_DATA_DIR}).start(Number(process.env.EVENT_MANAGER_PORT||4317)).then(url=>console.log('Synthetic rehearsal only: '+url));module.exports={createServer};
