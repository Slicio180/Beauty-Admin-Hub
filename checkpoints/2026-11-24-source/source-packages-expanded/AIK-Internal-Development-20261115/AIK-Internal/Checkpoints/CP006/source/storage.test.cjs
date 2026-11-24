const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),P=require('./PoolPlanner.js');
const context={require,__dirname,console};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/test.cjs','utf8').split('const e=env();')[0],context);const e=vm.runInContext('env()',context);e.c.AikPoolPlanner=P;let count=0;
function check(name,fn){fn();console.log('PASS '+name);count++;}
e.call('setup');for(const name of ['A','B','C','D'])e.call('addPlayer',{name});const ids=e.call('read').players.map(p=>p.id);
check('dedicated rating storage survives separate reads',()=>{ids.forEach((id,i)=>e.call('setRating',{id,rating:{average:40+10*i,source:'manual',asOf:'2026-11-16'}}));assert.equal(e.call('read').players[2].rating.average,60);});
const input={requestId:'12345678-1234-1234-1234-123456789012',title:'Persist',date:'2026-11-16',kind:'km',format:'singles',entries:ids.map(id=>[id])};e.call('saveDraft',input);let event=e.call('read').events[0];const plan=P.balanced(event,2);
check('pool plan writes only dedicated workbook and reads back',()=>{e.call('savePlan',plan);assert.equal(e.call('read').plans[event.id].groups.length,2);assert.ok(e.accesses.every(x=>x==='AIK'));});
check('same plan retry does not append duplicate record',()=>{const n=e.books.AIK.getSheetByName('AIK PLANS').getLastRow();e.call('savePlan',plan);assert.equal(e.books.AIK.getSheetByName('AIK PLANS').getLastRow(),n);});
check('average update preserves saved event and retry',()=>{e.call('setRating',{id:ids[0],rating:{average:99,source:'manual',asOf:'2026-11-16'}});e.call('saveDraft',input);assert.equal(e.call('read').events[0].entries[0][0].rating.average,40);});
check('invalid plan cannot append',()=>{const n=e.books.AIK.getSheetByName('AIK PLANS').getLastRow();assert.throws(()=>e.call('savePlan',{...plan,groups:[[0,0],[2,3]]}),/exactly once/);assert.equal(e.books.AIK.getSheetByName('AIK PLANS').getLastRow(),n);});
check('clearing average returns unrated',()=>{e.call('setRating',{id:ids[0],rating:null});assert.equal(e.call('read').players[0].rating,undefined);});
check('setup adds missing planning sheets without deleting roster',()=>{e.books.AIK.sheets=e.books.AIK.sheets.filter(s=>!['AIK RATINGS','AIK PLANS'].includes(s.name));e.call('read');assert.equal(e.books.AIK.getSheetByName('AIK PLANS'),undefined);e.call('setup');assert.equal(e.call('read').players.length,4);assert.ok(e.books.AIK.getSheetByName('AIK PLANS'));});
check('unexpected storage headers block setup',()=>{e.books.AIK.getSheetByName('AIK RATINGS').rows[0]=['WRONG'];assert.throws(()=>e.call('setup'),/layout/);});
console.log(count+' mocked workbook checks passed; no native Google execution.');
