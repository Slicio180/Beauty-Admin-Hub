/* Local preview only. In-memory fixtures; no credentials, persistence or network. */
(()=>{
 let state={configured:false,players:[],events:[],plans:{}};
 window.AikInternalClient=Object.freeze({
  mode:'preview',valid:()=>true,
  async request(action,input={}){
   if(action==='setup'){state.configured=true;}
   else if(action==='read'){}
   else if(!state.configured)throw Error('Create the test list first.');
   else if(action==='addPlayer'){
    const name=beautyAikText_(input.name,100);
    if(state.players.some(p=>p.name.toLocaleLowerCase('sv-SE')===name.toLocaleLowerCase('sv-SE')))throw Error('Player already exists.');
    state.players.push({id:crypto.randomUUID(),name,active:true});
   }else if(action==='bulkAddPlayers'){
    const review=beautyAikBulkReview_(input.text,state.players);
    if(review.invalid.length)throw Error('Review and remove invalid lines before adding players.');
    state.players.push(...review.accepted.map(name=>({id:crypto.randomUUID(),name,active:true})));
    return JSON.parse(JSON.stringify({...state,bulkAdded:review.accepted.length}));
   }else if(action==='setRating'){
    const player=state.players.find(p=>p.id===input.id);
    if(!player)throw Error('Player not found.');
    if(input.rating!==null){if(input.rating?.source!=='manual')throw Error('Only manual averages are supported in this preview.');AikPoolPlanner.rating({...player,rating:input.rating});}
    player.rating=input.rating===null?null:JSON.parse(JSON.stringify(input.rating));
   }else if(action==='saveDraft'){
    const old=state.events.find(e=>e.id===input.requestId);
    const players=old?state.players.map(p=>{const saved=old.entries.flat().find(q=>q.id===p.id);return saved?{...p,rating:saved.rating||null}:p;}):state.players;
    const draft=beautyAikDraft_(input,players);
    if(old&&beautyAikDraftChanged_(old,draft))throw Error('Save identifier already used for a different draft.');
    if(!old)state.events.push(draft);
   }else if(action==='savePlan'){
    const event=state.events.find(e=>e.id===input.eventId);
    if(!event)throw Error('Tournament not found.');
    AikPoolPlanner.validate(event,input);
    state.plans[event.id]=JSON.parse(JSON.stringify({...input,status:'REVIEWED_LOCAL'}));
   }else throw Error('Unsupported preview action.');
   return JSON.parse(JSON.stringify(state));
  }
 });
})();
