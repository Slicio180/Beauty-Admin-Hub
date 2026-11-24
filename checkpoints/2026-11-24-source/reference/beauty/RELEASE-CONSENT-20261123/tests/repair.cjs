const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'application/BeautyDisplayFormulaRecovery.gs'),'utf8');
const checks=[];function test(n,fn){fn();checks.push(n);}
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(consent='JA'){
 const f={writes:[],context:'event-one',calls:0,hook:null,writeMode:'normal'};
 const empty=()=>Array.from({length:100},()=>Array(6).fill(''));
 const status={name:'PLAYER STATUS DATA',values:empty(),formulas:empty(),parent:'fixture'},tonight={name:"TONIGHT'S PLAYERS",values:empty(),formulas:empty(),parent:'fixture'};
 status.values[0]=['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'];tonight.values[0]=['PLAYERS','NEW PLAYERS',...status.values[0].slice(2)];
 status.values[1]=['Synthetic Player','','IN',consent,'Keep message','MOBIL'];tonight.values[1]=['Synthetic Player','','IN','','','MOBIL'];
 const c=vm.createContext({console:{log(){}},SpreadsheetApp:{flush(){}}});vm.runInContext(source,c);
 for(let r=2;r<=100;r++)for(let col=4;col<=5;col++)tonight.formulas[r-1][col-1]=c.beautyDisplayLookupFormula_(r,col);
 tonight.formulas[1][0]='=FILTER(approved_names)';tonight.formulas[1][5]='=ARRAYFORMULA(IF(A2:A="","",IFERROR(XLOOKUP(A2:A,\'PLAYER STATUS DATA\'!A:A,\'PLAYER STATUS DATA\'!F:F,""),"")))';
 function sheet(data){return {getName:()=>data.name,getParent:()=>({getId:()=>data.parent}),getLastRow:()=>Math.max(1,...data.values.map((r,i)=>r.some(Boolean)?i+1:1)),getRange(...a){let[r,col,h=1,w=1]=a;if(typeof r==='string'){const m=/^([A-F])(\d+)$/.exec(r);assert(m);r=+m[2];col=m[1].charCodeAt(0)-64;}
  const read=formulas=>Array.from({length:h},(_,ri)=>Array.from({length:w},(_,ci)=>{const rr=r+ri-1,cc=col+ci-1;if(formulas)return data.formulas[rr][cc];if(data===tonight&&rr>0&&[3,4].includes(cc)&&data.formulas[rr][cc]===c.beautyDisplayLookupFormula_(rr+1,cc+1)){const hit=status.values.find(v=>v[0]===data.values[rr][0]);return hit?.[cc]||'';}return data.values[rr][cc];}));
  return {getFormulas:()=>read(true),getFormula:()=>read(true)[0][0],getDisplayValues:()=>read(false),getValues:()=>read(false),setFormulas(v){f.writes.push({sheet:data.name,row:r,column:col,values:clone(v)});if(f.writeMode==='before')throw Error('transport');for(let i=0;i<h;i++)for(let j=0;j<w;j++)data.formulas[r+i-1][col+j-1]=v[i][j];if(f.writeMode==='after')throw Error('reply lost');},setValues(v){f.writes.push({sheet:data.name,row:r,column:col,values:clone(v)});for(let i=0;i<h;i++)for(let j=0;j<w;j++)data.values[r+i-1][col+j-1]=v[i][j];}};
 }};}
 f.s={tonight:sheet(tonight),store:sheet(status)};f.c=c;f.status=status;f.tonight=tonight;
 f.guard=()=>{f.calls++;f.hook?.(f);return f.context;};f.run=()=>c.beautyDisplayLookupRepair_(f.s,'Synthetic Player',2,f.guard);
 f.remove=(cols=[3])=>cols.forEach(col=>{tonight.formulas[1][col]='';tonight.values[1][col]='';});return f;
}
test('Healthy layout uses one formula read with no guard or write',()=>{const f=fixture();assert.equal(f.run().repairedCells.length,0);assert.equal(f.calls,0);assert.equal(f.writes.length,0);});
for(const consent of ['JA','NEJ','N/A'])test('Missing consent restores saved '+consent+' without source changes',()=>{const f=fixture(consent),before=clone(f.status);f.remove();assert.deepEqual(Array.from(f.run().repairedCells),['D2']);assert.deepEqual(f.status,before);assert.equal(f.s.tonight.getRange(2,4).getDisplayValues()[0][0],consent);assert.equal(f.writes.length,1);f.run();assert.equal(f.writes.length,1);});
test('Missing message and consent are restored together and the exact message is retained',()=>{const f=fixture();f.status.values[1][4]='Keep  exact whitespace.  ';f.remove([3,4]);assert.deepEqual(Array.from(f.run().repairedCells),['D2','E2']);assert.equal(f.s.tonight.getRange(2,5).getDisplayValues()[0][0],'Keep  exact whitespace.  ');});
for(const consent of ['JA','NEJ','N/A'])test('Later '+consent+' is displayed instead of replaying an original choice',()=>{const f=fixture('JA');f.remove();f.status.values[1][3]=consent;f.run();assert.equal(f.status.values[1][3],consent);});
const rejects=[
 ['hardcoded consent',f=>{f.remove();f.tonight.values[1][3]='NEJ';}],
 ['different formula',f=>{f.tonight.formulas[1][3]='=A99';}],
 ['formula evaluating blank',f=>{f.tonight.formulas[1][3]='=""';}],
 ['unknown saved consent',f=>{f.remove();f.status.values[1][3]='';}],
 ['formula in source',f=>{f.remove();f.status.formulas[1][3]='="JA"';}],
 ['duplicate source identity',f=>{f.remove();f.status.values[2]=clone(f.status.values[1]);}],
 ['duplicate display identity',f=>{f.remove();f.tonight.values[2][0]='Synthetic Player';}],
 ['player moved',f=>{f.remove();f.tonight.values[1][0]='Other';}],
 ['wrong header',f=>{f.remove();f.status.values[0][3]='Changed';}],
 ['different workbook',f=>{f.remove();f.status.parent='other';}],
 ['missing source anchor',f=>{f.remove();f.tonight.formulas[1][5]='';}],
 ['changed authority',f=>{f.remove();f.hook=f=>{if(f.calls===3)f.context='event-two';};}],
 ['later source edit during checking',f=>{f.remove();f.hook=f=>{if(f.calls===3)f.status.values[1][3]='NEJ';};}],
 ['later hardcoded display edit',f=>{f.remove();f.hook=f=>{if(f.calls===3)f.tonight.values[1][3]='NEJ';};}]
];for(const[n,change]of rejects)test(n+' blocks a formula write',()=>{const f=fixture();change(f);assert.throws(f.run);assert.equal(f.writes.length,0);});
test('Lost write reply is resolved by readback with one write',()=>{const f=fixture();f.remove();f.writeMode='after';assert.equal(f.run().readbackVerified,true);assert.equal(f.writes.length,1);});
test('Failed write is not silently treated as fixed or resent',()=>{const f=fixture();f.remove();f.writeMode='before';assert.throws(f.run,/UNVERIFIED/);assert.equal(f.writes.length,1);});
test('OUT status is not resurrected by formula repair',()=>{const f=fixture();f.remove();f.status.values[1][2]='OUT';f.run();assert.equal(f.status.values[1][2],'OUT');});
test('Only the intended row changes',()=>{const f=fixture();f.remove();f.tonight.values[20][4]='Manual note';const before=clone(f.tonight);f.run();before.formulas[1][3]=f.c.beautyDisplayLookupFormula_(2,4);assert.deepEqual(f.tonight,before);});
for(const name of fs.readdirSync(path.join(root,'application')).filter(n=>n.endsWith('.gs')))test('Application '+name+' parses',()=>{new vm.Script(fs.readFileSync(path.join(root,'application',name),'utf8'));});
const result={result:'PASS',checks:checks.length,details:checks,scope:'Local behavior tests; native acceptance is separate.'};fs.writeFileSync(path.join(root,'evidence/local-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
module.exports={fixture};
