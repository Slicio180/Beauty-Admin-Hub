const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('health menu: dashboard cards live inside separate labelled dialogs with sidebar indicators',()=>{
 for(const file of ['public/index.html','public/preview.html','apps-script/registration-identity-test/remote-app/HubTest.html']){
  const html=fs.readFileSync(file,'utf8');const main=html.match(/<main[\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main,/nakkaHealthCard|beautyHealthText|system-health/);
  assert.match(main,/id="registerPlayerButton"/);
  assert.doesNotMatch(html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1],/>Register Player</);
  for(const id of ['nakkaStatusPanel','systemStatusPanel'])assert.match(html,new RegExp('<dialog id="'+id+'"'));
  assert.match(html,/<dialog id="nakkaStatusPanel"[\s\S]*?id="nakkaHealthCard"[\s\S]*?<\/dialog>/);
  assert.match(html,/<dialog id="systemStatusPanel"[\s\S]*?id="beautyHealthText"[\s\S]*?<\/dialog>/);
  for(const id of ['nakkaNavButton','systemStatusNavButton'])assert.match(html,new RegExp('<button id="'+id+'"[^>]*data-health="waiting"'));
  assert.equal((html.match(/id="nakkaHealthDot"/g)||[]).length,1);
 }
});
test('health menu: actual buttons open their own dialog, close and restore focus',()=>{
 const nodes={};for(const id of ['nakkaNavButton','systemStatusNavButton','nakkaStatusPanel','systemStatusPanel'])nodes[id]={handlers:{},addEventListener(n,f){this.handlers[n]=f;},focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();},querySelector(){return this.button??=( {addEventListener:(n,f)=>{this.closeHandler=f;}} );}};
 vm.runInNewContext(fs.readFileSync('public/js/health-panels.js','utf8'),{document:{getElementById:id=>nodes[id]}});
 for(const [nav,panel] of [['nakkaNavButton','nakkaStatusPanel'],['systemStatusNavButton','systemStatusPanel']]){
  nodes[nav].handlers.click();assert.equal(nodes[panel].open,true);nodes[panel].closeHandler();assert.equal(nodes[panel].open,false);assert.equal(nodes[nav].focused,true);
 }
});
test('health menu: backend dot follows TEST success, failure and recovery; demo is never green',()=>{
 const nodes={};for(const id of ['systemStatusNavButton','beautyHealthDot','beautyHealthText','beautyHealthMessage']){
  const attrs={},classes=new Set(['waiting']);nodes[id]={attrs,classes,setAttribute(k,v){attrs[k]=v;},classList:{add(...s){s.forEach(x=>classes.add(x));},remove(...s){s.forEach(x=>classes.delete(x));}}};
 }
 const source=fs.readFileSync('public/js/app.js','utf8');const start=source.indexOf('function setBeautyConnected()');const end=source.indexOf('function ',source.indexOf('function setBeautyDisconnected(')+10);
 const ctx={document:{getElementById:id=>nodes[id]},BeautyHubServices:{mode:'test'},window:{}};
 vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 ctx.setBeautyConnected();assert.equal(nodes.systemStatusNavButton.attrs['data-health'],'ok');assert.ok(nodes.beautyHealthDot.classes.has('ok'));
 ctx.setBeautyDisconnected('test failure');assert.equal(nodes.systemStatusNavButton.attrs['data-health'],'problem');assert.ok(!nodes.beautyHealthDot.classes.has('ok'));
 ctx.setBeautyConnected();assert.ok(!nodes.beautyHealthDot.classes.has('problem'));assert.equal(nodes.systemStatusNavButton.attrs['data-health'],'ok');
 ctx.BeautyHubServices.mode='mock';ctx.setBeautyConnected();assert.equal(nodes.systemStatusNavButton.attrs['data-health'],'waiting');assert.ok(!nodes.beautyHealthDot.classes.has('ok'));
});
