/* TEST ONLY: durable queue fixture. Original handlers and v2 lab stay unchanged.
 * Two manual runs prove saved requests survive separate Apps Script executions.
 * No Nakka requests, original event data writes, real player registrations,
 * trigger installation, production receipt changes or new workbook creation.
 */
function beautyTestQueueAccept20261109(){if(arguments.length)throw Error('QUEUE_LAB_NO_ARGUMENTS');return beautyQueueLabRun20261109_('accept');}
function beautyTestQueueProcess20261109(){if(arguments.length)throw Error('QUEUE_LAB_NO_ARGUMENTS');return beautyQueueLabRun20261109_('process');}
function beautyQueueLabRun20261109_(phase){
  const config={"build": "beauty-queue-lab-20261109-v1", "scriptId": "1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N", "context": {"version": 1, "mode": "league", "leagueId": "lg_M2wQ_4189", "eventId": "t_gINp_8026", "date": "2026-11-07", "title": "AIK Hub TEST 2026-11-07", "revision": "7badf194ceda4cff92e5a7205045b638", "sheetId": "17IdLeX4bzkoWXtyN9zPSILuHwDga4dhe2ixtqWzONwE"}};
  const expected=config.context,started=Date.now(),tabName='BRQ1109_RegistrationQueue_v1';
  const report={check:'BEAUTY_TEST_QUEUE_LAB',build:config.build,phase,result:'IN_PROGRESS',startedUTC:new Date().toISOString(),scriptId:config.scriptId,spreadsheetId:expected.sheetId,
    originalEventTabsWritten:false,scriptPropertiesWritten:false,nakkaNetworkCalls:0,workbooksCreated:0,clientsChanged:false,fixtureTab:null,cases:[],simulatedEffectsThisRun:{save:0,provider:0,display:0}};
  let book,tab,lastRequest=0;
  function assert(value,code){if(!value)throw Error(code);}
  function guard(){
    assert(ScriptApp.getScriptId()===config.scriptId,'QUEUE_LAB_WRONG_PROJECT');
    let actual;try{actual=JSON.parse(PropertiesService.getScriptProperties().getProperty('BEAUTY_EVENT_CONTEXT_V1')||'null');}catch(e){throw Error('QUEUE_LAB_CONTEXT');}
    assert(actual&&Object.keys(expected).every(k=>actual[k]===expected[k]),'QUEUE_LAB_CONTEXT');
  }
  function owned(){guard();assert(tab&&tab.getName()===tabName&&tab.getParent().getId()===expected.sheetId&&tab.getSheetId()===report.fixtureTab.sheetId,'QUEUE_LAB_TARGET');}
  function fetchValues(a1,values){
    owned();assert(/^A2:B501$|^A(?:[2-9]|[1-9]\d|[1-4]\d\d|50[01]):B(?:[2-9]|[1-9]\d|[1-4]\d\d|50[01])$/.test(a1),'QUEUE_LAB_RANGE');
    assert(Date.now()-started<330000,'QUEUE_LAB_RUNTIME_BUDGET');
    // Deliberately pace the lab below per-user read/write quotas. Not a benchmark.
    const delay=1150-(Date.now()-lastRequest);if(delay>0)Utilities.sleep(delay);
    const range="'"+tabName+"'!"+a1,write=values!==undefined;
    const query=write?'valueInputOption=RAW&includeValuesInResponse=true&responseValueRenderOption=UNFORMATTED_VALUE':'valueRenderOption=UNFORMATTED_VALUE';
    lastRequest=Date.now();
    const response=UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/'+expected.sheetId+'/values/'+encodeURIComponent(range)+'?'+query,
      {method:write?'put':'get',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},...(write?{contentType:'application/json',payload:JSON.stringify({range,majorDimension:'ROWS',values:[values]})}:{}),muteHttpExceptions:true,followRedirects:false});
    assert(response.getResponseCode()===200,'QUEUE_LAB_SHEETS_HTTP_'+response.getResponseCode());
    const data=JSON.parse(response.getContentText());
    if(write){assert(data.updatedRows===1&&data.updatedCells===2,'QUEUE_LAB_WRITE_RESPONSE');return data.updatedData?.values?.[0]||[];}
    assert(data.values===undefined||Array.isArray(data.values),'QUEUE_LAB_READ_RESPONSE');return data.values||[];
  }
  function make(){
    const io={readRows:()=>fetchValues('A2:B501'),readRow:r=>fetchValues('A'+r+':B'+r)[0]||[],writeRow:(r,values)=>fetchValues('A'+r+':B'+r,values)};
    return beautyQueueCore20261109_(beautyQueueStore20261109_(io,LockService.getScriptLock()),()=>Date.now(),()=>Utilities.getUuid().replace(/-/g,''));
  }
  const seeds=Array.from({length:10},(_,i)=>({requestId:'beauty_queue_fixture_'+String(i+1).padStart(2,'0'),
    event:{mode:'league',leagueId:'lg_queue_fixture',eventId:'t_queue_fixture',date:'2026-11-09',revision:'queue-fixture-v1',sheetId:expected.sheetId},
    playerId:'queue-fixture-player-'+(i+1),player:'Beauty Queue Fixture '+(i+1),source:['HUB','KIOSK','MOBIL'][i%3],consent:i%2?'NEJ':'JA',message:'Keep trailing space '+(i+1)+' '}));
  const marker=JSON.stringify({build:config.build,scriptId:config.scriptId,context:expected,fixtureOnly:true});
  try{
    guard();book=SpreadsheetApp.openById(expected.sheetId);
    assert(book.getId()===expected.sheetId&&book.getName()==='Beauty TEST · AIK Hub TEST 2026-11-07 · 2026-11-07','QUEUE_LAB_WORKBOOK');
    assert(Utilities.formatDate(book.getSheetByName('Control').getRange('A2').getValue(),'Europe/Stockholm','yyyy-MM-dd')===expected.date,'QUEUE_LAB_CONTROL_DATE');
    // The setup lock prevents two Accept runs creating or initializing the same tab.
    const setupLock=LockService.getScriptLock();assert(setupLock.tryLock(5000),'QUEUE_LAB_BUSY');
    try{
      tab=book.getSheetByName(tabName);
      if(!tab){
        assert(phase==='accept','QUEUE_LAB_ACCEPT_FIRST');guard();tab=book.insertSheet(tabName);
        report.fixtureTab={name:tabName,sheetId:tab.getSheetId()};owned();
        tab.getRange(1,1,1,4).setValues([['REQUEST ID','DURABLE JOB JSON','TEST FIXTURE ONLY',marker]]);SpreadsheetApp.flush();
      }
      report.fixtureTab={name:tabName,sheetId:tab.getSheetId()};owned();
      assert(JSON.stringify(tab.getRange(1,1,1,4).getDisplayValues()[0])===JSON.stringify(['REQUEST ID','DURABLE JOB JSON','TEST FIXTURE ONLY',marker]),'QUEUE_LAB_MARKER_CHANGED');
    }finally{setupLock.releaseLock();}
    const q=make();
    function check(label,fn){fn();report.cases.push({label,result:'PASS'});}
    if(phase==='accept'){
      check('TEN_DURABLE_REQUESTS',()=>{for(const seed of seeds)assert(q.enqueue(seed).accepted,'QUEUE_LAB_ACCEPT_FAILED');});
      check('RECONSTRUCTED_STORE_READBACK',()=>{
        const rows=make().list();assert(rows.length===10&&rows.every((j,i)=>JSON.stringify(j.request)===JSON.stringify(seeds[i])),'QUEUE_LAB_SAVED_REQUEST_MISMATCH');
      });
      report.result='READY_FOR_PROCESSING';report.nextFunction='beautyTestQueueProcess20261109';
    }else{
      check('REQUESTS_FROM_PREVIOUS_EXECUTION',()=>{
        const rows=q.list();assert(rows.length===10&&rows.every((j,i)=>JSON.stringify(j.request)===JSON.stringify(seeds[i])),'QUEUE_LAB_SAVED_REQUEST_MISMATCH');
      });
      const effects={};
      for(const step of ['save','provider','display'])effects[step]=(request,operationId)=>{
        guard();assert(seeds.some(s=>s.requestId===request.requestId&&JSON.stringify(s)===JSON.stringify(request)),'QUEUE_LAB_EFFECT_TARGET');
        // Simulated effects only. No registration/Sheets event/Nakka function is called.
        report.simulatedEffectsThisRun[step]++;
        if(step==='provider'&&request.requestId===seeds[0].requestId)throw Error('SIMULATED_LOST_PROVIDER_REPLY_AFTER_COMMIT');
        if(step==='display'&&request.requestId===seeds[1].requestId)throw Error('SIMULATED_DISPLAY_FAILURE');
        return {verified:true,recordId:operationId};
      };
      for(let i=0;i<10&&Date.now()-started<210000;i++){const done=q.processNext(effects);if(!done)break;}
      const saved=make().list();
      report.counts={accepted:saved.length,queued:saved.filter(j=>j.state==='QUEUED').length,working:saved.filter(j=>j.state==='WORKING').length,attention:saved.filter(j=>j.state==='ATTENTION').length,complete:saved.filter(j=>j.state==='COMPLETE').length};
      report.outcomes=saved.map(j=>({requestId:j.request.requestId,source:j.request.source,state:j.state,failure:j.failure,saved:j.outcomes.save.state,provider:j.outcomes.provider.state,display:j.outcomes.display.state}));
      if(report.counts.queued||report.counts.working){report.result='PAUSED';report.nextFunction='beautyTestQueueProcess20261109';}
      else{
        check('FAILURES_ISOLATED_AND_EIGHT_OTHERS_COMPLETE',()=>{
          assert(saved[0].state==='ATTENTION'&&saved[0].failure==='PROVIDER_UNCERTAIN'&&saved[0].outcomes.provider.state==='INTENT','QUEUE_LAB_PROVIDER_NOT_ISOLATED');
          assert(saved[1].state==='ATTENTION'&&saved[1].failure==='DISPLAY_UNCERTAIN'&&saved[1].outcomes.provider.state==='VERIFIED','QUEUE_LAB_DISPLAY_NOT_ISOLATED');
          assert(saved.slice(2).every(j=>j.state==='COMPLETE'),'QUEUE_LAB_OTHER_PLAYERS_BLOCKED');
        });
        check('RETRIES_KEEP_SAME_REQUESTS_AND_OUTCOMES',()=>{for(const seed of seeds){const r=make().enqueue(seed);assert(r.accepted&&r.replayed,'QUEUE_LAB_RETRY_DUPLICATED');}});
        check('CROSS_DEVICE_DUPLICATE_PRESERVES_ORIGINAL',()=>{
          const result=q.enqueue({...seeds[2],requestId:'beauty_queue_duplicate_fixture',source:'MOBIL',message:'different'});
          assert(result.duplicate&&!result.accepted,'QUEUE_LAB_DUPLICATE_ACCEPTED');
        });
        check('UNCERTAIN_PROVIDER_NOT_AUTOMATICALLY_REPLAYED',()=>{assert(make().processNext(effects)===null,'QUEUE_LAB_UNCERTAIN_REPLAY');});
        report.result='PASS';
      }
    }
  }catch(error){report.result='STOPPED';report.error=/^[A-Z0-9_: -]{1,120}$/.test(String(error?.message))?String(error.message):'QUEUE_LAB_UNEXPECTED_ERROR';}
  report.limitations=['Queue writes/readback use only the dedicated TEST fixture tab in the existing workbook.',
    'Save, Nakka and display effects are simulated. This lab does not register real players.',
    'Requests are accepted sequentially; this is not concurrent browser/load testing.',
    'The queue is not connected to Hub, kiosk or mobile; no production handlers changed.',
    'Requests are deliberately paced; timings are not a performance benchmark.',
    'No recovery/retry of uncertain provider writes or permanent-workbook migration is implemented.'];
  report.finishedUTC=new Date().toISOString();console.log(JSON.stringify(report,null,2));console.log('RESULT: '+report.result+'; TEST QUEUE FIXTURE ONLY; NO LIVE DATA OR NAKKA CHANGED.');return report;
}

