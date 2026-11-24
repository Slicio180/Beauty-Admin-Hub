const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'candidate/BeautyAlternatePreflight20261122.gs'),'utf8');
const context=vm.createContext({Date});vm.runInContext(source,context);
const config=context.beautyAlternateConfig20261122_();
const ref=JSON.parse(fs.readFileSync(path.join(root,'evidence/workbook-reference.json')));
const formulaReference=JSON.parse(fs.readFileSync(process.argv[2]||path.join(root,'evidence/workbook-formulas.json'))).formulas;
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
let count=0;
function fixture(overrides={}){
 const cfg={...config,...overrides};let reads=[];
 const props=overrides.props||{};
 const tabs=config.tabs.map((t,i)=>({getName:()=>t.name,getSheetId:()=>t.id,getMaxRows:()=>1000,getLastColumn:()=>t.width,getRange:(...args)=>({getDisplayValues:()=>args[0]===1?[ref.headers[t.name]]:Array.from({length:999},()=>Array(t.width).fill('')),getValue:()=>args[0]==='A2'?new Date('2026-11-22T00:00:00Z'):'',getFormulas:()=>formulaReference})}));
 const book={getId:()=>cfg.sheetId,getName:()=>cfg.title,getFormUrl:()=>null,getSpreadsheetTimeZone:()=>cfg.timeZone,getSpreadsheetLocale:()=>cfg.locale,getSheets:()=>tabs};
 const io={scriptId:()=>cfg.scriptId,activeUser:()=>cfg.owner,effectiveUser:()=>cfg.owner,triggers:()=>[],property:k=>props[k]||null,propertyKeys:()=>Object.keys(props),openWorkbook:id=>{assert.equal(id,config.sheetId);reads.push(id);return book;},formatDate:()=>cfg.date,hash};
 return {io,tabs,book,reads};
}
function test(name,fn){fn();count++;console.log('PASS '+name);}
function rejects(name,edit,code){test(name,()=>{const f=fixture();edit(f);assert.throws(()=>context.beautyAlternatePreflightCore20261122_(f.io),new RegExp('ALTERNATE_PREFLIGHT_'+code));});}
test('empty isolated foundation reads only exact workbook',()=>{const f=fixture();const r=context.beautyAlternatePreflightCore20261122_(f.io);assert.equal(r.result,'ALTERNATE_FORMAT_FOUNDATION_VERIFIED');assert.equal(r.workbook.formulas,200);assert.equal(r.writesPerformed,false);assert.equal(r.providerRequests,0);assert.equal(r.credentials.nakkaPasswordPresent,false);assert.deepEqual(f.reads,[config.sheetId]);});
test('credentials are presence-only in report',()=>{const f=fixture({props:{N01_API_USER:'test-user',N01_API_PASSWORD:'never-print-test-secret',BEAUTY_HUB_ADMIN_UIDS:'test-uid'}});const r=context.beautyAlternatePreflightCore20261122_(f.io);assert.equal(r.credentials.nakkaPasswordPresent,true);assert(!JSON.stringify(r).includes('never-print-test-secret'));assert(!JSON.stringify(r).includes('test-user'));});
rejects('wrong project fails before workbook access',f=>{f.io.scriptId=()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N';f.io.openWorkbook=()=>assert.fail('must not read');},'OWNER_OR_PROJECT');
rejects('wrong active owner',f=>f.io.activeUser=()=> 'someone-else@example.com','OWNER_OR_PROJECT');
rejects('wrong effective owner',f=>f.io.effectiveUser=()=> 'someone-else@example.com','OWNER_OR_PROJECT');
rejects('any trigger blocks',f=>f.io.triggers=()=>[{}],'UNEXPECTED_TRIGGER');
rejects('existing event context blocks',f=>f.io.propertyKeys=()=>['BEAUTY_EVENT_CONTEXT_V1'],'UNEXPECTED_BINDING');
rejects('unexpected recovery property blocks',f=>f.io.propertyKeys=()=>['BEAUTY_BACKGROUND_CONFIG_V1'],'UNEXPECTED_BINDING');
rejects('wrong workbook id',f=>f.book.getId=()=> '1N0kp0f2kOQETylULYI685JDZH3bVKq9lG_NhoAba8lk','WORKBOOK_IDENTITY');
rejects('renamed workbook',f=>f.book.getName=()=> 'Different workbook','WORKBOOK_IDENTITY');
rejects('linked form blocks',f=>f.book.getFormUrl=()=> 'https://docs.google.com/forms/test','WORKBOOK_IDENTITY');
rejects('changed locale',f=>f.book.getSpreadsheetLocale=()=> 'sv_SE','WORKBOOK_LOCALE');
rejects('changed timezone',f=>f.book.getSpreadsheetTimeZone=()=> 'Etc/UTC','WORKBOOK_LOCALE');
rejects('extra tab blocks',f=>f.tabs.push({}),'WORKBOOK_TABS');
rejects('wrong tab id',f=>f.tabs[2].getSheetId=()=>123,'WORKBOOK_LAYOUT');
rejects('extra data column',f=>f.tabs[2].getLastColumn=()=>7,'WORKBOOK_LAYOUT');
rejects('row count changed',f=>f.tabs[2].getMaxRows=()=>999,'WORKBOOK_LAYOUT');
rejects('nonempty copied player data',f=>{const get=f.tabs[2].getRange;f.tabs[2].getRange=(...a)=>a[0]===2?{getDisplayValues:()=>[['Someone']]}:get(...a);},'WORKBOOK_NOT_EMPTY');
rejects('changed header',f=>{const get=f.tabs[2].getRange;f.tabs[2].getRange=(...a)=>a[0]===1?{getDisplayValues:()=>[['Changed']]}:get(...a);},'HEADERS_CHANGED');
rejects('changed event date',f=>f.io.formatDate=()=> '2026-11-21','DATE_CHANGED');
rejects('changed display formula',f=>{const get=f.tabs[3].getRange;f.tabs[3].getRange=(...a)=>({...get(...a),getFormulas:()=>[[]]});},'FORMULAS_CHANGED');
test('no mutation or provider API in preflight',()=>{assert(!/UrlFetchApp|setProperty\(|setProperties\(|newTrigger\(|deleteTrigger\(|setValues?\(|clearContent\(|setFormula\(|\.copy\(/.test(source));});
test('bootstrap changes only new fixed workbook line',()=>{const baseline=fs.readFileSync(path.join(root,'baseline/Code.gs'),'utf8');const candidate=fs.readFileSync(path.join(root,'candidate/Code.gs'),'utf8');const old="const SHEET_ID = typeof beautyHubWorkspaceId_==='function'?beautyHubWorkspaceId_():'1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU';";const replacement="// Separate alternate-format TEST bootstrap: fixed private workbook only.\n// Original Hub/context/write guards remain closed until an exact event is verified.\nconst SHEET_ID = '1YN1VoPCAMA0swtnHaGYjqkHpGjlcYCApu-DVL5hRtZo';";assert.equal(candidate,baseline.replace(old,replacement));new vm.Script(candidate);});
console.log(JSON.stringify({result:'PASS',tests:count,nativeRun:false}));
