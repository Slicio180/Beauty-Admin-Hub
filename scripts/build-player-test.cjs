/* Inline separate TEST kiosk/remote themes and common assets; preserve registration/identity scripts. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f));
function build(){

 const logo='data:image/png;base64,'+read('public/assets/logo/aik-mandagsdartarna-clean.png').toString('base64');
 const icon='data:image/svg+xml;base64,'+read('public/assets/logo/aik-crest.svg').toString('base64');
 const names={'AIK Display':'AIKDisplay-Bold.woff2','AIK Display Light':'AIKDisplay-Light.woff2','AIK Condensed':'AIKDisplay-Condensed-Bold.woff2'};
 for(const name of ['RemoteRegistration.html','KioskTest.html']){
  const theme=read(name==='KioskTest.html'?'public/css/beauty-kiosk.css':'public/css/beauty-player.css').toString()+'\n'+read('public/css/beauty-picker.css').toString()+'\n'+read('public/css/beauty-branding.css').toString();
  const file=path.join(root,'apps-script/registration-identity-test/remote-app',name);let h=fs.readFileSync(file,'utf8');
  h=h.replace(/(@font-face\s*\{[^}]*font-family:\s*'([^']+)'[^}]*src:\s*url\(')[^']+('\))/g,(full,before,family,after)=>names[family]?before+'data:font/woff2;base64,'+read('public/assets/fonts/AIK-FONTS/'+names[family]).toString('base64')+after:full);
  h=h.replace(/<img\b[^>]*class="(?:brand-image|success-brand)"[^>]*>/g,tag=>tag.replace(/src="[^"]*"/,'src="'+logo+'"'));
  h=h.replace(/<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>/g,tag=>tag.replace(/href="[^"]*"/,'href="'+icon+'"'));
  h=h.replace(/\n?<style id="beauty-player-theme">[\s\S]*?<\/style>/,'');
  h=h.replace(/\n?<script id="beauty-player-picker">[\s\S]*?<\/script>/,'');
  h=h.replace('</body>','<script id="beauty-player-picker">\n'+read('public/js/player-picker.js').toString()+'\n</script>\n</body>');
  h=h.replace(/\n*<style id="beauty-number-font">[\s\S]*?<\/style>/,'');
  if(name==='RemoteRegistration.html')h=h.replace('</head>',"<style id=\"beauty-number-font\">@font-face{font-family:'AIK Siffror';src:url('data:font/woff2;base64,"+read('public/assets/fonts/AIK-FONTS/AIKSiffror-Regular.woff2').toString('base64')+"') format('woff2');font-weight:400;font-display:swap;}</style></head>");
  h=h.replace('</head>','<style id="beauty-player-theme">\n'+theme+'</style>\n</head>');
  if(fs.readFileSync(file,'utf8')!==h)fs.writeFileSync(file,h);
 }
}
module.exports={build};if(require.main===module)build();