/* Candidate queue engine. Internal trusted-server API, NOT a public endpoint.
 * No Apps Script global access, network, credentials, timer or top-level writes.
 * Store.transaction must hold a short exclusive lock and durably verify put().
 * External effects run outside that lock. The caller supplies verified adapters.
 */
function beautyQueueCore20261109_(store, clock, tokenFactory) {
  'use strict';
  const STEPS=['save','provider','display'];
  // Greater than the documented six-minute Apps Script execution limit.
  // An expired claim is quarantined, never replayed. Do not shorten in production.
  const LEASE_MS=600000;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
  function stop(code){const e=new Error(code);e.code=code;throw e;}
  function exact(v,keys){if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).sort().join(',')!==keys.slice().sort().join(','))stop('INVALID_REQUEST');}
  function text(v,max){return typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);}
  function validate(r){
    exact(r,['requestId','event','playerId','player','source','consent','message']);
    if(!/^[a-zA-Z0-9_-]{12,100}$/.test(r.requestId||'')||!text(r.playerId,160)||!text(r.player,120)||!['HUB','KIOSK','MOBIL'].includes(r.source)||!['JA','NEJ'].includes(r.consent)||typeof r.message!=='string'||r.message.length>2000)stop('INVALID_REQUEST');
    exact(r.event,['mode','leagueId','eventId','date','revision','sheetId']);
    const e=r.event;
    if(!['league','tournament'].includes(e.mode)||!/^t_[\w]{1,80}$/.test(e.eventId||'')||!/^20\d\d-\d\d-\d\d$/.test(e.date||'')||new Date(e.date+'T12:00:00Z').toISOString().slice(0,10)!==e.date||!text(e.revision,100)||!/^[-\w]{20,150}$/.test(e.sheetId||'')||(e.mode==='league'?!/^lg_[\w]{1,80}$/.test(e.leagueId||''):e.leagueId!==''))stop('INVALID_EVENT');
    return copy(r);
  }
  const eventKey=e=>JSON.stringify([e.mode,e.leagueId,e.eventId]);
  const key=r=>JSON.stringify([eventKey(r.event),r.playerId]);
  function checkRows(rows){
    if(!Array.isArray(rows)||rows.length>500)stop('QUEUE_LAYOUT');
    const ids=new Set(),players=new Set();
    for(const j of rows){
      if(!j||j.version!==1||!Number.isInteger(j.revision)||j.revision<1||!['QUEUED','WORKING','ATTENTION','COMPLETE'].includes(j.state)||!Array.isArray(j.history)||j.history.length>20)stop('QUEUE_LAYOUT');
      validate(j.request);
      if(ids.has(j.request.requestId)||players.has(key(j.request)))stop('QUEUE_DUPLICATE');
      ids.add(j.request.requestId);players.add(key(j.request));
      if(!Number.isFinite(j.createdAt)||!Number.isFinite(j.updatedAt)||!j.outcomes||!STEPS.every(s=>j.outcomes[s]&&['PENDING','INTENT','VERIFIED'].includes(j.outcomes[s].state)))stop('QUEUE_LAYOUT');
      if(j.state==='WORKING'&&(!j.claim||!text(j.claim.token,100)||!Number.isFinite(j.claim.expiresAt)))stop('QUEUE_LAYOUT');
      if(j.state==='COMPLETE'&&!STEPS.every(s=>j.outcomes[s].state==='VERIFIED'))stop('QUEUE_LAYOUT');
    }
    // Only one worker is allowed in this bounded queue. Acceptance remains free.
    if(rows.filter(j=>j.state==='WORKING').length>1)stop('QUEUE_MULTIPLE_WORKERS');
  }
  function transaction(fn){return store.transaction(tx=>{const rows=tx.list();checkRows(rows);return fn(tx,rows);});}
  function write(tx,j,event){
    const out=copy(j);out.revision++;out.updatedAt=clock();out.history.push({at:out.updatedAt,event});
    if(out.history.length>20)stop('QUEUE_HISTORY_LIMIT');
    tx.put(out,j.revision);return copy(out);
  }
  function find(rows,id){const j=rows.find(x=>x.request.requestId===id);if(!j)stop('REQUEST_MISSING');return j;}
  function owned(rows,id,token){const j=find(rows,id);if(j.state!=='WORKING'||j.claim.token!==token||clock()>=j.claim.expiresAt)stop('CLAIM_LOST');return j;}
  function enqueue(raw){
    const request=validate(raw);
    return transaction((tx,rows)=>{
      const old=rows.find(j=>j.request.requestId===request.requestId);
      if(old){if(!same(old.request,request))stop('REQUEST_ID_REUSED');return {accepted:true,replayed:true,duplicate:false,job:copy(old)};}
      const duplicate=rows.find(j=>key(j.request)===key(request));
      if(duplicate)return {accepted:false,replayed:false,duplicate:true,code:'PLAYER_ALREADY_QUEUED',requestId:duplicate.request.requestId,state:duplicate.state};
      // The same provider event cannot be silently rebound to another date/book.
      if(rows.some(j=>eventKey(j.request.event)===eventKey(request.event)&&!same({...j.request.event,revision:''},{...request.event,revision:''})))stop('EVENT_BINDING_CHANGED');
      if(rows.length>=500)stop('QUEUE_CAPACITY');
      const t=clock(),job={version:1,revision:1,request,state:'QUEUED',createdAt:t,updatedAt:t,claim:null,failure:null,outcomes:Object.fromEntries(STEPS.map(s=>[s,{state:'PENDING'}])),history:[{at:t,event:'ACCEPTED'}]};
      tx.put(job,0);return {accepted:true,replayed:false,duplicate:false,job:copy(job)};
    });
  }
  function list(){return transaction((tx,rows)=>copy(rows));}
  function get(id){return transaction((tx,rows)=>copy(find(rows,id)));}
  function claim(){
    return transaction((tx,rows)=>{
      const active=rows.find(j=>j.state==='WORKING');
      if(active){
        if(clock()<active.claim.expiresAt)return null;
        active.state='ATTENTION';active.failure='WORKER_INTERRUPTED';active.claim=null;
        write(tx,active,'INTERRUPTED');
        // Reload on the next invocation; never continue from a possibly uncertain write.
        return null;
      }
      const pending=rows.find(j=>j.state==='QUEUED');if(!pending)return null;
      const token=tokenFactory();if(!text(token,100))stop('INVALID_CLAIM_TOKEN');
      pending.state='WORKING';pending.claim={token,expiresAt:clock()+LEASE_MS};return write(tx,pending,'CLAIMED');
    });
  }
  function operation(id,token,step,effect){
    if(!STEPS.includes(step)||typeof effect!=='function')stop('INVALID_OPERATION');
    const intent=transaction((tx,rows)=>{
      const j=owned(rows,id,token),index=STEPS.indexOf(step);
      if(j.outcomes[step].state!=='PENDING'||STEPS.slice(0,index).some(s=>j.outcomes[s].state!=='VERIFIED'))stop('OPERATION_REPLAY_BLOCKED');
      j.outcomes[step]={state:'INTENT',operationId:id+':'+step};return write(tx,j,'INTENT_'+step.toUpperCase());
    });
    // Deliberately outside Store.transaction / ScriptLock.
    const proof=effect(copy(intent.request),intent.outcomes[step].operationId);
    if(!proof||proof.verified!==true||typeof proof.recordId!=='string'||!text(proof.recordId,160)||Object.keys(proof).some(k=>!['verified','recordId'].includes(k)))stop('EFFECT_NOT_VERIFIED');
    return transaction((tx,rows)=>{
      const j=owned(rows,id,token);if(j.outcomes[step].state!=='INTENT')stop('OPERATION_STATE_CHANGED');
      j.outcomes[step]={...j.outcomes[step],state:'VERIFIED',recordId:proof.recordId};return write(tx,j,'VERIFIED_'+step.toUpperCase());
    });
  }
  function attention(id,token,code){
    // Only fixed diagnostic codes enter durable records; no raw exceptions/payloads.
    const allowed=['SAVE_UNCERTAIN','PROVIDER_UNCERTAIN','DISPLAY_UNCERTAIN','WORKER_FAILED'];
    return transaction((tx,rows)=>{const j=owned(rows,id,token);j.state='ATTENTION';j.claim=null;j.failure=allowed.includes(code)?code:'WORKER_FAILED';return write(tx,j,'NEEDS_ATTENTION');});
  }
  function complete(id,token){return transaction((tx,rows)=>{const j=owned(rows,id,token);if(!STEPS.every(s=>j.outcomes[s].state==='VERIFIED'))stop('INCOMPLETE');j.state='COMPLETE';j.claim=null;return write(tx,j,'COMPLETE');});}
  function processNext(effects){
    if(!effects||!STEPS.every(s=>typeof effects[s]==='function'))stop('MISSING_EFFECT');
    const j=claim();if(!j)return null;
    for(const step of STEPS){
      try{operation(j.request.requestId,j.claim.token,step,effects[step]);}
      catch(error){
        // If the durable store also fails, leave the existing intent/claim in place.
        // This propagates the storage failure; it is never a successful completion.
        return attention(j.request.requestId,j.claim.token,{save:'SAVE_UNCERTAIN',provider:'PROVIDER_UNCERTAIN',display:'DISPLAY_UNCERTAIN'}[step]);
      }
    }
    return complete(j.request.requestId,j.claim.token);
  }
  return Object.freeze({enqueue,list,get,claim,operation,attention,complete,processNext,leaseMs:LEASE_MS});
}

