const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const source=fs.readFileSync(__dirname+'/LiveWorkbookHistory.js','utf8'),sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function fixture(options={}){
 const grid=[],writes=[],sh={getSheetId:()=>435296114},legacy={};let height=1000;
 const col=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
 const range=a=>{const m=a.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)$/);return [Number(m[2])-1,Number(m[4]),col(m[1]),col(m[3])+1];};
 const get=a=>{const [r1,r2,c1,c2]=range(a),out=[];for(let r=r1;r<r2;r++){const row=Array.from({length:c2-c1},(_,i)=>grid[r]?.[c1+i]??'');while(row.at(-1)==='')row.pop();out.push(row);}while(out.length&&!out.at(-1).length)out.pop();return out;};
 const ctx={console,Map,Array,JSON,RegExp,Number,Error,BEAUTY_EVENT_HISTORY_TAB_:'BEAUTY EVENT HISTORY',BEAUTY_LIVE_BASE_:{sheetId:'original'},beautyLiveTarget_:()=>({sheetId:'original'}),beautyEventHistory_:()=>sh,beautyEventHash_:sha,
  SpreadsheetApp:{openById:id=>{assert.equal(id,'original');return {getSheetByName:name=>name==='BEAUTY EVENT HISTORY'?sh:legacy[name]||null};}},
  beautyEventSheets_:(path,body)=>{
   if(path.startsWith('?'))return {sheets:[{properties:{sheetId:435296114,gridProperties:{rowCount:height}}}]};
   if(path.startsWith('/values/'))return {values:get(decodeURIComponent(path.slice(8).split('?')[0]))};
   assert.equal(path,':batchUpdate');writes.push(body);for(const request of body.requests){
    if(request.appendDimension)height+=request.appendDimension.length;
    if(request.updateCells){const u=request.updateCells;for(const [i,row]of u.rows.entries())for(const [j,c]of row.values.entries()){const r=u.start.rowIndex+i,k=u.start.columnIndex+j;(grid[r]??=[])[k]=c.userEnteredValue?Object.values(c.userEnteredValue)[0]:'';}}
   }
   if(options.lostReply)throw Error('lost write reply');return {};
  }};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,grid,writes,get,legacy};
}
const checks=[];const data={player:'Åsa 🎯',state:{rows:[[1,'=literal name'],[2,'x'.repeat(25000)]]}};
let f=fixture();const id='REMOVE-20261116-160000-1234abcd';f.ctx.beautyRecoveryRecordSave_(id,'REMOVE',data);assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.beautyRecoveryRecordRead_(id,'REMOVE'))),data);assert.equal(f.get('P2:U20').length,3);checks.push('Multi-part Unicode removal record round-trips in existing history columns');
let n=f.writes.length;f.ctx.beautyRecoveryRecordSave_(id,'REMOVE',data);assert.equal(f.writes.length,n);assert.throws(()=>f.ctx.beautyRecoveryRecordSave_(id,'REMOVE',{different:true}),/different/);checks.push('Identical record recheck does not append; conflicting reuse stops');
f.grid[1][20]+='tampered';assert.throws(()=>f.ctx.beautyRecoveryRecordRead_(id,'REMOVE'));checks.push('Corrupt recovery content is rejected before use');
f=fixture({lostReply:true});f.ctx.beautyRecoveryRecordSave_(id,'REMOVE',data);assert.equal(f.writes.length,2);assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.beautyRecoveryRecordRead_(id,'REMOVE'))),data);checks.push('Lost header/data replies verify saved cells without repeat writes');
const head=['Timestamp','Name','New name','Consent','Message','Source'].map(x=>['stringValue',x]);const a=[['numberValue',46335],['stringValue','Åsa'],null,['stringValue','YES'],null,['stringValue','HUB']];
f=fixture();f.ctx.beautyEventReadableHistorySave_({responses:[head,a,a]});assert.equal(f.get('H1:M100').length,3);n=f.writes.length;f.ctx.beautyEventReadableHistorySave_({responses:[head,a,a]});assert.equal(f.writes.length,n);f.ctx.beautyEventReadableHistorySave_({responses:[head,a,a,a]});assert.equal(f.get('H1:M100').length,4);assert.equal(f.get('A1:F10').length,0);checks.push('Readable history preserves repeated original rows and avoids re-adding saved snapshots');
f.grid[0][7]='Unrelated header';assert.throws(()=>f.ctx.beautyEventReadableHistorySave_({responses:[head,a]}),/header differs/);checks.push('Existing unrelated history cells are protected');
f=fixture();const planner=fs.readFileSync(__dirname+'/LivePlanner.js','utf8');const helper=planner.slice(planner.indexOf('function beautyPoolAuditRead_('),planner.indexOf('function beautyHubPool_('));f.ctx.beautyPoolError_=m=>{throw Error(m);};vm.runInContext(helper,f.ctx);const old={kind:'POOL_SEND_BEFORE',draw:{pools:[]}},oldId='POOL-12345678901234567890';f.legacy[oldId]={getLastRow:()=>2,getRange:()=>({getValues:()=>[['Beauty LIVE pool audit','date'],['JSON 1',JSON.stringify(old)]]})};assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.beautyPoolAuditRead_(oldId))),old);f.ctx.beautyRecoveryRecordSave_('POOL-abcdef12345678901234','POOL',old);assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.beautyPoolAuditRead_('POOL-abcdef12345678901234'))),old);checks.push('Pool recovery can read both existing tab receipts and new central records');
for(const name of ['LiveWorkbookHistory','LiveEventSwitch','LivePlanner','LiveRemove'])new vm.Script(fs.readFileSync(__dirname+'/'+name+'.js','utf8'));
assert(!fs.readFileSync(__dirname+'/LiveRemove.js','utf8').includes('ss.insertSheet(backup)'));assert(!planner.includes('ss.insertSheet(name)'));checks.push('All changed server files parse; removal and pool writers no longer create tabs');
fs.writeFileSync(__dirname+'/history-results.json',JSON.stringify({result:'PASS',checks,remoteCalls:0},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
