/* Exact native ordinal-rank import contract; never derive ranks from points.
 * Not enabled in the casting feed until a native full-league export is reviewed.
 */
'use strict';
const crypto=require('node:crypto'),league='lg_tM2v_3523';
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function identity(profiles){
 if(!Array.isArray(profiles)||!profiles.length||profiles.length>1000)throw Error('Full league profiles required.');
 const seen=new Set();return profiles.map(p=>{if(!p||typeof p.lpid!=='string'||!/^[A-Za-z0-9]{4}$/.test(p.lpid)||seen.has(p.lpid)||!Number.isFinite(p.points))throw Error('Unique league identities and verified points required.');seen.add(p.lpid);return [p.lpid,p.points];}).sort((a,b)=>a[0].localeCompare(b[0]));
}
function qualify(input,profiles,now=Date.now()){
 if(input?.schemaVersion!==1||input.leagueId!==league||input.source!=='native-league-ranking'||input.reviewedAgainstNative!==true||typeof input.evidenceReference!=='string'||!input.evidenceReference.trim()||input.evidenceReference.length>300||!Array.isArray(input.rows))throw Error('Explicit reviewed native league ranking required.');
 const at=Date.parse(input.capturedAt);if(!Number.isFinite(at)||at>now||now-at>=300000)throw Error('Capture a current native ranking.');
 const full=identity(profiles),points=new Map(full),seen=new Set();
 if(input.rows.length!==full.length)throw Error('Ranking must cover the full league, not tonight’s subset.');
 const rows=input.rows.map(p=>{
  if(!p||!points.has(p.lpid)||seen.has(p.lpid)||!Number.isInteger(p.rank)||p.rank<1||p.rank>full.length||p.points!==points.get(p.lpid))throw Error('Native identities, ordinal ranks or totals do not match.');seen.add(p.lpid);return {lpid:p.lpid,rank:p.rank,points:p.points};
 });
 // Preserve supplied ordinal ranks, including equal ranks; no alphabetical or
 // selected-roster ranking. Rank numbering rules are provider-owned.
 rows.sort((a,b)=>a.rank-b.rank||a.lpid.localeCompare(b.lpid));
 const snapshot={schemaVersion:1,leagueId:league,source:input.source,evidenceReference:input.evidenceReference.trim(),capturedAt:input.capturedAt,expiresAt:at+300000,profileDigest:digest(full),rows};
 return {...snapshot,digest:digest(snapshot)};
}
function resolve(snapshot,profiles,now=Date.now()){
 try{const {digest:proof,...body}=snapshot;if(proof!==digest(body)||body.leagueId!==league||body.schemaVersion!==1||body.source!=='native-league-ranking'||!Number.isFinite(body.expiresAt)||now>=body.expiresAt||now<Date.parse(body.capturedAt)||body.profileDigest!==digest(identity(profiles)))return null;
  // Revalidate rows after storage, rather than trusting a checksum as authority.
  const checked=qualify({...body,reviewedAgainstNative:true},profiles,now);return Object.fromEntries(checked.rows.map(p=>[p.lpid,p.rank]));
 }catch{return null;}
}
module.exports={qualify,resolve};
