/* One application artifact for the existing LIVE project and isolated release TEST.
 * Project identity selects the destination. Browser input and script properties
 * cannot redirect TEST to another workbook/event or change LIVE's original base.
 * Credentials and deployment access remain separate project configuration.
 */
function beautyReleaseEnvironment_(){
 const projectId=ScriptApp.getScriptId();
 if(projectId==='1EU9dCgJ5NIhFjJ474gjX07WGQmouXCzSs4mRVKpZESwahVyR_DcenOo4')return {test:false,base:{version:1,mode:'league',sheetId:'1qeV90AYjC73BLMah347JWIee5-PIGFY9d-gzmyvcpyM',eventId:'t_UsRG_9574',leagueId:'lg_tM2v_3523',date:'2026-11-09',title:'AIK MÅNDAGSDARTARNA 2026/11/09',revision:'live-20261109'}};
 if(projectId==='1pHzX3a0Od9mbzOq-N3bM-imvHGOjxHEpc3Bae1dthYb3llFMBSi0ZndZ')return {test:true,base:{version:1,mode:'league',sheetId:'1h57Aza1Kq-JGaf2Ml0jhO0bOO7XTqvW-Dj-ea4Vm4ZE',eventId:'t_Q2uO_8370',leagueId:'lg_M2wQ_4189',date:'2026-11-23',title:'Beauty Release TEST — Consent and Formula',revision:'f0790000000000000000000000000001'}};
 throw Error('This project is not a configured Beauty release destination.');
}
function beautyReleaseContextGuard_(context){
 const environment=beautyReleaseEnvironment_();
 if(environment.test&&['version','mode','sheetId','eventId','leagueId','date','revision'].some(k=>context[k]!==environment.base[k]))throw Error('Release TEST is restricted to its isolated workbook and event.');
}
function beautyReleaseContextActionGuard_(action){
 if(beautyReleaseEnvironment_().test&&action!=='list')throw Error('Event switching is outside this consent/formula release TEST.');
}
function beautyReleaseProviderGuard_(path,payload){
 const environment=beautyReleaseEnvironment_();if(!environment.test)return;
 const t=environment.base;
 const reads=new Set(['league/get?lgid='+t.leagueId,'league/entry/list?lgid='+t.leagueId,'league/stats?lgid='+t.leagueId+'&kind=stats_list','league/stats?lgid='+t.leagueId+'&kind=rank_list','tournament/get?tdid='+t.eventId,'tournament/entry/list?tdid='+t.eventId,'league/schedule/get?tdid='+t.eventId]);
 if(payload!==undefined&&payload!==null||!reads.has(path))throw Error('Release TEST permits only reads of its fixed private Nakka event and league.');
}
function beautyReleaseFormId_(){
 if(beautyReleaseEnvironment_().test)throw Error('The production backup form is outside this release TEST.');
 return '1UxEr_KeHzhispG7Zu6E74Hh29OIqD6XxwR4UFwYEFOQ';
}
