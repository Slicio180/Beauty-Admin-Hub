const {test}=require('node:test'),assert=require('node:assert/strict');
const {harness}=require('./fixtures/nakka-transfer-runtime.cjs');
function standalone(){
 const h=harness();h.context.beautyContextStandalone_=()=>true;h.context.beautyHubLeagueId_=()=>'';delete h.state.event.lgid;
 const original=h.context.UrlFetchApp.fetch;
 h.context.UrlFetchApp.fetch=(url,options)=>{
  assert(!url.includes('/league/'),'Standalone event must never call a league endpoint');
  if(options.method==='post'){
   const p=JSON.parse(options.payload);assert.equal(p.tdid,h.state.event.tdid);assert.equal(p.add.length,1);assert.deepEqual(Object.keys(p.add[0]),['name']);
   h.calls.push({url,options});const entry={name:p.add[0].name,tpid:'p'+String(h.state.entries.length+1).padStart(3,'0')};h.state.entries.push(entry);h.state.event.updateTime++;
   return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({result:0,added:[entry]})};
  }
  return original(url,options);
 };
 return h;
}
test('Standalone registration transfer sends only the selected tournament ID and name',()=>{
 const h=standalone(),preview=h.preview();assert.equal(preview.success,true);assert.equal(preview.identity.lpid,'');const saved=h.save(preview);assert.equal(saved.success,true);assert.equal(saved.readbackVerified,true);assert.equal(h.posts().length,1);assert(h.calls.every(c=>!c.url.includes('/league/')));
});
test('Standalone players have independent transfer journals and cannot collide on an empty league ID',()=>{
 const h=standalone();assert.equal(h.save(h.preview()).success,true);h.state.hub.push({name:'Bella',status:'IN'});const p=h.call('preview',{player:'Bella'});assert.equal(p.success,true);const r=h.call('save',{player:'Bella',ticket:p.ticket,confirmed:'true'});assert.equal(r.success,true);assert.equal(h.state.entries.length,2);assert.equal([...h.props.keys()].filter(k=>k.startsWith('BEAUTY_NAKKA_TRANSFER_')).length,2);
});
test('Standalone duplicate entries are reused without adding a league member or a second entry',()=>{
 const h=standalone();h.state.entries=[{name:'Anna',tpid:'p001'}];const p=h.preview();assert.equal(p.status,'ALREADY_PRESENT');assert.equal(h.posts().length,0);
});
test('A league event cannot be transferred through a standalone context',()=>{
 const h=standalone();h.state.event.lgid='lg_Real_1234';assert.equal(h.preview().success,false);assert.equal(h.posts().length,0);
});
test('Changing the event between preview and save blocks the transfer',()=>{
 const h=standalone(),p=h.preview();h.state.event.tdid='t_Changed_1234';assert.equal(h.save(p).success,false);assert.equal(h.posts().length,0);
});
