const fs=require('fs'),path=require('path'),Module=require('module');
const m=new Module('audit-acorn');m._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'audit-acorn');const acorn=m.exports;
const map=require('../baseline-paths.json'),definitions={},inventory=[];
const {source}=require('./helpers.cjs');
for(const file of Object.keys(map)){if(!file.endsWith('.gs'))continue;const s=source(file),ast=acorn.parse(s,{ecmaVersion:'latest',locations:true});const fns=ast.body.filter(n=>n.type==='FunctionDeclaration');for(const n of fns)(definitions[n.id.name]??=[]).push({file,line:n.loc.start.line});inventory.push({file,functions:fns.map(n=>n.id.name),count:fns.length});}
fs.writeFileSync(path.join(__dirname,'../evidence/top-level-functions.json'),JSON.stringify({inventory,duplicates:Object.entries(definitions).filter(([n,v])=>v.length>1)},null,2));
console.log(JSON.stringify({files:inventory.length,functions:Object.keys(definitions).length,duplicates:Object.entries(definitions).filter(([n,v])=>v.length>1)},null,2));
