/* One existing history tab: A:F event snapshots, H:M readable registrations,
 * P:U recovery records. Callers already hold the shared ScriptLock.
 * Existing REMOVE/POOL tabs remain readable for older saved operations. */
function beautyHistoryValues_(range){
 const data=beautyEventSheets_('/values/'+encodeURIComponent("'"+BEAUTY_EVENT_HISTORY_TAB_+"'!"+range)+'?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER');
 if(data.values!==undefined&&!Array.isArray(data.values))throw Error('History readback is incomplete.');
 return data.values||[];
}
function beautyHistoryRows_(rows){return rows.map(row=>({values:row.map(v=>v===null||v===undefined?{}:{userEnteredValue:{[typeof v==='number'?'numberValue':typeof v==='boolean'?'boolValue':'stringValue']:v}})}));}
function beautyHistoryHeight_(sh){
 const meta=beautyEventSheets_('?fields=sheets(properties(sheetId,gridProperties(rowCount)))');
 const rows=meta.sheets?.find(s=>s.properties.sheetId===sh.getSheetId())?.properties.gridProperties.rowCount;
 if(!Number.isInteger(rows)||rows<1)throw Error('History dimensions unavailable.');
 return rows;
}
function beautyHistoryWrite_(sh,start,column,rows,extra){
 if(!rows.length)return;
 const height=beautyHistoryHeight_(sh),requests=[];
 if(start+rows.length>20000)throw Error('History storage needs review.');
 if(start+rows.length>height)requests.push({appendDimension:{sheetId:sh.getSheetId(),dimension:'ROWS',length:start+rows.length-height}});
 requests.push({updateCells:{start:{sheetId:sh.getSheetId(),rowIndex:start,columnIndex:column},rows:beautyHistoryRows_(rows),fields:'userEnteredValue'}},...(extra||[]));
 try{beautyEventSheets_(':batchUpdate',{requests});}catch(e){/* One write only; caller verifies exact cells before continuing. */}
}
function beautyRecoveryIndex_(sh){
 const header=['RECORD ID','KIND','PART','PARTS','SHA256','JSON'],height=beautyHistoryHeight_(sh);
 let rows=beautyHistoryValues_('P1:T'+Math.min(height,20001));
 if(!rows.length){
  if(beautyHistoryValues_('P1:U'+Math.min(height,20001)).length)throw Error('Recovery history header is missing.');
  beautyHistoryWrite_(sh,0,15,[header],[{updateDimensionProperties:{range:{sheetId:sh.getSheetId(),dimension:'COLUMNS',startIndex:15,endIndex:21},properties:{hiddenByUser:true},fields:'hiddenByUser'}}]);
  rows=beautyHistoryValues_('P1:T'+Math.min(height,20001));
 }
 if(rows.length>20000||JSON.stringify(rows[0])!==JSON.stringify(header.slice(0,5)))throw Error('Recovery history layout needs review.');
 if(rows.slice(1).some(r=>r.length!==5||typeof r[0]!=='string'||!['REMOVE','POOL'].includes(r[1])||!Number.isInteger(r[2])||!Number.isInteger(r[3])||!/^\w{64}$/.test(r[4])))throw Error('Recovery history index is incomplete.');
 return rows;
}
function beautyRecoveryRecordFromIndex_(rows,id,kind){
 const found=rows.map((r,i)=>({r,row:i+1})).slice(1).filter(v=>v.r[0]===id);
 if(!found.length)return null;
 const count=found[0].r[3],proof=found[0].r[4];
 if(count<1||count>200||found.length!==count||found.some((v,i)=>v.r[1]!==kind||v.r[2]!==i||v.r[3]!==count||v.r[4]!==proof||v.row!==found[0].row+i))throw Error('Recovery record is incomplete.');
 const parts=beautyHistoryValues_('P'+found[0].row+':U'+found[found.length-1].row);
 if(parts.length!==count||parts.some((r,i)=>r.length!==6||typeof r[5]!=='string'||JSON.stringify(r.slice(0,5))!==JSON.stringify(found[i].r)))throw Error('Recovery record readback differs.');
 const value=JSON.parse(parts.map(r=>r[5]).join(''));
 if(beautyEventHash_(value)!==proof)throw Error('Recovery record checksum differs.');
 return value;
}
function beautyRecoveryRecordRead_(id,kind){
 if(!['POOL','REMOVE'].includes(kind)||typeof id!=='string'||!id.startsWith(kind+'-'))throw Error('Invalid recovery reference.');
 const sh=SpreadsheetApp.openById(BEAUTY_LIVE_BASE_.sheetId).getSheetByName(BEAUTY_EVENT_HISTORY_TAB_);
 if(!sh)return null;
 const height=beautyHistoryHeight_(sh),rows=beautyHistoryValues_('P1:T'+Math.min(height,20001));
 if(!rows.length)return null;
 if(JSON.stringify(rows[0])!==JSON.stringify(['RECORD ID','KIND','PART','PARTS','SHA256']))throw Error('Recovery history layout needs review.');
 return beautyRecoveryRecordFromIndex_(rows,id,kind);
}
function beautyRecoveryRecordSave_(id,kind,value){
 if(!['POOL','REMOVE'].includes(kind)||typeof id!=='string'||!new RegExp('^'+kind+'-[a-zA-Z0-9-]{8,80}$').test(id))throw Error('Invalid recovery reference.');
 if(beautyLiveTarget_().sheetId!==BEAUTY_LIVE_BASE_.sheetId)throw Error('Recovery workbook differs.');
 const sh=beautyEventHistory_(),index=beautyRecoveryIndex_(sh),existing=beautyRecoveryRecordFromIndex_(index,id,kind),text=JSON.stringify(value),proof=beautyEventHash_(value);
 if(existing!==null){if(JSON.stringify(existing)!==text)throw Error('Recovery reference already contains different data.');return id;}
 const chars=Array.from(text),count=Math.ceil(chars.length/12000),start=index.length;
 if(!count||count>200)throw Error('Recovery record is too large.');
 const rows=Array.from({length:count},(_,i)=>[id,kind,i,count,proof,chars.slice(i*12000,(i+1)*12000).join('')]);
 beautyHistoryWrite_(sh,start,15,rows);
 if(JSON.stringify(beautyHistoryValues_('P'+(start+1)+':U'+(start+count)))!==JSON.stringify(rows))throw Error('Recovery record was not verified. No player operation started.');
 return id;
}
function beautyEventReadableHistorySave_(snapshot){
 const source=snapshot.responses;
 if(!Array.isArray(source)||!source.length||source.some(r=>r.length!==6||r.some(c=>c&&!['stringValue','numberValue','boolValue'].includes(c[0]))))throw Error('Registration history layout differs.');
 const plain=source.map(r=>r.map(c=>c?c[1]:null)),sh=beautyEventHistory_(),height=beautyHistoryHeight_(sh);
 const stored=beautyHistoryValues_('H1:M'+Math.min(height,20001));
 const padded=stored.map(r=>Array.from({length:6},(_,i)=>r[i]===undefined||r[i]===''?null:r[i]));
 const normalize=r=>r.map(v=>v===''?null:v),key=r=>JSON.stringify(normalize(r)),header=plain[0];
 if(stored.length&&key(padded[0])!==key(header))throw Error('Readable history header differs.');
 const counts=new Map(),seen=new Map(),add=[];
 for(const row of padded.slice(1)){const k=key(row);counts.set(k,(counts.get(k)||0)+1);}
 for(const row of plain.slice(1)){
  if(!row.some(v=>v!==null&&v!==''))continue;
  const k=key(row),n=(seen.get(k)||0)+1;seen.set(k,n);
  if(n>(counts.get(k)||0))add.push(row);
 }
 if(stored.length&&!add.length)return;
 const rows=stored.length?add:[header,...add],start=stored.length;
 const extras=[{repeatCell:{range:{sheetId:sh.getSheetId(),startRowIndex:Math.max(1,start),endRowIndex:start+rows.length,startColumnIndex:7,endColumnIndex:8},cell:{userEnteredFormat:{numberFormat:{type:'DATE_TIME',pattern:'dd/mm/yyyy hh:mm'}}},fields:'userEnteredFormat.numberFormat'}}];
 if(start+rows.length<=1)extras.length=0;
 beautyHistoryWrite_(sh,start,7,rows,extras);
 const actual=beautyHistoryValues_('H'+(start+1)+':M'+(start+rows.length));
 if(actual.length!==rows.length||actual.some((r,i)=>key(Array.from({length:6},(_,j)=>r[j]===undefined?null:r[j]))!==key(rows[i])))throw Error('Readable registration history was not verified. Active event retained.');
}
