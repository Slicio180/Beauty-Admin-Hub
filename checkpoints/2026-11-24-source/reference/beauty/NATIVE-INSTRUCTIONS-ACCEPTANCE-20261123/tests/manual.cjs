const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),code=read('manual/compiled-guide.js'),data=JSON.parse(read('manual/operator-guide.json')),checks=[];
function harness(){
 const made=[],events={},navigation=[];let document;
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.dataset={};this.attributes={};this._text='';this.hidden=false;this.open=false;made.push(this);}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  append(...els){for(const el of els){el.remove();el.parent=this;this.children.push(el);}}
  appendChild(el){this.append(el);return el;}
  replaceChildren(...els){for(const e of this.children)e.parent=null;this._text='';this.children=[];this.append(...els);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null;}
  setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}
  addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);}fire(k){for(const fn of this.handlers[k]||[])fn({target:this});}
  click(){if(!this.disabled)this.fire('click');}focus(){document.activeElement=this;}
  showModal(){this.open=true;}close(){this.open=false;this.fire('close');}
  querySelectorAll(tag){return this.children.flatMap(e=>[...(e.tag===tag?[e]:[]),...e.querySelectorAll(tag)]);}
  querySelector(tag){return this.querySelectorAll(tag)[0]||null;}
 }
 const button=new Element('button'),span=new Element('span');span.textContent='Instructions';button.append(span);
 document={body:new Element('body'),head:new Element('head'),activeElement:null,
  createElement:t=>new Element(t),createElementNS:(ns,t)=>new Element(t),querySelectorAll:s=>s==='.sidebar > button'?[button]:[],
  getElementById:id=>[document.body,document.head].flatMap(function walk(e){return [e,...e.children.flatMap(walk)];}).find(e=>e.id===id)||null,
  addEventListener:(k,fn)=>(events[k]??=[]).push(fn)};
 document.body.append(button);
 const window={BeautyHubNavigation:{activate:b=>navigation.push(['activate',b]),dashboard:()=>navigation.push(['dashboard'])}};
 const c=vm.createContext({window,document,console,JSON,Object,Array,String,Number,Set,Map});vm.runInContext(code,c);
 const get=id=>document.getElementById(id),panel=()=>document.body.querySelector('dialog'),index=()=>panel().querySelector('nav').querySelectorAll('button');
 const search=q=>{const n=get('beautyManualSearch');n.value=q;n.fire('input');};
 return {document,button,navigation,get,panel,index,search,open:()=>button.click(),fire:name=>{for(const fn of events[name]||[])fn();},language:lang=>{const n=get('beautyManualLanguage');n.value=lang;n.fire('change');}};
}
function test(name,fn){try{fn();checks.push(name);}catch(e){console.error(name);throw e;}}
test('All 15 chapters have Swedish and English content and point to the original handbook',()=>{assert.equal(data.chapters.length,15);assert.equal(new Set(data.chapters.map(c=>c.id)).size,15);for(const c of data.chapters)for(const lang of ['sv','en'])assert(c[lang].title&&(c[lang].steps?.length||c[lang].table?.length));assert.equal(data.source.pageId,'page_d004fe97823c8191844a50da2d2344fd');});
test('Default instructions open in Swedish and focus the search field',()=>{const f=harness();assert.equal(f.button.textContent,'Instruktioner');f.open();assert(f.panel().open);assert.equal(f.panel().lang,'sv');assert.equal(f.index().length,15);assert.equal(f.document.activeElement.id,'beautyManualSearch');assert.equal(f.panel().getAttribute('aria-labelledby'),'beautyManualTitle');});
for(const [query,id]of [['ANMÄLAN','register'],['aterstallning','recovery'],['Where From','players'],['consent','players'],['  pool   boards  ','pools'],['lost reply','recovery'],['Nakka','nakka']])test('Search finds the expected chapter for '+query,()=>{const f=harness();f.open();f.search(query);assert(f.index().some(b=>b.dataset.chapter===id));});
test('Search terms must all match and no-result guidance is shown',()=>{const f=harness();f.open();f.search('banor nonexistentword');assert.equal(f.index().length,0);assert.match(f.get('beautyManualArticle').textContent,/Inga kapitel matchar/);});
test('Clearing search restores the complete index and search focus',()=>{const f=harness();f.open();f.search('nonsense');f.panel().querySelectorAll('button').find(b=>b.textContent==='Rensa sökning').click();assert.equal(f.index().length,15);assert.equal(f.get('beautyManualSearch').value,'');assert.equal(f.document.activeElement.id,'beautyManualSearch');});
test('Chapter selection renders full steps and moves keyboard focus to its heading',()=>{const f=harness();f.open();f.index().find(b=>b.dataset.chapter==='register').click();assert.equal(f.get('beautyManualChapterTitle').textContent,'Anmäl en spelare i hubben');assert(f.get('beautyManualArticle').querySelectorAll('li').length>=5);assert.equal(f.document.activeElement.id,'beautyManualChapterTitle');});
test('English changes labels and chapter contents without another request',()=>{const f=harness();f.open();f.index().find(b=>b.dataset.chapter==='register').click();f.language('en');assert.equal(f.panel().lang,'en');assert.equal(f.get('beautyManualTitle').textContent,'Instructions');assert.equal(f.get('beautyManualChapterTitle').textContent,'Register a player in the Hub');assert.equal(f.get('beautyManualSearch').getAttribute('aria-label'),'Search instructions');});
test('Every chapter renders in both languages with table headers and readable text',()=>{const f=harness();f.open();for(const lang of ['sv','en']){f.language(lang);for(const chapter of data.chapters){f.index().find(b=>b.dataset.chapter===chapter.id).click();assert.equal(f.get('beautyManualChapterTitle').textContent,chapter[lang].title);assert(f.get('beautyManualArticle').textContent.length>100);for(const th of f.get('beautyManualArticle').querySelectorAll('th'))assert.equal(th.scope,'col');}}});
test('Recovery diagram preserves branching and has an accessible description',()=>{const f=harness();f.open();f.index().find(b=>b.dataset.chapter==='recovery').click();const svg=f.get('beautyManualArticle').querySelector('svg');assert(svg);assert.equal(svg.getAttribute('role'),'img');assert.equal(svg.querySelectorAll('rect').length,9);assert.match(svg.querySelector('desc').textContent,/säkra reparationer/);});
test('Close restores dashboard selection and focus; reopen retains the current chapter',()=>{const f=harness();f.open();f.index().find(b=>b.dataset.chapter==='pools').click();f.panel().querySelectorAll('button').find(b=>b.textContent==='×').click();assert(!f.panel().open);assert.equal(f.document.activeElement,f.button);assert.equal(f.navigation.at(-1)[0],'dashboard');f.open();assert.equal(f.get('beautyManualChapterTitle').textContent,'Förbered pooler och bevara lottningen');assert.equal(f.document.body.querySelectorAll('dialog').length,1);});
test('Session lock removes the panel and clears shared-computer search/language state',()=>{const f=harness();f.open();f.language('en');f.search('Nakka');f.fire('beauty-hub-locked');assert.equal(f.panel(),null);f.open();assert.equal(f.get('beautyManualSearch').value,'');assert.equal(f.panel().lang,'sv');assert.equal(f.index().length,15);});
test('Search text cannot become HTML, script, an image or a provider request',()=>{const f=harness();f.open();f.search('<img src=x onerror=alert(1)>');assert.equal(f.index().length,0);assert.equal(f.panel().querySelectorAll('img').length,0);assert(!/innerHTML|insertAdjacentHTML|google\.script|fetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(code));});
test('Full handbook opens the exact existing page with safe new-tab attributes',()=>{const f=harness();f.open();const a=f.panel().querySelector('a');assert.equal(a.href,data.source.url);assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');});
test('All unrelated Hub scripts, original fonts, crest, navigation and recovery code remain exact',()=>{const a=read('baseline/HubTest.html'),b=read('candidate/HubTest.html'),old=read('manual/previous-instructions.js');assert.equal(a.replace(old,'INSTRUCTIONS'),b.replace(code+'\n','INSTRUCTIONS'));});
test('Every inline Hub script parses after integration',()=>{const html=read('candidate/HubTest.html'),scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];assert(scripts.length>10);for(const [i,m]of scripts.entries())new vm.Script(m[1],{filename:'HubTest-script-'+i});});
const result={result:'PASS',checks:checks.length,details:checks,scope:'Actual compiled operator-guide script in simulated DOM; full Hub syntax and unchanged unrelated HTML. Native layout and screen-reader acceptance remain separate.'};fs.writeFileSync(path.join(root,'evidence/manual-tests.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:result.result,checks:result.checks}));
