const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.argv[2]+'/LiveHubView.html','utf8');
const start=html.indexOf(' function renderDialog(){');
const source=html.slice(start,html.indexOf('\n function open(name)',start));
function node(){return {textContent:'',hidden:false,className:'',dataset:{},children:[],append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},querySelector(){return this.children[0]},querySelectorAll(){return []},setAttribute(k,v){this[k]=v}}}
const c={dialog:{...node(),open:true},title:node(),status:node(),detail:node(),steps:node(),actions:node(),history:node(),mark:node(),report:node(),close:node(),selected:'Test Player',state:{players:[]},guidance:null,busy:false,notice:'',providerPaused:false,reportText:()=>'',shortReasons:{},document:{createElement:node},run:action=>c.requested=action,goToPlayer:()=>{},Date};
c.addButton=(label,fn,parent=c.actions)=>{const b={textContent:label,click:fn};parent.append(b);return b};
vm.createContext(c);vm.runInContext(source,c);
function render(p,opts={}){c.state.players=[{name:'Test Player',...p}];Object.assign(c,{busy:false,notice:'',providerPaused:false},opts);c.renderDialog();}
render({tone:'orange',code:'REGISTRATION_REVIEW',problem:'Saved display needs verification.'});
assert.equal(c.status.textContent,'Check pending');assert(!c.mark.className.includes('checking'));assert.equal(c.detail.hidden,false);assert.equal(c.history.hidden,false);assert.equal(c.detail.textContent,'Saved display needs verification.');c.actions.children[0].click();assert.equal(c.requested,'read');assert(c.actions.children.includes(c.close));
render({tone:'orange'},{busy:true});assert.equal(c.status.textContent,'Checking…');assert(c.mark.className.includes('checking'));assert.equal(c.dialog['aria-busy'],'true');
render({tone:'orange'},{notice:'No reply within 60 seconds. Check the saved result.',providerPaused:true});assert(!c.mark.className.includes('checking'));assert.match(c.detail.textContent,/60 seconds/);assert.equal(c.actions.children[0].textContent,'Check saved status');
render({tone:'red',code:'REGISTRATION_REVIEW',problem:'Last registration check: consent mismatch.'});assert.match(c.detail.textContent,/consent mismatch/);
render({tone:'green'});assert.equal(c.status.textContent,'Issue solved');assert(c.mark.className.includes('success'));
render({tone:'green'},{notice:'Reply unavailable',providerPaused:true});assert.notEqual(c.status.textContent,'Issue solved');
console.log('PASS pending status without spinner, read-only refresh, active spinner, timeout guidance, specific failure and success precedence');
