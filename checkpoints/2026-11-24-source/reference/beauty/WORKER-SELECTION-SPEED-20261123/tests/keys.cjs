const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixture,clone}=require('./regression/fixture.cjs');
const root=path.resolve(__dirname,'..'),read=(kind,name)=>fs.readFileSync(path.join(root,kind,name),'utf8'),checks=[];
const original=read('baseline','HubTestAttention.gs'),candidate=read('candidate','HubTestAttention.gs');
const code=fs.readFileSync(path.join(root,'../CURRENT-VERIFIED-TEST-SOURCE-20261121/Code.gs'),'utf8');
const nameStart=code.indexOf('  const clean =',code.indexOf('var BeautyNameResolution ='));
const nameCode='var BeautyNameResolution=(()=>{'+code.slice(nameStart,code.indexOf('  const error =',nameStart))+'return {key};})();';
function test(name,fn){fn();checks.push(name);}
function setup(worker='candidate',helper='candidate'){
 process.env.BEAUTY_CLAIM_SOURCE=worker;const f=fixture();delete process.env.BEAUTY_CLAIM_SOURCE;
 const src=helper==='baseline'?original:candidate;let namespaceReads=0;
 Object.assign(f.c,{SHEET_ID:f.context.sheetId,beautyHubTransferTarget_:()=>f.context.eventId,beautyHubNakkaDate_:()=>{namespaceReads++;return {date:f.context.date};}});
 vm.runInContext(nameCode+src.slice(src.indexOf('function beautyRegistrationRecoveryPrefix_'),src.indexOf('function beautyRegistrationRecoveryWrite_')),f.c);
 return {...f,namespaceReads:()=>namespaceReads,reset:()=>namespaceReads=0,receiptActual(name){const r=f.receipt(name);delete f.props['registration-'+name];f.props[f.c.beautyRegistrationRecoveryKey_(name)]=JSON.stringify(r);return r;},select:()=>clone(f.c.beautyBackgroundCandidates_(f.now()))};
}
test('Current-context keys remain identical for canonical, Unicode and whitespace variants',()=>{
 const a=setup('baseline','baseline'),b=setup();
 for(const name of ['Synthetic 06','  SYNTHETIC   06 ','Åke Öström','A\u030ake O\u0308stro\u0308m','Élodie','Ö',null,undefined,''])assert.equal(b.c.beautyRegistrationRecoveryKey_(name),a.c.beautyRegistrationRecoveryKey_(name));
});
test('Provided validated namespace produces the identical key without another context lookup',()=>{
 const f=setup(),prefix=f.c.beautyRegistrationRecoveryPrefix_();f.reset();const cached=f.c.beautyRegistrationRecoveryKey_('Åke',prefix);assert.equal(f.namespaceReads(),0);assert.equal(cached,f.c.beautyRegistrationRecoveryKey_('Åke'));assert.equal(f.namespaceReads(),1);
});
test('Ordinary calls still resolve current context every time',()=>{
 const f=setup(),old=f.c.beautyRegistrationRecoveryKey_('A');f.context.date='2026-11-22';const next=f.c.beautyRegistrationRecoveryKey_('A');assert.notEqual(old,next);assert.equal(f.namespaceReads(),2);
});
test('Malformed optional namespaces fail before any storage or provider action',()=>{
 const f=setup();for(const prefix of [null,false,12,{},'', 'registration-', 'BEAUTY_REGISTRATION_RECOVERY_V1_bad_'])assert.throws(()=>f.c.beautyRegistrationRecoveryKey_('A',prefix),/REGISTRATION_CONTEXT_CHANGED/);assert.equal(f.provider.length,0);assert.equal(f.writes.length,0);
});
test('Composed current key helper reduces six-receipt namespace resolution from thirteen calls to two',()=>{
 const a=setup('baseline','baseline'),b=setup();for(const f of [a,b]){for(let i=1;i<=6;i++)f.receiptActual('Player '+i);f.reset();}
 assert.deepEqual(b.select(),a.select());assert.equal(a.namespaceReads(),13);assert.equal(b.namespaceReads(),2);
 fs.writeFileSync(path.join(root,'evidence/namespace-read-counts.json'),JSON.stringify({result:'PASS',receipts:6,baselineNamespaceReads:a.namespaceReads(),candidateNamespaceReads:b.namespaceReads(),scope:'Actual key functions and name normalizer with synthetic context services; no elapsed-time claim'},null,2)+'\n');
});
test('Old helper with new worker and new helper with old worker remain compatible during save or rollback',()=>{
 const normal=setup(),oldHelper=setup('candidate','baseline'),oldWorker=setup('baseline','candidate');for(const f of [normal,oldHelper,oldWorker])f.receiptActual('A');assert.deepEqual(normal.select(),oldHelper.select());assert.deepEqual(normal.select(),oldWorker.select());
});
test('Only the private key helper changes in the complete attention module',()=>{
 const extract=s=>s.slice(s.indexOf('function beautyRegistrationRecoveryKey_'),s.indexOf('function beautyRegistrationRecoveryWrite_'));
 assert.equal(candidate.replace(extract(candidate),extract(original)),original);new vm.Script(candidate);
});
const result={result:'PASS',checks:checks.length,details:checks,remoteCalls:0};fs.writeFileSync(path.join(root,'evidence/key-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:'PASS',checks:checks.length}));
