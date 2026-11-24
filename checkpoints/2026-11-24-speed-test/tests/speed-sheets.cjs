const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
function fixture(baseline=false){
 let calls=0,writes=0,mode='',afterHook=null;
 const target={sheetId:'synthetic-sheet',date:'2026-11-24',revision:'current'},tonight="TONIGHT'S PLAYERS",store='PLAYER STATUS DATA';
 const rows={[tonight]:Array.from({length:99},(_,i)=>i===0?['Alice','','']:['','','']),[store]:[['Alice','','IN','JA','Synthetic note','MOBIL']]};
 const sheet=name=>({getName:()=>name,getParent:()=>({getId:()=>target.sheetId}),getRange:()=>({setValues(values){writes++;values.forEach((r,i)=>rows[tonight][i][2]=r[0]);if(afterHook)afterHook();}})});
 const s={tonight:sheet(tonight),store:sheet(store)};
 const c={console,JSON,Date,Map,Set,Error,Number,String,Object,Array,RegExp,
 beautyContextAssert_(){},beautyLiveTarget_:()=>target,
 SpreadsheetApp:{flush(){}} ,Utilities:{sleep(){}},
 beautyDisplayLookupRepair_(_s,_p,_r,guard){guard();},
 beautyLiveSheetsRead_(p){
  calls++;
  const url=new URL('https://example.invalid'+p),batch=url.pathname==='/values:batchGet';
  const ranges=batch?url.searchParams.getAll('ranges'):[decodeURIComponent(url.pathname.slice('/values/'.length))];
  const valueRanges=ranges.map(range=>{const a=range.split('!'),name=a[0].slice(1,-1).replace(/''/g,"'"),width=a[1].charCodeAt(a[1].indexOf(':')+1)-64;return {range:range+'1000',majorDimension:'ROWS',values:rows[name].map(r=>r.slice(0,width))};});
  if(!batch)return valueRanges[0];
  const data={spreadsheetId:target.sheetId,valueRanges};
  if(mode==='wrong-sheet')data.spreadsheetId='other';if(mode==='missing-range')data.valueRanges.pop();if(mode==='wrong-order')data.valueRanges.reverse();if(mode==='wrong-dimension')valueRanges[0].majorDimension='COLUMNS';if(mode==='missing-range-label')delete valueRanges[0].range;if(mode==='null-values')valueRanges[0].values=null;if(mode==='extra-column')valueRanges[0].values[0].push('unexpected');if(mode==='object-cell')valueRanges[0].values[0][0]={formula:'evil'};if(mode==='changed-context')target.revision='changed';
  return data;
 }};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,baseline?'../2026-11-24-combined-release/application/LiveRegister.gs':'application/LiveRegister.gs'),'utf8'),c);
 return {c,s,rows,target,calls:()=>calls,writes:()=>writes,mode:v=>mode=v,after:fn=>afterHook=fn,run:()=>c.beautyLiveRegistrationSync_(s,'Alice',()=>{})};
}
function test(name,fn){fn();checks.push(name);}
test('Current registration verification is equivalent with two calls instead of four',()=>{const a=fixture(true),b=fixture();a.run();b.run();assert.deepEqual(b.rows,a.rows);assert.equal(a.calls(),4);assert.equal(b.calls(),2);assert.equal(b.writes(),1);});
test('Fresh post-write read sees changed source and retries rather than accepting its old snapshot',()=>{const f=fixture();let n=0;f.after(()=>f.rows['PLAYER STATUS DATA'][0][4]='Changed '+(++n));assert.throws(f.run,/could not be verified/);assert.equal(f.calls(),10);assert.equal(f.writes(),5);});
test('A single concurrent source edit is reread on the next pass',()=>{const f=fixture();let once=true;f.after(()=>{if(once){once=false;f.rows['PLAYER STATUS DATA'][0][4]='Later message';}});f.run();assert.equal(f.calls(),4);assert.equal(f.rows['PLAYER STATUS DATA'][0][4],'Later message');});
for(const mode of ['wrong-sheet','missing-range','wrong-order','wrong-dimension','missing-range-label','null-values','extra-column','object-cell','changed-context'])test('Malformed batch '+mode+' fails before a write',()=>{const f=fixture();f.mode(mode);assert.throws(f.run);assert.equal(f.writes(),0);});
test('Repeated status identities still block display mutation',()=>{const f=fixture();f.rows['PLAYER STATUS DATA'].push(['ALICE','','OUT','NEJ','','HUB']);assert.throws(f.run,/Duplicate status/);assert.equal(f.writes(),0);});
test('A missing player is never invented to speed up verification',()=>{const f=fixture();f.rows["TONIGHT'S PLAYERS"][0]=['','',''];assert.throws(f.run,/could not be verified/);assert.equal(f.writes(),0);});
test('Wrong workbook and master-list batches are rejected locally',()=>{const f=fixture();const other={getName:()=>"TONIGHT'S PLAYERS",getParent:()=>({getId:()=> 'other'})};assert.throws(()=>f.c.beautyLiveRegistrationBatch_([{sheet:other,width:1},{sheet:f.s.store,width:6}]));const master={getName:()=>"PLAYER'S MASTER LIST",getParent:()=>({getId:()=>f.target.sheetId})};assert.throws(()=>f.c.beautyLiveRegistrationBatch_([{sheet:master,width:1},{sheet:f.s.store,width:6}]));assert.equal(f.calls(),0);});
test('Empty cells retain rectangular string padding',()=>{const f=fixture();f.rows['PLAYER STATUS DATA']=[['Alice']];const data=f.c.beautyLiveRegistrationBatch_([{sheet:f.s.tonight,width:1},{sheet:f.s.store,width:6}]);assert.equal(data[1][0].length,6);assert.equal(data[1][0][5],'');});
fs.writeFileSync(path.join(root,'evidence/speed-sheets-tests.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks,scope:'Actual baseline/candidate display verification with synthetic Sheets responses; request counts, not elapsed-time claims.'},null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
