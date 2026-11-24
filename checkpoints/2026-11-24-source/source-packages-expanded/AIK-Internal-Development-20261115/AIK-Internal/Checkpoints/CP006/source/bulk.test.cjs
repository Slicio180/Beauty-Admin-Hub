const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');const {buildPreview}=require('./preview.cjs');
(async()=>{const scripts=[...buildPreview().matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);scripts.forEach(s=>new vm.Script(s));const c={window:{},crypto};vm.createContext(c);vm.runInContext(scripts[0],c);const review=c.beautyAikBulkReview_;let n=0;function check(name,fn){fn();console.log('PASS '+name);n++;}
check('line endings and whitespace normalized',()=>assert.equal(review('  Test   Alfa\r\n\nTest Beta\rTest Gamma',[]).accepted.join('|'),'Test Alfa|Test Beta|Test Gamma'));
check('existing and within-paste duplicates skipped',()=>{const r=review('test alfa\nTest Beta\nTEST BETA',[{name:'Test Alfa'}]);assert.equal(r.accepted.length,1);assert.equal(r.skipped.length,2);});
check('Unicode-equivalent names skipped',()=>assert.equal(review('A\u030ake',[{name:'Åke'}]).skipped.length,1));
check('formula and multi-column rows rejected',()=>{const r=review('=SUM(1)\nTest\tOther\nTest Beta',[]);assert.equal(r.invalid.length,2);assert.equal(r.accepted.length,1);});
check('blank paste yields no additions',()=>assert.equal(review(' \n ',[]).accepted.length,0));
check('line limit enforced',()=>assert.throws(()=>review(Array(501).fill('Test').join('\n'),[]),/500/));
check('length limit enforced',()=>assert.throws(()=>review('a'.repeat(60001),[]),/500/));
const api=c.window.AikInternalClient;await api.request('setup');await api.request('addPlayer',{name:'Test Alfa'});
const r=await api.request('bulkAddPlayers',{text:'TEST ALFA\nTest Beta\nTest Gamma\nTest Beta'});check('bulk add preserves existing and adds unique names',()=>{assert.equal(r.bulkAdded,2);assert.equal(r.players.length,3);});
const again=await api.request('bulkAddPlayers',{text:'Test Beta\nTest Gamma'});check('repeat submission adds no duplicates',()=>{assert.equal(again.bulkAdded,0);assert.equal(again.players.length,3);});
await assert.rejects(()=>api.request('bulkAddPlayers',{text:'Test Delta\n=BAD'}));check('invalid submitted batch does not partially add',()=>{});assert.equal((await api.request('read')).players.length,3);
console.log(n+' bulk checks passed');})().catch(e=>{console.error(e);process.exitCode=1;});
