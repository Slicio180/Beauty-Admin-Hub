/* Local preview only. In-memory fixtures; no credentials, persistence or network. */
(()=>{
 let state={configured:false,players:[],events:[]};
 window.AikInternalClient=Object.freeze({
  mode:'preview',valid:()=>true,
  async request(action,input={}){
   if(action==='setup'){state.configured=true;}
   else if(action==='read'){}
   else if(!state.configured)throw Error('Skapa testlistan först.');
   else if(action==='addPlayer'){
    const name=beautyAikText_(input.name,100);
    if(state.players.some(p=>p.name.toLocaleLowerCase('sv-SE')===name.toLocaleLowerCase('sv-SE')))throw Error('Player already exists.');
    state.players.push({id:crypto.randomUUID(),name,active:true});
   }else if(action==='saveDraft'){
    const draft=beautyAikDraft_(input,state.players),old=state.events.find(e=>e.id===draft.id);
    if(old&&JSON.stringify(old)!==JSON.stringify(draft))throw Error('Save identifier already used for a different draft.');
    if(!old)state.events.push(draft);
   }else throw Error('Unsupported preview action.');
   return JSON.parse(JSON.stringify(state));
  }
 });
})();
