/* Identical application artifact in LIVE and isolated combined release TEST.
 * Fixed project identities select destinations. Browser input cannot redirect
 * TEST to production or older acceptance fixtures.
 */
function beautyReleaseEnvironment_(){
 const projectId=ScriptApp.getScriptId();
 if(projectId==='1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4')return {test:false,base:{version:1,mode:'league',sheetId:'1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM',eventId:'t_UsRG_9574',leagueId:'lg_tM2v_3523',date:'2026-11-09',title:'AIK MÅNDAGSDARTARNA 2026/11/09',revision:'live-20261109'}};
 if(projectId==='1pHzX3a0Od9mbzOq-N3bM-imvHGOjxHEpc3Bae1dthYb3llFMBSi0ZndZ')return {test:true,base:{version:1,mode:'league',sheetId:'1Z2tBVyAsVt0X-yYPhCsgwuFWdKdOLtIN6-mTWee-dIE',eventId:'t_dx55_3500',leagueId:'lg_M2wQ_4189',date:'2026-11-24',title:'Beauty Combined Release TEST 2026-11-24',revision:'f0870000000000000000000000000001'}};
 throw Error('This project is not a configured Beauty release destination.');
}
function beautyReleaseContextGuard_(context){
 const environment=beautyReleaseEnvironment_();
 if(environment.test&&['version','mode','sheetId','eventId','leagueId','date','revision'].some(k=>context[k]!==environment.base[k]))throw Error('Release TEST is restricted to its isolated workbook and event.');
}
function beautyReleaseContextActionGuard_(action){
 if(beautyReleaseEnvironment_().test&&action!=='list')throw Error('Event switching is outside this fixed combined release TEST.');
}
function beautyReleaseProviderGuard_(path,payload){
 const environment=beautyReleaseEnvironment_();if(!environment.test)return;
 const t=environment.base;
 const reads=new Set(['league/get?lgid='+t.leagueId,'league/entry/list?lgid='+t.leagueId,'league/stats?lgid='+t.leagueId+'&kind=stats_list','league/stats?lgid='+t.leagueId+'&kind=rank_list','tournament/get?tdid='+t.eventId,'tournament/entry/list?tdid='+t.eventId,'league/schedule/get?tdid='+t.eventId,'tournament/standings?tdid='+t.eventId,'tournament/end_group?tdid='+t.eventId]);
 const fail=()=>{throw Error('Release TEST permits only its fixed private Nakka event, TEST league and synthetic players.');};
 if(payload===undefined||payload===null){if(!reads.has(path))fail();return;}
 if(typeof payload!=='object'||Array.isArray(payload))fail();
 const synthetic=v=>v&&typeof v.name==='string'&&/^Beauty Combined [A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö ()-]{0,75}$/.test(v.name);
 if(path==='league/entry/update'){
  if(payload.lgid!==t.leagueId||Object.keys(payload).sort().join(',')!=='add,lgid'||!Array.isArray(payload.add)||payload.add.length!==1||!synthetic(payload.add[0])||Object.keys(payload.add[0]).join(',')!=='name')fail();return;
 }
 if(payload.tdid!==t.eventId)fail();
 if(path==='tournament/entry/update'){
  if(Object.keys(payload).sort().join(',')==='add,tdid'&&Array.isArray(payload.add)&&payload.add.length===1&&synthetic(payload.add[0])&&Object.keys(payload.add[0]).every(k=>['name','lpid'].includes(k))&&(!payload.add[0].lpid||/^[A-Za-z0-9]{4}$/.test(payload.add[0].lpid)))return;
  if(Object.keys(payload).sort().join(',')==='remove,tdid'&&Array.isArray(payload.remove)&&payload.remove.length===1&&/^[A-Za-z0-9]{4}$/.test(payload.remove[0]))return;
  fail();
 }
 if(!['tournament/update','tournament/assign/update','league/schedule/generate'].includes(path))fail();
 if(payload.lgid!==undefined&&payload.lgid!==t.leagueId)fail();
 if(payload.set&&['title','lgid','tdid','private','t_date','join_pass','common_join','individual_pass'].some(k=>k in payload.set))fail();
}
function beautyReleaseFormId_(){
 if(beautyReleaseEnvironment_().test)return '1oMzrWm0IylBizzAmku2w1FU4DS9sJPpIj5BdJzHeA_Q';
 return '1UxEr_KeHzhispG7Zu6E74Hh29OIqD6XxwR4UFwYEFOQ';
}
