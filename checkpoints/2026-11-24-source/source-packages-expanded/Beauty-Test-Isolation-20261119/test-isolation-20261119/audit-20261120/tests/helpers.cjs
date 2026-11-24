const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),Module=require('module');
const a=path.resolve(__dirname,'..');
const m=new Module('audit-acorn');m._compile(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],'audit-acorn');
const acorn=m.exports;
const context={version:1,mode:'league',sheetId:'1l9CVAuawT5oYRsJ1zJKH88YxGAbfJ0O-B13geNPEodY',leagueId:'lg_M2wQ_4189',eventId:'t_Ct8A_4669',date:'2026-11-16',revision:'bf47294bbeb342a1a5fabaebe92e6a27',title:'AIK Hub TEST Removal 2026-11-16.'};
const source=(name,candidate=true)=>fs.readFileSync(path.join(a,candidate&&fs.existsSync(path.join(a,'candidate',name))?'candidate':'baseline',name),'utf8');
function runtime(candidate=true){
 const data={BEAUTY_EVENT_CONTEXT_V1:JSON.stringify(context),N01_API_USER:'synthetic',N01_API_PASSWORD:'synthetic'},writes=[],requests=[],cache=new Map();
 const props={getProperty:k=>data[k]??null,getProperties:()=>({...data}),setProperty:(k,v)=>{data[k]=v;writes.push({type:'property',key:k});},deleteProperty:k=>{delete data[k];writes.push({type:'deleteProperty',key:k});}};
 const utilities={getUuid:()=>crypto.randomUUID(),base64Encode:s=>Buffer.from(s).toString('base64'),base64EncodeWebSafe:s=>Buffer.from(s).toString('base64url'),computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),DigestAlgorithm:{SHA_256:'SHA_256'},newBlob:s=>({getBytes:()=>Buffer.from(s)}),formatDate:(d,tz,fmt)=>fmt==='yyyy-MM-dd'?new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d):d.toISOString(),sleep:()=>{},parseDate:s=>new Date(s+'T12:00:00Z')};
 const c={Date,console:{log(){}},PropertiesService:{getScriptProperties:()=>props},ScriptApp:{getScriptId:()=> '1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',getService:()=>({getUrl:()=> 'https://script.google.com/macros/s/SYNTHETIC/dev'})},Utilities:utilities,Session:{getScriptTimeZone:()=> 'Europe/Stockholm',getActiveUser:()=>({getEmail:()=> 'synthetic@example.invalid'})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)??null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},SpreadsheetApp:{openById(){throw Error('Unexpected sheet read');},flush(){}},UrlFetchApp:{fetch:(url,options)=>{requests.push({url,options});throw Error('Unexpected external request');}}};
 vm.createContext(c);
 const all=fs.readdirSync(path.join(a,'baseline')).filter(n=>n.endsWith('.gs')).map(n=>source(n,candidate)).join('\n');
 vm.runInContext(all,c);
 return {c,data,writes,requests,cache,props};
}
function fn(name,file,candidate=true){const s=source(file,candidate),ast=acorn.parse(s,{ecmaVersion:'latest'}),node=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);if(!node)throw Error('Function absent '+name);return s.slice(node.start,node.end);}
function script(file,includes,candidate=true){return [...source(file,candidate).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).find(s=>s.includes(includes));}
function clock(){let ms=0,id=0;const timers=new Map();return {setTimeout:(f,delay)=>{timers.set(++id,{f,due:ms+delay});return id;},clearTimeout:i=>timers.delete(i),advance(n){ms+=n;for(const [i,t]of [...timers])if(t.due<=ms){timers.delete(i);t.f();}},get size(){return timers.size;}};}
module.exports={source,runtime,context,fn,script,clock,root:a};
