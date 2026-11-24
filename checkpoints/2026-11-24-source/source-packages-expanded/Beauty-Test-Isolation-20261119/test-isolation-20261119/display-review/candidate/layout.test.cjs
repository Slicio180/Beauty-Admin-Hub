const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/LiveCastView.html','utf8');
for(const b of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(b[1]);
const columns=source.match(/const columns=phone\?1:[^;]+;/)[0];
const rows=source.match(/const rows=phone\?Math.max[^;]+;/)[0];
function layout(n,phone=false){return vm.runInNewContext(columns+rows+'({columns,rows})',{phone,portrait:true,wide:false,page:{players:Array(n)}})}
for(const [n,c,r]of [[1,1,1],[21,1,21],[32,1,32],[33,2,32],[64,2,32]]){const v=layout(n);assert.equal(v.columns,c);assert.equal(v.rows,r);}
assert.equal(layout(33,true).columns,1);
console.log('PASS: all script blocks parse; portrait 1/21/32/33/64 thresholds; phone stays one column.');
