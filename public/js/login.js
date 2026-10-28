/* Login page UI. No local password checking or pretend authentication.
 * Integration contract: a trusted account service must implement signIn,
 * sendPasswordReset, signOut and openHub with server authorization.
 * Absent that service this preview always denies entry.
 */
(function(root){
 'use strict';
 const unavailable=async()=>{throw Error('Secure sign-in is not connected yet. No account action was performed.');};
 const service=root.BeautyAccountService||{signIn:unavailable,sendPasswordReset:unavailable,signOut:unavailable,openHub:unavailable};
 const $=id=>document.getElementById(id);
 let busy=false,session=null;
 function message(text){$('loginMessage').textContent=text;}
 function clearPassword(){const field=$('loginPassword');field.value='';field.type='password';$('showPassword').textContent='Show';$('showPassword').setAttribute('aria-pressed','false');}
 function view(name){for(const id of ['signInView','resetView','sessionView'])$(id).hidden=id!==name;message('');}
 async function perform(task){if(busy)return;busy=true;for(const n of document.querySelectorAll('button,input'))n.disabled=true;
  try{await task();}catch(error){message(error?.message||'Unable to complete the request. Please try again.');}
  finally{busy=false;for(const n of document.querySelectorAll('button,input'))n.disabled=false;}
 }
 $('showPassword').addEventListener('click',()=>{const showing=$('loginPassword').type==='password';$('loginPassword').type=showing?'text':'password';$('showPassword').textContent=showing?'Hide':'Show';$('showPassword').setAttribute('aria-pressed',String(showing));});
 $('forgotPassword').addEventListener('click',()=>{clearPassword();$('resetEmail').value=$('loginEmail').value;view('resetView');$('resetEmail').focus();});
 $('backToSignIn').addEventListener('click',()=>{view('signInView');$('loginEmail').focus();});
 $('loginForm').addEventListener('submit',event=>{event.preventDefault();perform(async()=>{
  message('Signing in…');let result;
  try{result=await service.signIn({email:$('loginEmail').value.trim(),password:$('loginPassword').value});}finally{clearPassword();}
  if(!result||result.authorized!==true)throw Error('This account does not have access to the Hub.');
  session=result;$('openHub').hidden=false;view('sessionView');$('signedInEmail').textContent=result.email||'';$('openHub').focus();
 });});
 $('resetForm').addEventListener('submit',event=>{event.preventDefault();perform(async()=>{
  message('Requesting reset link…');await service.sendPasswordReset($('resetEmail').value.trim());
  message('If this address has an account, you will receive a password reset link.');
 });});
 $('openHub').addEventListener('click',()=>perform(async()=>{if(!session)throw Error('Sign in to continue.');await service.openHub();}));
 $('signOut').addEventListener('click',()=>perform(async()=>{
  await service.signOut();session=null;clearPassword();$('loginEmail').value='';view('signInView');message('You are signed out.');$('loginEmail').focus();
 }));
 root.addEventListener('beauty-auth-locked',event=>{session=null;clearPassword();const pending=root.BeautyHubAuth?.hasPendingLogout();view(pending?'sessionView':'signInView');$('openHub').hidden=!!pending;$('signOut').textContent=pending?'Retry sign out':'Sign out';message(event.detail||'Sign in to continue.');});
 root.addEventListener('pagehide',clearPassword);
})(window);