/* Bounded durable row store. io reads/writes only one pre-created owned tab.
 * Each row is [requestId, JSON]. Writes use RAW values; no insert/shift operation.
 * The lock covers only a storage transaction, never an external effect.
 */
function beautyQueueStore20261109_(io, lock) {
  const copy=x=>JSON.parse(JSON.stringify(x));
  function stop(code){const e=new Error(code);e.code=code;throw e;}
  return Object.freeze({transaction(fn){
    if(!lock.tryLock(5000))stop('QUEUE_BUSY_NOT_ACCEPTED');
    try{
      const raw=io.readRows();if(!Array.isArray(raw)||raw.length>500)stop('QUEUE_STORE_LAYOUT');
      const jobs=raw.map(row=>{
        if(!Array.isArray(row)||row.length!==2||typeof row[0]!=='string'||typeof row[1]!=='string'||row[1].length>20000)stop('QUEUE_STORE_LAYOUT');
        let j;try{j=JSON.parse(row[1]);}catch(e){stop('QUEUE_STORE_JSON');}
        if(row[0]!==j?.request?.requestId)stop('QUEUE_STORE_ID');return j;
      });
      const tx={list:()=>copy(jobs),put(job,expectedRevision){
        const at=jobs.findIndex(j=>j.request.requestId===job.request.requestId);
        if((at<0?0:jobs[at].revision)!==expectedRevision||job.revision!==expectedRevision+1)stop('QUEUE_REVISION_CONFLICT');
        const index=at<0?jobs.length:at,row=[job.request.requestId,JSON.stringify(job)];
        if(index>=500||row[1].length>20000)stop('QUEUE_CAPACITY');
        let confirmed=false;
        try{confirmed=JSON.stringify(io.writeRow(index+2,row))===JSON.stringify(row);}catch(ignored){}
        if(!confirmed){
          // Resolve a lost PUT reply with one read. Never repeat a storage write.
          let actual;try{actual=io.readRow(index+2);}catch(ignored){stop('QUEUE_WRITE_UNCERTAIN');}
          if(JSON.stringify(actual)!==JSON.stringify(row))stop('QUEUE_WRITE_UNCERTAIN');
        }
        jobs[index]=copy(job);
      }};
      return fn(tx);
    }finally{lock.releaseLock();}
  }});
}

