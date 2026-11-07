const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function client(reply){
 let generation=1,notice=null,done;const events={},calls=[];
 const header={after:n=>notice=n},document={getElementById:id=>id==='registerPlayerButton'?{parentElement:header}:id==='hubRegistrationResult'?notice:null,
  createElement:tag=>({tag,style:{},dataset:{},textContent:'',setAttribute(){},remove(){if(notice===this)notice=null;}}),querySelectorAll:()=>[],addEventListener:(name,fn)=>events[name]=fn};
 const runner={withSuccessHandler:fn=>{done=fn;return runner;},withFailureHandler:()=>runner,beautyHubTest:(action,input,token)=>{calls.push({action,input,token});done(reply?reply(action,input):{success:true,player:'Anna',registrationEventDate:input.eventDate,nakka:{status:'ENTRY_VERIFIED_LINK_UNEXPOSED',entryConfirmed:true,identityVerified:false,message:'Entry confirmed; exact league ID unavailable.'}});}};
 const c=vm.createContext({URL,document,BeautyHubAuth:{token:()=> 'session',generation:()=>generation,isCurrent:g=>g===generation},google:{script:{run:runner}}});
 vm.runInContext(fs.readFileSync('public/js/hub-test-services.js','utf8')+'\nglobalThis.service=BeautyHubServices;',c);events.DOMContentLoaded();
 return {service:c.service,events,calls,setGeneration:g=>generation=g,get notice(){return notice;}};
}
const result={success:true,player:'<img onerror=evil()>',registrationEventDate:'2026-10-27',nakka:{entryConfirmed:false,message:'Registered in the Hub. Nakka needs attention; do not register again.'}};
test('Automatic Hub registration feedback renders saved and Nakka attention as literal text without another action',()=>{
 const c=client();c.service.registrationSaved(result,1);assert.equal(c.notice.dataset.state,'attention');assert.equal(c.notice.tag,'p');assert.ok(c.notice.textContent.includes('<img onerror=evil()>'));assert.ok(c.notice.textContent.includes('do not register again'));assert.equal(c.calls.length,0);
 c.service.registrationSaved({...result,player:'Anna',nakka:{entryConfirmed:true,message:'Nakka entry confirmed; exact league ID unavailable.'}},1);assert.equal(c.notice.dataset.state,'confirmed');assert.ok(c.notice.textContent.includes('exact league ID unavailable'));
});
test('Automatic Hub registration feedback clears on logout and old generation cannot leak into new login',()=>{
 const c=client();c.service.registrationSaved(result,1);c.events['beauty-hub-locked']();assert.equal(c.notice,null);c.setGeneration(2);c.service.registrationSaved(result,1);assert.equal(c.notice,null);
 c.service.registrationSaved({...result,player:'New staff result'},2);const latest=c.notice;c.service.registrationSaved(result,1);assert.equal(c.notice,latest);assert.ok(c.notice.textContent.startsWith('New staff result'));
});
test('Automatic Hub registration transport preserves captured event date and separate Nakka result',async()=>{
 const c=client(),r=await(await c.service.request('https://beauty.invalid/hub?page=hubregister&selectedName=Anna&eventDate=2026-10-27')).json();
 assert.equal(c.calls.length,1);assert.equal(c.calls[0].input.eventDate,'2026-10-27');assert.equal(r.success,true);assert.equal(r.nakka.entryConfirmed,true);assert.equal(r.nakka.identityVerified,false);assert.equal(c.calls[0].action,'register');
 await assert.rejects(c.service.request('https://beauty.invalid/hub?page=hubregister&selectedName=Anna&eventDate=2026-10-27&source=HUB'),/Blocked/);assert.equal(c.calls.length,1);
});

test('Registration feedback follows event identity across activation and refresh without clearing same-event feedback',async()=>{
 let active='tournament-a';const c=client(action=>action==='read'?{success:true,eventContext:active}:{success:true,context:active});
 await c.service.context('activate');c.service.registrationSaved(result,1,active);const original=c.notice;
 await c.service.request('https://beauty.invalid/hub?page=hubdata');assert.equal(c.notice,original);
 active='league-b';await c.service.context('activate');assert.equal(c.notice,null);
 c.service.registrationSaved(result,1,'tournament-a');assert.equal(c.notice,null);
 c.service.registrationSaved(result,1,active);assert.ok(c.notice);
 active='tournament-c';await c.service.request('https://beauty.invalid/hub?page=hubdata');assert.equal(c.notice,null);
 c.service.registrationSaved(result,1,'league-b');assert.equal(c.notice,null);
});
test('Failed event activation preserves current registration feedback',async()=>{
 const c=client(()=>({success:false,error:'Event selection unavailable.'}));c.service.registrationSaved(result,1);const original=c.notice;
 await assert.rejects(c.service.context('activate'),/Event selection unavailable/);assert.equal(c.notice,original);
});
