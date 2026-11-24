'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function buildPreview(){
 const server=fs.readFileSync(path.join(__dirname,'BeautyAikInternal.js'),'utf8');
 const model=server.slice(0,server.indexOf('function beautyAikWorkbook_()'));
 if(!model.includes('function beautyAikDraft_'))throw Error('Validation source missing');
 new vm.Script(model);
 const ui=fs.readFileSync(path.join(__dirname,'AIKInternal.html'),'utf8');
 const adapter=fs.readFileSync(path.join(__dirname,'PreviewClient.js'),'utf8');new vm.Script(adapter);
 return '<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AIK Internt — lokal förhandsvisning</title><style>body{margin:0;padding:24px;background:#111;color:#fff;font:18px/1.5 Arial,sans-serif}header{max-width:960px;margin:auto}h1{color:#ffd700}button{background:#000;color:#ffd700;border:1px solid #ffd700;padding:12px;border-radius:8px;font:inherit}*{box-sizing:border-box}</style></head><body><header><h1>AIK Internt</h1><p>LOKAL FÖRHANDSVISNING — ingen inloggning, Google-arbetsbok eller Nakka-anslutning.</p><p>Endast testnamn. Allt försvinner när sidan laddas om. Sparade utkast gäller endast denna förhandsvisning.</p><button id="openPreview">Öppna AIK Internt</button></header><script>'+model+'\n'+adapter+'</script>'+ui+'<script>document.getElementById("openPreview").onclick=()=>BeautyAikInternal.open();BeautyAikInternal.open();</script></body></html>';
}
function handler(html,port){return(req,res)=>{
 if(req.headers.host!=='127.0.0.1:'+port){res.writeHead(403);res.end('Local address required');return;}
 if(req.method!=='GET'||!['/','/favicon.ico'].includes(req.url)){res.writeHead(404);res.end('Not found');return;}
 if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",'X-Content-Type-Options':'nosniff'});res.end(html);
};}
if(require.main===module){const port=4178,app=http.createServer(handler(buildPreview(),port));app.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port 4178 is busy. Close the previous AIK preview terminal with Control+C, then retry.':'Preview could not start: '+e.code);process.exitCode=1;});app.listen(port,'127.0.0.1',()=>{console.log('AIK INTERNAL — LOCAL PREVIEW ONLY\nOpen http://127.0.0.1:4178\nUse test names only. Reload clears all preview data.\nNo Google, Nakka, Beauty or credential changes.\nKeep this terminal open. Press Control+C to stop.');});}
module.exports={buildPreview,handler};
