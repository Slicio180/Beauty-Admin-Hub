const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('apps-script/registration-identity-test/remote-app/RemoteRegistration.html','utf8');
function client(){
 const nodes={};for(const id of ['tonightPlayerCount','tonightPlayerTotal','tonightPlayersModal','tonightPlayersLoading','tonightPlayersList'])nodes[id]={hidden:false,textContent:'',innerHTML:'',style:{},children:[],classList:{add(){},remove(){}},appendChild(n){this.children.push(n);}};
 const requests=[];let ok,fail;const runner={withSuccessHandler(f){ok=f;return this;},withFailureHandler(f){fail=f;return this;},getTonightsPlayerNames(){requests.push({ok,fail});}};
 const c=vm.createContext({Array,console:{error(){}},document:{getElementById:id=>nodes[id],createElement:()=>({})},google:{script:{run:runner}}});
 const a=html.indexOf('let tonightPlayersRequest ='),b=html.indexOf('</script>',a);vm.runInContext(html.slice(a,b),c);return {c,nodes,requests};
}
test('Mobile total uses the displayed event list and includes a truthful zero state',()=>{
 const h=client();h.c.openTonightsPlayers();assert.equal(h.nodes.tonightPlayerCount.hidden,true);h.requests[0].ok(['Anna','Östen']);assert.equal(h.nodes.tonightPlayerTotal.textContent,'2');assert.equal(h.nodes.tonightPlayerCount.hidden,false);assert.deepEqual(h.nodes.tonightPlayersList.children.map(n=>n.textContent),['Anna','Östen']);
 h.c.openTonightsPlayers();assert.equal(h.nodes.tonightPlayerCount.hidden,true);h.requests[1].ok([]);assert.equal(h.nodes.tonightPlayerTotal.textContent,'0');assert.match(h.nodes.tonightPlayersList.innerHTML,/Ingen är anmäld/);
});
test('Mobile list never presents a stale total after failure malformed data close or an older response',()=>{
 const h=client();h.c.openTonightsPlayers();h.c.openTonightsPlayers();h.requests[0].ok(['Old']);assert.equal(h.nodes.tonightPlayerCount.hidden,true);h.requests[1].fail(Error('offline'));assert.equal(h.nodes.tonightPlayerCount.hidden,true);
 h.c.openTonightsPlayers();h.requests[2].ok({length:23});assert.equal(h.nodes.tonightPlayerCount.hidden,true);assert.match(h.nodes.tonightPlayersLoading.textContent,/Kunde inte/);
 h.c.openTonightsPlayers();h.c.closeTonightsPlayers();h.requests[3].ok(['Late']);assert.equal(h.nodes.tonightPlayerCount.hidden,true);
 h.c.openTonightsPlayers();h.requests[4].ok(['<img onerror=bad>']);assert.equal(h.nodes.tonightPlayerTotal.textContent,'1');assert.equal(h.nodes.tonightPlayersList.children.at(-1).textContent,'<img onerror=bad>');
});
test('Long messages from Hub mobile and kiosk keep their full text in the Sheet without leaking into Nakka',()=>{
 const {registration,input}=require('./fixtures/hub-registration-runtime.cjs');const message=('Lång rad med åäö <b>text</b> '+ 'x'.repeat(180)+'\n').repeat(20).trim();
 for(const source of ['HUB','MOBIL','KIOSK']){const h=registration({noAuth:source!=='HUB'}),data={...input,message};const r=source==='HUB'?h.register(data):source==='MOBIL'?h.context.submitRegistration(data):h.context.submitKioskRegistration(data);assert.equal(r.success,true);assert.equal(h.rows[0][4],message);assert.equal(h.posts().length,1);assert.ok(!JSON.stringify(h.posts()).includes(message));}
});
test('Long Hub messages open from READ as literal multiline text in the scrollable popup',()=>{
 const app=fs.readFileSync('public/js/app.js','utf8'),css=fs.readFileSync('public/css/style.css','utf8');
 function node(){return {children:[],events:{},setAttribute(k,v){(this.attrs??={})[k]=v;},appendChild(n){this.children.push(n);},addEventListener(e,f){this.events[e]=f;},remove(){this.removed=true;}};}
 const body=node(),c=vm.createContext({document:{createElement:node,body}});const a=app.indexOf('function addMessageCell('),b=app.indexOf('SAFE TABLE CELL',a);vm.runInContext(app.slice(a,app.lastIndexOf('/*',b)),c);
 const row=node(),message=('Full multiline åäö <img onerror=bad>\n'+'x'.repeat(180)).repeat(20);c.addMessageCell(row,'Anna',message);const button=row.children[0].children[0];assert.equal(button.textContent,'READ');button.events.click();const popup=body.children[0].children[0];assert.equal(popup.children.at(-1).textContent,message);assert.match(css,/\.message-popup\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto/s);assert.match(css,/\.message-popup-text\s*\{[^}]*white-space:\s*pre-wrap;[^}]*overflow-wrap:\s*anywhere/s);popup.children[0].events.click();assert.equal(body.children[0].removed,true);
});
