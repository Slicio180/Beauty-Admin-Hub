'use strict';
const {generateGuide,bindGuide,bracket}=require('./qualification.cjs');
function demoState(){const sizes=[4,3,4,3],guide=generateGuide(sizes);let n=0;const event={tdid:'local-rehearsal',title:'Club evening · isolated rehearsal',status:30,updateTime:1,entry_list:[],rr_table:[],t_result:{},s2_result:{},badge:{}};
 const standings={result:0,tdid:event.tdid,groups:[]},completion={result:0,tdid:event.tdid,groups:{}};
 const names=['Alessio Tampella','Adam Pettersson','Alex Berg','Robin Lund','Kim Andersson','Sam Nilsson','Jamie Ek','Charlie Lind','Morgan Hall','Taylor Holm','Lou Eklund','Jo Strand','Lee Karlsson','Chris Dahl'];
 sizes.forEach((size,index)=>{const ids=Array.from({length:size},()=>String(++n));event.rr_table.push(ids);event.entry_list.push(...ids.map(tpid=>({tpid,name:names[Number(tpid)-1]})));standings.groups.push({kind:'rr',index,players:ids.map((tpid,i)=>({tpid,rank:i+1,win:size-1-i,lose:i}))});completion.groups['rr_'+index]=index<2?1:0;});
 for(const key of ['t','s2']){event[key+'_table']=bracket(guide.stages[key].length);event[key+'_setting']={tournament:1,t_player_count:guide.stages[key].length,limit_leg_count:2};}
 return {guide:bindGuide(guide,event),snapshot:{event,standings,completion,active:[],rehearsal:{mode:'synthetic',clock:1800000000000,revision:0,finished:{},playerReadyAt:{},boardReadyAt:{}},autopilot:{result:0,tdid:event.tdid,config:{types:{t:{enable:0,badge_number:'5-6',break_time:0,round:0},s2:{enable:0,badge_number:'2-3',break_time:0,round:0}},priority:0}}}};
}
module.exports={demoState};
