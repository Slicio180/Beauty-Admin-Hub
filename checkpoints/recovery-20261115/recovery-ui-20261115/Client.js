(()=>{'use strict';
 const panel=document.getElementById('beautyRecoveryTestPanel'),host=document.getElementById('nakkaDiagnosis'),cards=document.getElementById('beautyRecoveryTestCards'),status=document.getElementById('beautyRecoveryTestResult');
 if(!panel||!host)return;const open=document.createElement('button');open.type='button';open.id='beautyRecoveryTestOpen';open.textContent='RECOVERY TEST';host.after(open);
 let busy=false,epoch=0;
 const message=s=>{status.textContent=s;};
 function setBusy(value){busy=value;panel.setAttribute('aria-busy',String(value));panel.querySelectorAll('button').forEach(b=>b.disabled=value);}
 function render(items){cards.replaceChildren();for(const item of items){const card=document.createElement('div');card.className='recovery-test-card';const copy=document.createElement('div'),title=document.createElement('strong'),state=document.createElement('span');title.textContent=item.label;state.className='recovery-test-state';state.textContent=item.state==='COMPLETE'?'Last result: verified':item.state==='REVIEW'?'Saved result needs review':'Last result: '+item.state;copy.append(title,state);const button=document.createElement('button');button.type='button';button.textContent='RECHECK';button.dataset.recoveryTest=item.kind;button.addEventListener('click',()=>run(item.kind));card.append(copy,button);cards.append(card);}}
 async function run(action){if(busy)return;let generation,token,context;try{generation=window.BeautyHubAuth.generation();token=window.BeautyHubAuth.token();context=window.beautyHubData?.eventContext;if(!context)throw Error('Wait for the TEST Hub to finish loading.');}catch(e){message(e.message);return;}
  const turn=epoch;setBusy(true);message(action==='read'?'Reading saved test receipts…':'Checking saved '+action+' result…');const started=Date.now();
  const current=()=>turn===epoch&&window.BeautyHubAuth.isCurrent(generation)&&window.beautyHubData?.eventContext===context;
  try{const result=await new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(()=>reject(Error('The reply was not received. Refresh receipts before rechecking; no automatic repeat was sent.'))).beautyTestHubRecoveryUi(action,{_context:context},token));
   if(!current())return;if(result?.code==='AUTH_REQUIRED'){window.BeautyHubAuth.expired();return;}if(!result?.success)throw Error(result?.error||'The test result could not be read.');render(result.items);
   if(action==='read')message('Saved receipts loaded. Choose one recheck.');
   else{const r=result.result,verified=r?.detail?.success===true;message((verified?'VERIFIED':'NEEDS REVIEW')+' — '+action+' recheck ('+((Date.now()-started)/1000).toFixed(1)+' s).\n'+(verified?'No player was added or source row appended. Original event unchanged.':r?.detail?.error||'Inspect the saved test result before continuing.'));}
  }catch(e){if(current())message(e.message);}
  finally{if(turn===epoch){setBusy(false);if(!window.BeautyHubAuth.isCurrent(generation))close();else if(window.beautyHubData?.eventContext!==context)message('The selected event changed. Close and reopen this panel.');}}
 }
 function close(){epoch++;busy=false;panel.close();cards.replaceChildren();message('Open this panel to read the saved test receipts.');setBusy(false);}
 open.addEventListener('click',()=>{if(panel.open)return;panel.showModal();run('read');});document.getElementById('beautyRecoveryTestRefresh').addEventListener('click',()=>run('read'));document.getElementById('beautyRecoveryTestClose').addEventListener('click',close);
 panel.addEventListener('cancel',e=>{if(busy)e.preventDefault();else close();});document.addEventListener('beauty-hub-locked',close);
})();
