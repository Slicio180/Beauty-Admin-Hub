const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 let doc;
 class Node {
  constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.attrs={};this.events={};this.style={};this.inert=false;this.hidden=false;this.value='';this.scrollTop=0;this.dataset={};this.className='';this.classList={add:c=>{this.className+=' '+c;},remove:c=>{this.className=this.className.split(' ').filter(x=>x!==c).join(' ');}};}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k]??null;}
  removeAttribute(k){delete this.attrs[k];if(k==='style')this.style={};}
  append(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  after(n){const p=this.parent;n.parent=p;p.children.splice(p.children.indexOf(this)+1,0,n);}
  contains(n){return this===n||this.children.some(c=>c.contains(n));}
  closest(){return this.parent;}
  addEventListener(type,f){(this.events[type]??=[]).push(f);}
  fire(type,event={}){for(const f of this.events[type]||[])f({target:this,...event});}
  focus(){doc.activeElement=this;}
  blur(){if(doc.activeElement===this)doc.activeElement=doc.body;}
  getClientRects(){return this.hidden?[]:[{}];}
  querySelectorAll(){const found=[];const visit=n=>{for(const c of n.children){if(['BUTTON','INPUT','TEXTAREA'].includes(c.tagName))found.push(c);visit(c);}};visit(this);return found;}
 }
 const ids={};for(const [id,tag]of [['playerDropdownMenu','div'],['playerDropdownButton','button'],['playerSearch','input'],['playerOptions','div'],['submitButton','button']])ids[id]=new Node(tag,id);
 const body=new Node('body'),page=new Node(),dropdown=new Node(),help=new Node();dropdown.append(ids.playerDropdownButton,ids.playerDropdownMenu);ids.playerDropdownMenu.append(ids.playerSearch,ids.playerOptions);page.append(dropdown,help,ids.submitButton);body.append(page);page.inert=true; // pre-existing inert must survive a close
 doc={body,activeElement:body,getElementById:id=>ids[id],querySelector:()=>help,createElement:tag=>new Node(tag),createTextNode:text=>Object.assign(new Node(),{textContent:text}),events:{},addEventListener(type,f){(this.events[type]??=[]).push(f);}};
 let selected=null,renders=0,scroll=null;const listeners={},viewport={height:700,width:390,offsetTop:0,offsetLeft:0,addEventListener(type,f){listeners[type]=f;}};
 const win={visualViewport:viewport,scrollX:0,scrollY:320,innerHeight:700,innerWidth:390,addEventListener(){},scrollTo(x,y){scroll=[x,y];}};
 const context=vm.createContext({document:doc,window:win,allPlayers:['Anna'],renderPlayerList(){renders++;},selectPlayer(n){selected=n;win.BeautyPlayerPicker.close();}});
 vm.runInContext(fs.readFileSync('public/js/player-picker.js','utf8'),context);
 const overlay=body.children.at(-1),header=ids.playerDropdownMenu.children[0];
 return {ids,body,page,doc,win,viewport,listeners,overlay,header,picker:win.BeautyPlayerPicker,get selected(){return selected;},get renders(){return renders;},get scroll(){return scroll;}};
}
test('Opening either picker focuses its title without invoking search, locks background and sets dialog semantics',()=>{
 const f=fixture();f.picker.open();assert.equal(f.overlay.hidden,false);assert.equal(f.doc.activeElement,f.header.children[0]);assert.notEqual(f.doc.activeElement,f.ids.playerSearch);assert.equal(f.body.style.position,'fixed');assert.equal(f.ids.playerDropdownButton.attrs['aria-expanded'],'true');assert.equal(f.ids.playerDropdownMenu.attrs['aria-modal'],'true');assert.equal(f.page.inert,true);
});
test('Picking a name closes, blurs search, clears filtering, restores scroll and original inert state',()=>{
 const f=fixture();f.picker.open();f.ids.playerSearch.focus();f.ids.playerSearch.value='ann';f.picker.close();assert.equal(f.overlay.hidden,true);assert.equal(f.ids.playerSearch.value,'');assert.equal(f.doc.activeElement,f.ids.playerDropdownButton);assert.deepEqual(f.scroll,[0,320]);assert.equal(f.page.inert,true);assert.equal(f.body.style.position,undefined);assert.equal(f.renders,1);assert.equal(f.ids.playerDropdownButton.attrs['aria-expanded'],'false');
});
test('New-player action is outside results, stays visible while filtering and preserves canonical sentinel',()=>{
 const f=fixture();assert.equal(f.header.children.at(-1).textContent,'MITT NAMN FINNS INTE I LISTAN');assert(!f.ids.playerOptions.contains(f.header.children.at(-1)));f.picker.open();f.header.children.at(-1).fire('click');assert.equal(f.selected,'MITT NAMN FINNS INTE I LISTAN');assert.equal(f.overlay.hidden,true);
});
test('Keyboard viewport resize keeps picker at visible top; Done dismisses input without submitting',()=>{
 const f=fixture();f.picker.open();f.viewport.height=430;f.viewport.offsetTop=25;f.listeners.resize();assert.equal(f.overlay.style.height,'430px');assert.equal(f.overlay.style.top,'25px');f.ids.playerSearch.focus();let prevented=false;f.ids.playerSearch.fire('keydown',{key:'Enter',preventDefault(){prevented=true;}});assert(prevented);assert.equal(f.doc.activeElement,f.header.children[0]);assert.equal(f.overlay.hidden,false);
});
test('Escape/backdrop close safely, and repeated closing cannot change restored scroll',()=>{
 const f=fixture();f.picker.open();f.doc.events.keydown[0]({key:'Escape',preventDefault(){}});assert(f.overlay.hidden);f.picker.close();assert.deepEqual(f.scroll,[0,320]);f.picker.open();f.overlay.fire('click');assert(f.overlay.hidden);
});
test('Tab remains inside modal, and names and helper text are inserted literally',()=>{
 const f=fixture();f.picker.open();let prevented=false;f.doc.events.keydown[0]({key:'Tab',shiftKey:false,preventDefault(){prevented=true;}});assert(prevented);assert.equal(f.doc.activeElement,f.header.children[1]);assert.match(f.header.children[3].children[0].textContent,/FÖRSTA GÅNGEN HÄR/);
});
for(const file of ['RemoteRegistration.html','KioskTest.html'])test(file+' selection keeps canonical name, closes picker and continues existing new-player path',()=>{
 const h=fs.readFileSync('apps-script/registration-identity-test/remote-app/'+file,'utf8');const a=h.indexOf('function selectPlayer('),b=h.indexOf('function filterPlayers(',a);const nodes={playerName:{value:''},playerDropdownText:{textContent:''},playerSearch:{value:'ann'}};let closed=0,changed=0;const c=vm.createContext({document:{getElementById:id=>nodes[id]},BeautyPlayerPicker:{close(){closed++;}},allPlayers:['Anna'],renderPlayerList(){},playerChanged(){changed++;}});vm.runInContext(h.slice(a,b),c);c.selectPlayer('Anna');assert.equal(nodes.playerName.value,'Anna');assert.equal(nodes.playerDropdownText.textContent,'Anna');assert.equal(nodes.playerSearch.value,'');assert.equal(closed,1);assert.equal(changed,1);c.selectPlayer('MITT NAMN FINNS INTE I LISTAN');assert.equal(nodes.playerName.value,'MITT NAMN FINNS INTE I LISTAN');assert.equal(changed,2);
});
