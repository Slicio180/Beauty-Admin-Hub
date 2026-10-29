/* Build the standalone read-only TEST stage page with embedded original AIK assets. */
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function build(){
 let html=read('public/competition-preview.html'),fonts=read('public/css/style.css').split('* {')[0];
 fonts=fonts.replace(/url\("([^"\n]+)"\)/g,(_,asset)=>'url("data:font/woff2;base64,'+fs.readFileSync(path.resolve(root,'public/css',asset)).toString('base64')+'")');
 html=html.replace('<body>','<body data-stage-mode="test-live">').replace('SYNTHETIC REVIEW','NAKKA · TEST').replace('<p id="eventTitle">Example competition · not live</p>','<p id="eventTitle">Fixed TEST event</p>').replace('Synthetic preview · not live. Load TEST explicitly to read Nakka.','Loading fixed TEST event…');
 html=html.replace('<head>','<head><base target="_top">').replace('<link rel="stylesheet" href="css/style.css">','<style>'+fonts+'</style>').replace('<link rel="stylesheet" href="css/competition-preview.css">','<style>'+read('public/css/competition-preview.css')+'</style>');
 html=html.replace('assets/logo/aik-crest.svg','data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'public/assets/logo/aik-crest.svg')).toString('base64'));
 html=html.replace(/<script src="([^"\n]+)"><\/script>/g,(_,file)=>'<script>\n'+read('public/'+file).replace(/<\/script/gi,'<\\/script')+'\n</script>');
 fs.writeFileSync(path.join(root,'apps-script/registration-identity-test/remote-app/StageTest.html'),html);
}
module.exports={build};if(require.main===module){build();console.log('Generated fixed read-only StageTest.html.');}
