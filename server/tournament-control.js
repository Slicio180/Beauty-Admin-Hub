/* Staff-only fixed TEST knockout assignment. No results editing or automatic retries. */
function beautyTournamentReadAudit_(name){
 const ss=SpreadsheetApp.openById(SHEET_ID),sheet=ss.getSheetByName(name);
 if(ss.getId()!==SHEET_ID||!sheet||sheet.getLastRow()<2||sheet.getLastRow()>100)beautyPoolError_('Saved tournament audit unavailable.');
 const rows=sheet.getRange(1,1,sheet.getLastRow(),2).getValues();if(rows[0]?.[0]!=='Beauty TEST pool audit')beautyPoolError_('Saved tournament audit invalid.');
 return JSON.parse(rows.slice(1).map(r=>r[1]).join(''));
}
function beautyTournamentBracket_(players,size){
 if(!Number.isInteger(size)||size<2||size>128||(size&(size-1))||players.length<2||players.length>size)beautyPoolError_('Review the knockout capacity.');
 let order=[1,2];while(order.length<size){const limit=order.length*2+1;order=order.flatMap(n=>[n,limit-n]);}
 const table=Array.from({length:Math.log2(size)+1},(_,i)=>Array(size/2**i).fill(''));
 table[0]=order.map(n=>players[n-1]?.id||'');
 // The API requires explicit advancement of single-player byes.
 for(let r=0;r<table.length-1;r++)for(let i=0;i<table[r].length;i+=2){const width=2**r,left=table[0].slice(i*width,(i+1)*width).some(Boolean),right=table[0].slice((i+1)*width,(i+2)*width).some(Boolean);if(left!==right)table[r+1][i/2]=table[r][i]||table[r][i+1];}
 return table;
}
function beautyTournamentSnapshot_(auth){
 const workflow=beautyPoolWorkflow_(auth),event=beautyPoolEvent_(auth,true);
 if(!workflow.running||event.status!==30||beautyPoolMode_(event)!=='rr'||!workflow.format||!['top2-rest','top2-bottom2'].includes(workflow.format.mode))beautyPoolError_('Tournament control requires the verified running TEST round-robin draw.');
 const original=beautyTournamentReadAudit_(workflow.audit);
 if(original.kind!=='POOL_SEND_BEFORE'||!beautyPoolEqual_(event.rr_table,original.table))beautyPoolError_('The groups changed after approval. Review Nakka before assigning qualifiers.');
 if(!beautyPoolEqual_(beautyPoolAssignment_(event.assign_setting),workflow.format.assignment))beautyPoolError_('Qualification rules changed. Review the saved rules before assigning players.');
 const response=beautyHubTransferFetch_('tournament/standings?tdid=t_QHaG_7792',auth);
 if(response.result!==0||response.tdid!==event.tdid||!Array.isArray(response.groups)||response.groups.length!==event.rr_table.length)beautyPoolError_('Complete group standings are unavailable.');
 if(event.rr_table.length!==2)beautyPoolError_('This TEST assignment supports two saved pools. Review larger draws in Nakka.');
 const completion=beautyHubTransferFetch_('tournament/end_group?tdid=t_QHaG_7792',auth);
 if(completion.result!==0||completion.tdid!==event.tdid||!completion.groups||Object.keys(completion.groups).length!==event.rr_table.length||event.rr_table.some((_,i)=>![0,1].includes(completion.groups['rr_'+i])))beautyPoolError_('Group completion could not be verified.');
 const groups=event.rr_table.map((table,i)=>{
  const ids=table.filter(Boolean),g=response.groups.filter(g=>g.kind==='rr'&&g.index===i);
  if(g.length!==1||!Array.isArray(g[0].players)||!beautyPoolEqual_(ids.slice().sort(),g[0].players.map(p=>p.tpid).sort()))beautyPoolError_('Group membership differs from Nakka standings.');
  const players=g[0].players.map(p=>{
   const entry=event.entry_list.find(e=>e.tpid===p.tpid),win=p.win??p.w,lose=p.lose??p.l;
   if(!entry||![win,lose].every(n=>Number.isInteger(n)&&n>=0&&n<ids.length))beautyPoolError_('Unsupported group win/loss totals.');
   return {id:p.tpid,name:entry.name,rank:p.rank,wins:win,losses:lose};
  }).sort((a,b)=>a.rank-b.rank);
  const ranks=players.map(p=>p.rank),complete=completion.groups['rr_'+i]===1&&players.every(p=>p.wins+p.losses===ids.length-1)&&ranks.every(n=>Number.isInteger(n)&&n>0&&n<=ids.length)&&new Set(ranks).size===ids.length;
  const savedPool=workflow.draw.pools[i],boards=workflow.boardPlan?.assignments.find(a=>a.poolId===savedPool.id)?.boards;
  return {number:i+1,title:boards?.length?'Bana '+boards.join(' + '):'Pool '+(i+1),complete,players};
 });
 const pending=JSON.parse(PropertiesService.getScriptProperties().getProperty('BEAUTY_POOL_QUALIFY_t_QHaG_7792')||'null');
 const assigned=['t','t3','s2','s2_3'].some(k=>!beautyPoolEmpty_(event[k+'_table'])),results=['t','t3','s2','s2_3'].some(k=>!beautyPoolEmpty_(event[k+'_result']));
 const allComplete=groups.every(g=>g.complete),reason=pending?.state==='ATTEMPTED'?'Assignment is unverified. Inspect its audit before another change.':assigned?'Knockout players are already assigned.':results?'Knockout results exist.':!allComplete?'Finish every group and resolve tied ranks before assigning knockouts.':'';
 const up=groups.flatMap(g=>g.players.slice(0,2).map(p=>({...p,group:g.number}))).sort((a,b)=>a.rank-b.rank||a.group-b.group),down=groups.flatMap(g=>g.players.slice(2).map(p=>({...p,group:g.number}))).sort((a,b)=>a.rank-b.rank||a.group-b.group);
 const plan={};if(!reason){
  if(up.length!==workflow.format.stage1.qualifiers||down.length!==workflow.format.stage2.qualifiers)beautyPoolError_('Qualifier counts differ from the approved format.');
  for(const [k,players]of [['t',up],['s2',down]]){
   const stage=k==='t'?workflow.format.stage1:workflow.format.stage2,size=event[k+'_setting']?.t_player_count;
   if(event[k+'_setting']?.tournament!==1||size!==stage.slots)beautyPoolError_('Knockout settings differ from the approved format.');
   const expected=beautyTournamentBracket_(players,size);
   if(!beautyPoolEqual_(event[k+'_table'],expected.map(row=>row.map(()=>''))))beautyPoolError_('Knockout bracket shape changed.');
   if(!beautyPoolEmpty_(event[k+'_init'])||!beautyPoolEmpty_(event[k+'_order']))beautyPoolError_('Existing knockout guides or match order need review.');
   plan[k+'_table']=expected;
  }
 }
 const after=beautyPoolEvent_(auth,true);if(!beautyPoolEqual_(event,after))beautyPoolError_('Nakka changed during review. Reload tournament control.');
 const stages=[['t','Slutspel 1',up],['s2','Slutspel 2',down]].map(([key,title,players])=>({key,title,players,slots:event[key+'_setting']?.t_player_count,byes:(event[key+'_setting']?.t_player_count||0)-players.length,table:plan[key+'_table']||event[key+'_table']}));
 return {event,standings:response,completion,plan,view:{title:event.title,groups,stages,ready:!reason,assigned,reason,version:beautyPoolHash_({event,standings:response,completion,plan,poolReceipt:workflow.receipt})}};
}
function beautyTournamentControl_(action,input,account,session,auth,cache){
 const fields=action==='poolqualifysave'?'confirmed,ticket':'';
 if(!input||Object.keys(input).sort().join(',')!==fields||Object.values(input).some(v=>typeof v!=='string'||v.length>100))beautyPoolError_('Invalid tournament control request.');
 const snapshot=beautyTournamentSnapshot_(auth),view=snapshot.view;
 if(action==='poolcontrol')return {success:true,control:view};
 if(!view.ready)beautyPoolError_(view.reason);
 if(action==='poolqualifyprepare'){
  const ticket=Utilities.getUuid().replace(/-/g,'');cache.put('beauty-qualify:'+ticket,JSON.stringify({uid:account.uid,session,version:view.version,expires:Date.now()+300000}),300);
  return {success:true,ticket,control:view};
 }
 if(action!=='poolqualifysave'||!/^[a-f0-9]{32}$/.test(input.ticket))beautyPoolError_('Knockout approval expired. Review again.');
 const saved=JSON.parse(cache.get('beauty-qualify:'+input.ticket)||'null');cache.remove('beauty-qualify:'+input.ticket);
 if(input.confirmed!=='true'||!saved||saved.uid!==account.uid||saved.session!==session||saved.version!==view.version||Date.now()>=saved.expires||BEAUTY_IDENTITY_WRITES_ENABLED_!==true)beautyPoolError_('Knockout approval is missing, expired or changed. Nothing assigned.');
 beautyHubAuthRequire_(beautyHubRequestToken_);
 const audit=beautyPoolAudit_({kind:'POOL_QUALIFY_BEFORE',uid:account.uid,event:beautyPoolProjection_(snapshot.event),standings:snapshot.standings,completion:snapshot.completion,plan:snapshot.plan});
 if(beautyTournamentSnapshot_(auth).view.version!==view.version)beautyPoolError_('Nakka changed before assignment. Nothing assigned.');
 if(Date.now()>=saved.expires)beautyPoolError_('Knockout approval expired. Nothing assigned.');
 beautyHubAuthRequire_(beautyHubRequestToken_);
 const props=PropertiesService.getScriptProperties(),key='BEAUTY_POOL_QUALIFY_t_QHaG_7792',journal={state:'ATTEMPTED',audit,uid:account.uid,recordedUTC:new Date().toISOString()};
 props.setProperty(key,JSON.stringify(journal));if(props.getProperty(key)!==JSON.stringify(journal))beautyPoolError_('Assignment journal could not be verified.');
 try{
  beautyHubTransferFetch_('tournament/update',auth,{tdid:'t_QHaG_7792',expect_update_time:snapshot.event.updateTime,set:snapshot.plan});
  const after=beautyPoolEvent_(auth,true),expected={...beautyPoolProjection_(snapshot.event),...snapshot.plan};
  if(!beautyPoolEqual_(beautyPoolProjection_(after),expected))beautyPoolError_('Knockout assignment readback differs.');
  const receipt=beautyPoolAudit_({kind:'POOL_QUALIFY_READBACK',uid:account.uid,beforeAudit:audit,event:beautyPoolProjection_(after)});
  const verified=JSON.stringify({...journal,state:'VERIFIED',receipt});props.setProperty(key,verified);if(props.getProperty(key)!==verified)beautyPoolError_('Assignment receipt could not be verified.');
  return {success:true,readbackVerified:true,audit,receipt,message:'TEST knockout players assigned and verified. Open Slutspel 1 and 2 in Beauty Live.'};
 }catch(e){return {success:false,uncertain:true,audit,error:'Knockout assignment may be saved. Do not repeat. Inspect the TEST event and assignment audit.'};}
}
