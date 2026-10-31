const {test}=require('node:test'),assert=require('node:assert/strict'),view=require('../public/js/venue-pool-cards.js'),fs=require('node:fs');
class N{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.className='';this.textContent='';this.style={setProperty(k,v){this[k]=v;}};}appendChild(n){this.children.push(n);return n;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attributes[k]=v;}}
const nodes=n=>[n,...n.children.flatMap(nodes)],by=(h,c)=>nodes(h).filter(n=>n.className.split(' ').includes(c));
const doc={createElement:t=>new N(t)};
function pool(n=3,i=0){return {number:i+1,board:i+7,shared:true,group:i+1,startAverage:50,currentAverage:51,players:Array.from({length:n},(_,j)=>({id:String(j),rank:j+1,wins:1,losses:0})),matrix:Array.from({length:n},(_,j)=>({id:String(j),name:j===0?'<img onerror=bad> Svensson':'Player Surname',position:j+1,overallAverage:49.25,cells:Array.from({length:n},(_,k)=>j===k?{state:'self'}:{state:'pending'})}))};}
function render(pools,index=0){const host=new N('div');const state=view.render(doc,host,{pools,knockouts:[]},{size:6,index});return {host,state};}
test('approved pool cards show six three-player cards without fourth columns or blank rows',()=>{
 const {host,state}=render(Array.from({length:6},(_,i)=>pool(3,i)));assert.equal(state.total,1);assert.equal(by(host,'venue-pool-card').length,6);assert.equal(by(host,'empty-player-row').length,0);assert.equal(by(host,'position').length,18);assert.equal(by(host,'venue-pool-grid')[0].dataset.rows,'3');for(const t of by(host,'pool-matrix'))assert.deepEqual(nodes(t).filter(n=>n.tag==='th').map(n=>n.textContent),['#','Spelare','1','2','3','V–F','Legs','Rank']);
});
test('mixed pool page pads only the three-player neighbour of a four-player pool',()=>{
 const pools=Array.from({length:6},(_,i)=>pool(i===5?4:3,i)),original=JSON.stringify(pools),{host}=render(pools);assert.equal(by(host,'venue-pool-grid')[0].dataset.rows,'4');assert.equal(by(host,'empty-player-row').length,1);for(const row of by(host,'empty-player-row')){assert.equal(row.attributes['aria-hidden'],'true');assert.ok(nodes(row).every(n=>n.textContent===''));assert.equal(row.children.length,8);}assert.equal(by(host,'position').length,19);assert.equal(by(host,'overall-average').length,19);assert.equal(JSON.stringify(pools),original);assert.ok(by(host,'player-name').some(n=>n.textContent.includes('<img onerror=bad>')));
});
test('pool card row count follows the visible page and ranking remains provider-owned',()=>{
 const pools=Array.from({length:7},(_,i)=>pool(i===6?4:3,i));pools[0].players[0].rank=null;const a=render(pools),b=render(pools,1);assert.equal(a.host.children.length,1);assert.equal(by(a.host,'venue-pool-grid')[0].dataset.rows,'3');assert.equal(by(b.host,'venue-pool-grid')[0].dataset.rows,'4');assert.equal(by(a.host,'pool-rank')[0].textContent,'—');assert.equal(by(a.host,'qualifying-rank').length,11);assert.equal(b.state.total,2);
});
test('pool legs totals include exact result and live cells and refuse ambiguous totals',()=>{
 const p=pool().matrix[0];p.cells=[{state:'self'},{state:'result',score:2,opponentScore:0},{state:'live',score:1,opponentScore:1,live:true}];assert.deepEqual(view.legs(p),[3,1]);p.cells[2]={state:'multiple'};assert.equal(view.legs(p),null);p.cells[2]={state:'result',score:null,opponentScore:2};assert.equal(view.legs(p),null);assert.deepEqual(view.legs({cells:[{state:'self'},{state:'pending'}]}),[0,0]);
});
test('pool cards preserve paired live highlights averages and missing values without LIVE tags',()=>{
 const p=pool();p.matrix[0].cells[1]={state:'live',live:true,score:1,opponentScore:0,average:0};p.matrix[1].cells[0]={state:'live',live:true,score:0,opponentScore:1,average:null};const {host}=render([p]);assert.equal(by(host,'live-cell').length,2);assert.equal(by(host,'live-tag').length,0);assert.ok(nodes(host).some(n=>n.textContent==='(0.00)'));assert.ok(nodes(host).some(n=>n.textContent==='(—)'));assert.match(by(host,'live-cell')[0].attributes['aria-label'],/Pågående/);assert.equal(by(host,'pool-player-line').length,3);assert.equal(by(host,'pool-group-title').length,1);assert.equal(by(host,'average-value').length,2);for(const line of by(host,'pool-player-line'))assert.equal(line.children[1].className,'overall-average');
});
test('approved pool layout uses two columns fixed name slots blank padding and internal fullscreen',()=>{
 const css=fs.readFileSync('public/css/venue-live.css','utf8'),html=fs.readFileSync('public/competition-preview.html','utf8');assert.match(css,/venue-pool-grid\{grid-template-columns:repeat\(2/);assert.match(css,/empty-player-row td\{height:52px/);assert.match(css,/fixed-name-lines\{font:400 16px\/17px/);assert.match(css,/stage-stale .*live-cell\{background:transparent;box-shadow:none/);assert.ok(html.indexOf('id="castPanel"')<html.indexOf('id="fullScreen"'));assert.match(html,/js\/venue-pool-cards.js/);assert.match(css,/align-content:start;grid-template-rows:none;grid-auto-rows:236px/);assert.match(css,/\.venue-pools \.venue-pool-grid\[data-rows='4'\]\{grid-auto-rows:288px\}/);assert.match(css,/pool-card-meta h3\{font:700 22px/);
});
test('pool layout fits mixed neighbours on the observed cast viewport and keeps lower rows shorter',()=>{
 const g=view.geometry([4,3,3,3,3,3],1400,728);assert.deepEqual(g.pairs,[4,3,3]);assert.equal(g.fits,true);assert.ok(g.height<=728);assert.ok(g.heights[0]>g.heights[1]);assert.equal(g.heights[1],g.heights[2]);assert.ok(g.nameFont>=14);assert.ok(g.averageFont>=12);assert.equal(g.averageFont,Math.floor(g.rowHeight/2));assert.ok(g.nameFont>=19);
 const full=view.geometry([4,4,4,4,4,4],1400,728);assert.equal(full.fits,true);assert.equal(new Set(full.heights).size,1);
});
test('pool layout does not stretch four-group last rows and limits padding to visible neighbours',()=>{
 const a=view.geometry([4,3,3,3],1400,900),b=view.geometry([3,3,3,3],1400,900);assert.deepEqual(a.pairs,[4,3]);assert.deepEqual(a.heights,[288,236]);assert.deepEqual(b.heights,[236,236]);assert.ok(a.height<900);const g=view.geometry([4,3,3],700,0);assert.deepEqual(g.pairs,[4,3,3]);assert.equal(g.columns,1);
});

test('approved larger two-line names stay within row budget at mixed narrow and compact viewport sizes',()=>{
 for(const width of [700,1400])for(const height of [480,728,900])for(const counts of [[3,3,3,3,3,3],[4,3,3,3,3,3],[4,4,4,4,4,4]]){
  const g=view.geometry(counts,width,height);assert.ok(2*g.nameLine<=g.rowHeight-4);assert.equal(g.nameFont,g.nameLine-1);assert.ok(g.averageFont<=g.rowHeight/2);if(g.rowHeight>=50)assert.ok(g.nameFont>=22);
 }
 const css=fs.readFileSync('public/css/venue-live.css','utf8');assert.match(css,/pool-board-title h3::before\{content:'';position:absolute;left:0;right:auto;top:-5px;width:133\.333%;height:3px;background:#ffd700;border:0;box-shadow:none/);
});

test('four-group mode fills available desktop height with bounded typography and preserves six-group sizing',()=>{
 for(const counts of [[3,3,3,3],[4,3,3,3],[4,4,4,4]])for(const height of [700,900,1000]){
  const g=view.geometry(counts,1400,height,4);assert.equal(g.height,height);assert.equal(g.fits,true);assert.ok(g.rowHeight>=52);assert.equal(g.nameFont,22);assert.equal(g.averageFont,26);assert.ok(2*g.nameLine<g.rowHeight);if(counts.every(c=>c===3))assert.ok(Math.abs(g.heights[0]-g.heights[1])<=5);
 }
 assert.deepEqual(view.geometry([3,3,3,3],1400,900,6).heights,[236,236]);assert.equal(view.geometry([4,3,3,3],1400,420,4).rowHeight,40);assert.equal(view.geometry([3,3,3,3],700,900,4).columns,1);
 const host=new N('div');view.render(doc,host,{pools:[pool(),pool(),pool(),pool()],knockouts:[]},{size:4,width:1400,height:900});const grid=by(host,'venue-pool-grid')[0];assert.equal(grid.dataset.size,'4');assert.equal(grid.style.gridTemplateRows,'444px 444px');assert.equal(parseFloat(grid.style['--pool-header-caption-font'])*2,parseFloat(grid.style['--pool-header-average-font']));
 const css=fs.readFileSync('public/css/venue-live.css','utf8');assert.match(css,/average-caption\{font:700 var\(--pool-header-caption-font,12px\)/);
});

test('four-group partial pages retain the same outer card size and complete pages keep all tracks equal',()=>{
 for(const height of [728,900]){
  const full=view.geometry([3,3,3,3],1400,height,4),mixed=view.geometry([4,3,3,3],1400,height,4),last=view.geometry([3,3],1400,height,4);assert.equal(new Set(full.heights).size,1);assert.equal(new Set(mixed.heights).size,1);assert.equal(last.heights[0],full.heights[0]);assert.equal(mixed.heights[0],full.heights[0]);assert.ok(full.fits&&mixed.fits&&last.fits);
 }
 const {host}=render([pool()]);assert.ok(nodes(host).some(n=>n.textContent==='START'));assert.ok(nodes(host).some(n=>n.textContent==='NU'));const css=fs.readFileSync('public/css/venue-live.css','utf8');assert.match(css,/average-caption\{font:700 var.*'AIK Condensed'/);
});
