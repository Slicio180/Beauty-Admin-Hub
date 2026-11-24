const assert=require('assert/strict'),{setup,clone}=require('./fixture.cjs'),fs=require('fs'),path=require('path');
function fixture(){
 const f=setup(),{c}=f,rows={};let writes=0,failAt=0;
 for(const title of ['PLAYER STATUS DATA',"TONIGHT'S PLAYERS"])rows[title]=f.data.players.map(p=>[p.player,'','IN','NO','synthetic','HUB']);
 const snap=()=>Object.fromEntries(Object.entries(rows).map(([k,values],i)=>[k,{id:i+1,values:clone(values),display:clone(values),formulas:values.map(()=>Array(6).fill('')),formats:values.map(()=>Array(6).fill('@'))}]));
 c.beautyHubEventSnapshot_=snap;c.beautyResilienceStable_=()=>({sourceHash:c.beautyHubTransferHash_(snap()),historyHash:f.flags.stable});
 c.SpreadsheetApp={flush(){}};c.beautyHubSpreadsheet_=()=>({getId:()=>f.context.sheetId,getSheetByName:title=>({getSheetId:()=>Object.keys(rows).indexOf(title)+1,getRange:(row,col)=>({getValue:()=>rows[title][row-1][col-1],getFormula:()=>'',setValue:v=>{if(failAt===writes+1){failAt=0;throw Error('Injected sheet failure');}writes++;rows[title][row-1][col-1]=v;if(title==="TONIGHT'S PLAYERS")f.data.players[row-1].status=v;}})})});
 f.baseline();f.four();for(const values of Object.values(rows))for(const i of [4,5])values[i][2]='OUT';
 return {...f,rows,cleanup:()=>c.beautyRestorePoolAttendance20261122(),writes:()=>writes,failAt:n=>failAt=n};
}
const results=[];function test(name,fn){try{fn();results.push({name,result:'PASS'});}catch(e){results.push({name,result:'FAIL',error:e.stack});}}
test('Owner cleanup restores exactly four synthetic C cells, retains all other fields, then exact draft restoration succeeds',()=>{const f=fixture(),old=clone(f.rows);f.cleanup();assert.equal(f.writes(),4);for(const [title,rows]of Object.entries(old))rows.forEach((v,i)=>v.forEach((x,j)=>assert.equal(f.rows[title][i][j],i>=4&&j===2?'IN':x)));f.restore();assert.equal(f.saved().draw.seed,f.config.seed);assert.ok(f.calls.every(x=>!x.write));});
test('Attendance cleanup is idempotent',()=>{const f=fixture();f.cleanup();f.cleanup();assert.equal(f.writes(),4);});
test('A partial status write resumes without changing any other cell',()=>{const f=fixture();f.failAt(2);assert.throws(f.cleanup,/sheet failure/);assert.equal(f.writes(),1);f.cleanup();assert.equal(f.writes(),4);});
test('Changed consent, message, source or unrelated player blocks all cleanup writes',()=>{for(const [i,j]of [[4,3],[5,4],[4,5],[0,2]]){const f=fixture();f.rows['PLAYER STATUS DATA'][i][j]='LATER EDIT';assert.throws(f.cleanup);assert.equal(f.writes(),0);}});
test('A later STANDBY choice is never overwritten',()=>{const f=fixture();f.data.players[4].status='STANDBY';f.rows['PLAYER STATUS DATA'][4][2]='STANDBY';assert.throws(f.cleanup,/IDENTITY_OR_STATUS/);assert.equal(f.writes(),0);});
test('Changed draft blocks attendance cleanup',()=>{const f=fixture(),r=f.saved();r.draftChoices.cardLabels[0].group=9;f.overwrite(r);assert.throws(f.cleanup,/LATER_DRAFT_CHANGED/);assert.equal(f.writes(),0);});
test('Changed owner, event or protected markers blocks attendance cleanup',()=>{for(const alter of [f=>f.flags.owner=false,f=>f.event.updateTime++,f=>f.p.timeout='changed']){const f=fixture();alter(f);assert.throws(f.cleanup);assert.equal(f.writes(),0);}});
test('Failure to acquire the bounded fixture lock changes no cells',()=>{const f=fixture();let requested;const c=f.c;c.LockService.getScriptLock=()=>({tryLock:ms=>{requested=ms;return false;},releaseLock(){}});assert.throws(f.cleanup,/BUSY/);assert.equal(requested,30000);assert.equal(f.writes(),0);});
const report={result:results.every(x=>x.result==='PASS')?'PASS':'FAIL',checks:results.length,results};fs.writeFileSync(path.join(__dirname,'attendance-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.result!=='PASS')process.exitCode=1;
