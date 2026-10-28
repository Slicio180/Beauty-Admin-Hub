const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function build(){
 const entries=Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'hub-english-strings.json')))).sort((a,b)=>b[0].length-a[0].length);
 for(const name of ['name-resolution','identity-dialog']){
  let source=fs.readFileSync(path.join(root,'public/js/'+name+'.js'),'utf8');
  for(const [sv,en]of entries)source=source.split(sv).join(en);
  const file=path.join(root,'public/js/'+name+'-en.js');
  const output='/* Generated English Hub copy; Swedish remote/kiosk source is preserved. */\n'+source;
  if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==output)fs.writeFileSync(file,output);
 }
}
module.exports={build};if(require.main===module)build();
