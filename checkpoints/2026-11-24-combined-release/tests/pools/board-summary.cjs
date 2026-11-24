const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {fixture,candidate,clone}=require('./fixture.cjs');
const html=fs.readFileSync(path.join(candidate,'LiveHubView.html'),'utf8');
const ui=html.slice(html.indexOf('/* Identity TEST seeded Pool Planner.'));
const fragment=(start,end)=>ui.slice(ui.indexOf(start),ui.indexOf(end,ui.indexOf(start)));
const actual=fragment(' function displayedBoardCount(', ' function renderEstimate(')+fragment(' function boardInput(', ' function seedBoardChoices(');
function setup(n=6){
 const f=fixture(n),frozen=f.draw();assert.equal(frozen.success,true);
 const controls=new Map(),node=()=>({value:'',textContent:'',dataset:{},attributes:{},replaceChildren(){},setAttribute(k,v){this.attributes[k]=v;}});
 const q=key=>{if(!controls.has(key))controls.set(key,node());return controls.get(key);};
 q('[data-draw-scheme]').value='preferredPlan';q('[data-size]').value='3';
 const selected={pools:frozen.draw.pools.length,three:0,four:0,five:0};
 const c={Set,Number,String,Math,root:{BeautyPoolBoards:f.c.BeautyPoolBoards,beautyHubData:{eventDate:'2026-11-21'}},BeautyPoolPlanner:{eventCount:()=>n},
  frozen,workflow:null,boardChoices:clone(frozen.draftChoices.boardChoices),state:{stats:{fresh:true}},hubAvailable:true,
  selectedBoards:()=>[5,6],currentPlan:()=>({boards:2,preferredPlan:selected}),panel:{querySelector:q,querySelectorAll:()=>[]},host:{querySelector:q},renderEstimate(){},disable(){}};
 vm.createContext(c);vm.runInContext(actual,c);return {c,q,f,render:()=>{c.renderSettings();return q('[data-boards-needed]').textContent;}};
}
const checks=[];function test(name,fn){fn();checks.push(name);}
test('Periodic settings render keeps one board when two pools share it',()=>{
 const u=setup();for(const p of u.c.frozen.draw.pools)u.c.boardChoices[p.id]={count:1,boards:[6]};
 assert.equal(u.render(),'1');assert.equal(u.render(),'1');assert.equal(u.q('[data-boards-needed]').attributes['aria-label'],'1 boards used by this plan');
});
test('Distinct assigned boards count separately',()=>{const u=setup();assert.equal(u.render(),'2');});
test('Four-player pool on two boards counts both actual boards',()=>{const u=setup(4);u.c.boardChoices[0]={count:2,boards:[5,6]};assert.equal(u.render(),'2');});
test('An incomplete four-player board choice never displays a misleading estimate',()=>{const u=setup(4);u.c.boardChoices[0]={count:0,boards:[5]};assert.equal(u.render(),'—');});
test('An unavailable actual board never displays a misleading estimate',()=>{const u=setup();u.c.boardChoices[0]={count:1,boards:[99]};assert.equal(u.render(),'—');});
test('Before a draw exists, the planning estimate remains available',()=>{const u=setup();u.c.frozen=null;assert.equal(u.render(),'2');});
test('Saved sent workflow uses its actual assignment count',()=>{const u=setup();u.c.workflow={draw:u.c.frozen.draw};u.c.frozen=null;for(const p of u.c.workflow.draw.pools)u.c.boardChoices[p.id]={count:1,boards:[5]};assert.equal(u.render(),'1');});
fs.writeFileSync(path.join(__dirname,'board-summary-results.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks,scope:'Extracted actual settings renderer, actual board-allocation logic and valid server-generated draws with simulated DOM. Native acceptance of this follow-up remains pending.'},null,2));
console.log('PASS:',checks.length,'board-summary regression checks');
