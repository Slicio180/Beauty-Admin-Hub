/* Restores only absent, approved consent/message lookups in the current player row.
 * Source records and provider entries are never written. Every write has fresh
 * identity/context checks and verified readback, including an uncertain reply.
 */
function beautyDisplayLookupFormula_(row,column){
 if(!Number.isInteger(row)||row<2||row>100||![4,5].includes(column))throw Error('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 return '=IF(A'+row+'="","",IFERROR(VLOOKUP(A'+row+",'PLAYER STATUS DATA'!A:E,"+column+',FALSE),""))';
}
function beautyDisplayLookupRepair_(s,player,row,authorize){
 const fail=code=>{throw Error(code);},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const key=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');
 if(!key(player)||!Number.isInteger(row)||row<2||row>100||typeof authorize!=='function')fail('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 const wanted=[beautyDisplayLookupFormula_(row,4),beautyDisplayLookupFormula_(row,5)];
 const range=s.tonight.getRange(row,4,1,2),before=range.getFormulas()[0];
 if(same(before,wanted))return {repairedCells:[],readbackVerified:true};
 if(before.some((f,i)=>f&&f!==wanted[i]))fail('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 const authority=authorize();
 if(typeof authority!=='string'||!authority)fail('REGISTRATION_CONTEXT_CHANGED');
 const guard=()=>{if(authorize()!==authority)fail('REGISTRATION_CONTEXT_CHANGED');};
 if(s.tonight.getName()!=="TONIGHT'S PLAYERS"||s.store.getName()!=='PLAYER STATUS DATA'||s.tonight.getParent().getId()!==s.store.getParent().getId())fail('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 const sourceHeader=['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'];
 if(!same(s.store.getRange(1,1,1,6).getDisplayValues()[0],sourceHeader)||!same(s.tonight.getRange(1,1,1,6).getDisplayValues()[0],['PLAYERS','NEW PLAYERS',...sourceHeader.slice(2)]))fail('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 const sourceAnchor='=ARRAYFORMULA(IF(A2:A="","",IFERROR(XLOOKUP(A2:A,\'PLAYER STATUS DATA\'!A:A,\'PLAYER STATUS DATA\'!F:F,""),"")))';
 if(!s.tonight.getRange('A2').getFormula()||s.tonight.getRange('F2').getFormula()!==sourceAnchor)fail('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 const snapshot=()=>{
  guard();
  const names=s.tonight.getRange(2,1,99,1).getDisplayValues().map(r=>r[0]);
  if(key(names[row-2])!==key(player)||names.filter(n=>key(n)===key(player)).length!==1)fail('REGISTRATION_DISPLAY_IDENTITY_REVIEW');
  const last=s.store.getLastRow();if(!Number.isInteger(last)||last<2||last>10000)fail('REGISTRATION_LAYOUT_REVIEW');
  const records=s.store.getRange(2,1,last-1,6).getDisplayValues(),matches=records.map((r,i)=>({r,row:i+2})).filter(x=>key(x.r[0])===key(player));
  if(matches.length!==1)fail('REGISTRATION_DISPLAY_IDENTITY_REVIEW');
  const source=matches[0];
  if(!['JA','NEJ','N/A'].includes(source.r[3])||s.store.getRange(source.row,1,1,6).getFormulas()[0].some(Boolean))fail('REGISTRATION_CONSENT_REVIEW');
  return {names,source,formulas:range.getFormulas()[0],values:range.getValues()[0]};
 };
 const first=snapshot();
 if(!same(first.formulas,before)||before.some((f,i)=>!f&&first.values[i]!==''))fail('REGISTRATION_DISPLAY_FORMULA_REVIEW');
 const second=snapshot();if(!same(first,second))fail('REGISTRATION_DISPLAY_CHANGED');
 guard();
 // Absolute formula replacement is idempotent. Do not resend after an uncertain reply.
 try{range.setFormulas([wanted]);}catch(uncertain){}
 SpreadsheetApp.flush();
 const after=snapshot();
 if(!same(after.names,first.names)||!same(after.source,first.source)||!same(after.formulas,wanted)||!same(range.getDisplayValues()[0],first.source.r.slice(3,5)))fail('REGISTRATION_DISPLAY_FORMULA_UNVERIFIED');
 guard();
 const repairedCells=before.flatMap((f,i)=>f?[]:[String.fromCharCode(68+i)+row]);
 console.log(JSON.stringify({kind:'BEAUTY_DISPLAY_FORMULA_REPAIRED',cells:repairedCells,sourceWrites:0,providerWrites:0}));
 return {repairedCells,readbackVerified:true};
}
