/* Managed Beauty password login + revocable TEST session, memory only. */
(function(root){
 'use strict';
 const apiKey='AIzaSyAVnGQ2_EAyKzylm78uf5ldCRteVgwgflY';
 let session=null,generation=0,lastActivity=0,lastTouch=0,touching=false,revoking=null;
 const channel=typeof root.BroadcastChannel==='function'?new root.BroadcastChannel('beauty-hub-test-auth'):null;
 if(channel)channel.onmessage=()=>lock('You were signed out in another Hub tab.');
 const failures={AUTH_SETUP:'Hub account approval is not configured.',AUTH_DENIED:'This account does not have access to the Hub.',AUTH_INVALID:'Sign-in could not be verified. Check your details and try again.',AUTH_BUSY:'The Hub is busy. Please try signing in again.',AUTH_REQUIRED:'Your session has ended. Sign in again.',AUTH_UNAVAILABLE:'The account service is unavailable. Please try again.'};
 function rpc(action,input){return new Promise((resolve,reject)=>{
  if(typeof google==='undefined'||!google.script?.run){reject(Error('Open the Google TEST Hub to sign in.'));return;}
  google.script.run.withSuccessHandler(result=>{if(result?.success!==true){
   const code=typeof result?.code==='string'&&/^AUTH_(?:TOKEN_(?:FORMAT|DECODE|PROJECT|TIME)|VERIFY_(?:PERMISSION|CONNECTION|HTTP_[0-9]{3}))$/.test(result.code)?result.code:null;
   const error=Error(code?'Sign-in verification stopped ('+code+'). Please report this code.':failures[result?.code]||'The account request could not be verified.');
   if(result?.code==='AUTH_BUSY')error.code='AUTH_BUSY';
   reject(error);return;}resolve(result);})
   .withFailureHandler(()=>reject(Error('The account service could not be reached.'))).beautyHubAuth(action,input);
 });}
 async function firebase(action,input){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+action+'?key='+apiKey,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
   if(!response.ok)throw Error('Account request failed');return await response.json();
  }finally{clearTimeout(timer);}
 }
 function clearView(){
  document.body.classList.add('beauty-auth-locked');
  document.getElementById('playersTableBody')?.replaceChildren();
  for(const id of ['playerCount','currentEventDate','currentEventStatus']){const n=document.getElementById(id);if(n)n.textContent=id==='playerCount'?'0':'Sign in to continue';}
  for(const d of document.querySelectorAll('dialog[open]'))d.close();
  for(const n of document.querySelectorAll('.message-popup-overlay, .register-popup-overlay, .kiosk-register-overlay'))n.remove();
  document.dispatchEvent(new CustomEvent('beauty-hub-locked'));
  root.beautyHubData=null;root.BeautyPoolPlanner?.unavailable();
  document.getElementById('hubSessionEmail').textContent='';
 }
 function lock(reason){session=null;generation++;clearView();root.dispatchEvent(new CustomEvent('beauty-auth-locked',{detail:reason||'Sign in to continue.'}));}
 function token(){if(!session||Date.now()>=session.expiresAt||Date.now()-lastActivity>=session.idleMs){if(session)lock('Your session has ended. Sign in again.');throw Error('Sign in to continue.');}return session.token;}
 function revoke(value){if(!value)return Promise.resolve();return rpc('logout',{token:value});}
 root.BeautyHubAuth=Object.freeze({token,generation:()=>generation,isCurrent:g=>{try{return g===generation&&!!token();}catch(e){return false;}},hasPendingLogout:()=>!!revoking,expired:()=>lock('Your session has ended. Sign in again.')});
 root.BeautyAccountService=Object.freeze({
  async signIn({email,password}){
   if(revoking)throw Error('Finish signing out before signing in again.');
   const ticket=++generation;
   let identity;try{identity=await firebase('signInWithPassword',{email,password,returnSecureToken:true});}
   catch(e){throw Error('Could not sign in. Check your email and password, or try again later.');}
   // The password and Firebase refresh token are never retained. Only the ID
   // token goes to the guarded server for verification and account approval.
   const result=await rpc('login',{idToken:identity.idToken});identity=null;
   if(ticket!==generation){await revoke(result.token);throw Error('Sign-in was cancelled. Try again.');}
   session=result;lastActivity=lastTouch=Date.now();return {authorized:true,email:result.email};
  },
  async sendPasswordReset(email){
   try{await firebase('sendOobCode',{requestType:'PASSWORD_RESET',email});}
   catch(e){throw Error('The reset request could not be completed. Please try again later.');}
  },
  async openHub(){
   const value=token(),ticket=generation;await rpc('touch',{token:value});
   if(ticket!==generation)throw Error('Sign in to continue.');
   document.body.classList.remove('beauty-auth-locked');
   document.getElementById('hubSessionEmail').textContent=session.email;
   if(typeof loadBeautyHubData==='function')await loadBeautyHubData();
   if(ticket===generation)document.dispatchEvent(new CustomEvent('beauty-hub-opened'));
  },
  async signOut(){
   const value=revoking||session?.token;revoking=value;lock('Signing out…');
   channel?.postMessage('signed-out');
   if(!value)return;
   try{await revoke(value);revoking=null;}
   catch(e){throw Error('This screen is locked, but server sign-out was not confirmed. Use Sign out again to retry, or close this tab.');}
  }
 });
 document.addEventListener('DOMContentLoaded',()=>{
  clearView();
  document.getElementById('hubSignOut').addEventListener('click',async()=>{
   const button=document.getElementById('hubSignOut');button.disabled=true;
   try{await root.BeautyAccountService.signOut();root.dispatchEvent(new CustomEvent('beauty-auth-locked',{detail:'You are signed out.'}));}
   catch(e){document.getElementById('loginMessage').textContent=e.message;document.getElementById('sessionView').hidden=false;document.getElementById('signInView').hidden=true;}
   finally{button.disabled=false;}
  });
  const activity=()=>{if(!session)return;try{token();lastActivity=Date.now();}catch(e){return;}};
  for(const kind of ['pointerdown','keydown','touchstart'])document.addEventListener(kind,activity,{passive:true});
  setInterval(async()=>{
   if(!session)return;try{token();}catch(e){return;}
   if(document.hidden||touching||lastActivity<=lastTouch||Date.now()-lastTouch<30000)return;
   touching=true;const ticket=generation;
   try{await rpc('touch',{token:token()});if(ticket===generation)lastTouch=Date.now();}
   // A date save/transfer holds the same server lock. Busy does not revoke a
   // valid session: retry only renewal on the next tick. Local/server idle and
   // absolute expiry remain enforced; no mutation request is retried here.
   catch(e){if(ticket===generation&&e.code!=='AUTH_BUSY')lock('Your session could not be renewed. Sign in again.');}
   finally{touching=false;}
  },5000);
 });
 root.addEventListener('pageshow',event=>{if(event.persisted)lock('Sign in again after returning to this page.');});
 root.addEventListener('pagehide',()=>{session=null;generation++;clearView();});
})(window);
