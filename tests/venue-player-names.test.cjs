const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const names=require('../public/js/venue-player-names.js');
test('pool display name split preserves multipart surnames and leaves single-name second line empty',()=>{
 assert.deepEqual(names.split('Alessio Tampella'),{full:'Alessio Tampella',first:'Alessio',surname:'Tampella'});
 assert.deepEqual(names.split('Emanuel Pettersson-Lyredal'),{full:'Emanuel Pettersson-Lyredal',first:'Emanuel',surname:'Pettersson-Lyredal'});
 assert.equal(names.split('Robert Nilsson (AIK)').surname,'Nilsson (AIK)');assert.equal(names.split('Anna').surname,'');
});
test('pool display truncates to one full stop without changing fitting names or splitting graphemes',()=>{
 assert.equal(names.shorten('Tampella',s=>s.length<=8),'Tampella');assert.equal(names.shorten('Pettersson-Lyredal',s=>s.length<=10),'Pettersso.');assert.equal(names.shorten('',()=>true),'');assert.equal(names.shorten('Långt',s=>s.length<=1),'.');
 const accented='A\u030Aslund';const out=names.shorten(accented,s=>[...new Intl.Segmenter('sv',{granularity:'grapheme'}).segment(s)].length<=3);assert.equal(out,'A\u030As.');
});
test('pool name rendering keeps two bounded lines full-name accessibility and separate average',()=>{
 let shown=false;const make=(tag='span')=>({tag,children:[],dataset:{},attributes:{},handlers:{},classList:{add(){}},clientWidth:8,appendChild(n){this.children.push(n);return n;},replaceChildren(){this.children=[];},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.handlers[k]=f;},focus(){},get scrollWidth(){return (this.textContent||'').length;}});
 const name=make(),average=make(),doc={createElement:make,getElementById:()=>null,body:{appendChild(n){n.showModal=()=>shown=true;n.append=(...ns)=>n.children.push(...ns);}}};
 name.textContent='Alessio Pettersson-Lyredal';average.textContent='54.43';const cell={querySelector:()=>name},host={ownerDocument:doc,querySelectorAll:()=>[cell]};names.apply(host);
 assert.equal(name.children.length,2);assert.equal(name.children[0].textContent,'Alessio');assert.equal(name.children[1].textContent,'Petters.');assert.equal(name.attributes['aria-label'],'Alessio Pettersson-Lyredal');assert.equal(name.attributes.title,name.attributes['aria-label']);assert.equal(average.textContent,'54.43');
 const css=fs.readFileSync('public/css/venue-live.css','utf8');assert.match(css,/height:42px;min-height:42px;max-height:42px/);assert.match(css,/white-space:nowrap;overflow:hidden/);assert.equal(typeof name.handlers.click,'function');assert.equal(typeof name.handlers.keydown,'function');
});
