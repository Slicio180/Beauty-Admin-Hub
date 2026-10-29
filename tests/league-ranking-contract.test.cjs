const {test}=require('node:test'),assert=require('node:assert/strict'),ranking=require('../server/league-ranking.cjs');
const now=Date.parse('2026-10-29T15:00:00Z');
const profiles=[{lpid:'aaaa',points:10},{lpid:'bbbb',points:10},{lpid:'cccc',points:0}];
const input=()=>({schemaVersion:1,leagueId:'lg_tM2v_3523',source:'native-league-ranking',reviewedAgainstNative:true,evidenceReference:'Native TEST ranking comparison, organiser review',capturedAt:new Date(now).toISOString(),rows:[{lpid:'cccc',rank:3,points:0},{lpid:'bbbb',rank:1,points:10},{lpid:'aaaa',rank:1,points:10}]});
test('native ranking contract preserves supplied full league ordinal ranks ties and zero points',()=>{
 const original=input(),r=ranking.qualify(original,profiles,now);assert.deepEqual(ranking.resolve(r,profiles,now),{aaaa:1,bbbb:1,cccc:3});assert.equal(original.rows[0].lpid,'cccc');assert.equal(r.rows.length,3);
});
test('native ranking contract refuses guessed rankings subsets duplicate identities and wrong totals',()=>{
 for(const mutate of [x=>x.reviewedAgainstNative=false,x=>x.source='sorted-points',x=>x.leagueId='other',x=>x.rows.pop(),x=>x.rows[0].lpid='aaaa',x=>x.rows[0].points=1,x=>x.rows[0].rank=0,x=>x.rows[0].rank=1.5,x=>x.evidenceReference='']){const i=input();mutate(i);assert.throws(()=>ranking.qualify(i,profiles,now));}
 assert.throws(()=>ranking.qualify(input(),[profiles[0]],now));
});
test('native ranking contract expires invalidates changed totals and rejects tampered storage',()=>{
 const r=ranking.qualify(input(),profiles,now);assert.equal(ranking.resolve(r,profiles,now+300000),null);assert.equal(ranking.resolve(r,profiles,now-1),null);assert.equal(ranking.resolve(r,profiles.map(p=>({...p,points:p.points+1})),now),null);r.rows[0].rank=2;assert.equal(ranking.resolve(r,profiles,now),null);assert.throws(()=>ranking.qualify(input(),profiles,now+300000));
});
