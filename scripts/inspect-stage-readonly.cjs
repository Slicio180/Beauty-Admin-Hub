/* Owner-run fixed TEST schema diagnostic. Public GET only; never collect credentials. */
const fs=require('node:fs'),path=require('node:path');
const target='t_RqC2_2034',league='lg_tM2v_3523',base='https://api.n01darts.com/api/v1/';
const fields=new Set(['result','tdid','groups','kind','index','players','tpid','name','rank','p','w','d','l','pts','r','a','str','st','limit','limit_leg_count','limit_set_count','limit_set_leg_count','drawMode','game_setting','round','tournament','league','round_robin','t3']);
function shape(value,depth=0){
 if(value===null)return 'null';if(typeof value!=='object')return typeof value;if(depth>5)return Array.isArray(value)?'array':'object';
 if(Array.isArray(value))return {type:'array',length:value.length,samples:value.slice(0,2).map(v=>shape(v,depth+1))};
 if(typeof value==='object'){const entries=Object.entries(value).slice(0,30);return {type:'object',fields:entries.map(([key,v])=>({key:fields.has(key)?key:'<map-key>',shape:shape(v,depth+1)}))};}
 return typeof value;
}
function event(data){const t=data?.tournament;if(data?.result!==0||t?.tdid!==target||t.lgid!==league)throw Error('Unexpected TEST target or unavailable event.');return t;}
async function collect(fetcher=fetch,now=()=>new Date().toISOString()){
 const calls=[];
 async function get(endpoint){const response=await fetcher(base+endpoint+'?tdid='+target,{method:'GET',credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)});calls.push({endpoint,httpStatus:response.status});if(!response.ok)throw Error('Read-only TEST endpoint unavailable (HTTP '+response.status+').');return response.json();}
 const first=event(await get('tournament/get')),standings=await get('tournament/standings'),last=event(await get('tournament/get'));
 return {readUTC:now(),eventId:target,leagueId:league,status:typeof last.status==='number'?last.status:null,updateTime:typeof last.updateTime==='number'?last.updateTime:null,consistent:Number.isFinite(first.updateTime)&&first.updateTime===last.updateTime,calls,standingsResult:typeof standings?.result==='number'?standings.result:null,standingsShape:shape(standings),tournamentShapes:Object.fromEntries(['entry_list','badge','t_table','t_result','t3_table','t3_result','t_setting','s2_table','s2_result','s2_3_table','s2_3_result','s2_setting','lg_setting','rr_setting','lg_table','lg_result','rr_table','rr_result'].filter(k=>Object.hasOwn(last,k)).map(k=>[k,shape(last[k])]))};
}
async function main(){const report=await collect();fs.mkdirSync('backups',{recursive:true});const file=path.resolve('backups','stage-readonly-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log('Saved read-only TEST schema:',file);console.log('Consistent event revision:',report.consistent);console.log('No settings, boards, players or matches changed. Names and provider values omitted.');}
module.exports={collect};if(require.main===module)main().catch(()=>{console.error('Read-only TEST schema collection failed. Check target, API availability and connectivity. No settings or registrations changed.');process.exitCode=1;});
