const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Remote and kiosk HtmlService outputs set device viewport while staff routes stay unchanged',()=>{
 const src=fs.readFileSync('apps-script/registration-identity-test/remote-app/Code.js','utf8');const routes=[];
 const c=vm.createContext({BEAUTY_IDENTITY_APPROVED_SCRIPT_:'test',ScriptApp:{getScriptId:()=> 'test'},beautyHubTestGuard_(){},beautyHubCastHtml_:name=>({name,file:name,meta:[],setTitle(){return this;}}),HtmlService:{createHtmlOutputFromFile(name){const item={name,meta:[],addMetaTag(k,v){this.meta.push([k,v]);return this;},setTitle(){return this;}};routes.push(item);return item;}}});vm.runInContext(src.slice(0,src.indexOf('/* CANDIDATE ONLY')),c);
 for(const page of ['', 'remote','kiosk']){const result=c.doGet({parameter:{page}});a.equal(result.meta.length,1);a.deepEqual(Array.from(result.meta[0]),['viewport','width=device-width, initial-scale=1']);}
 for(const page of ['hub','live','stages'])a.equal(c.doGet({parameter:{page}}).meta.length,0);
 a.throws(()=>c.doGet({parameter:{page:'remote',bypass:'1'}}));
});
test('Yellow new-player selector beats legacy button specificity and attendee panel grows to content',()=>{
 const css=fs.readFileSync('public/css/beauty-picker.css','utf8'),remote=fs.readFileSync('public/css/beauty-player.css','utf8');a.match(css,/body button\.beauty-new-player[\s\S]*?background:var\(--gold\) !important; color:#000 !important/);a.match(css,/player-option \{ text-align:center; font-size:30px !important; min-height:54px/);a.match(remote,/\.tonight-modal-card \{ height:auto; max-height:calc\(100dvh - 20px\); \}/);
});
