/* Portable organiser plan. A planned board is never a live Nakka assignment. */
(function(root){
 'use strict';
 const seeding=typeof module==='object'&&module.exports?require('./pool-seeding.js'):root.BeautyPoolSeeding;
 const boards=typeof module==='object'&&module.exports?require('./pool-board-allocation.js'):root.BeautyPoolBoards;
 function create(draw,available,eventDate){
  seeding.check(draw);
  if(typeof eventDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)||!Number.isFinite(Date.parse(eventDate))||new Date(eventDate).toISOString().slice(0,10)!==eventDate)throw Error('Select a valid Hub date.');
  if(draw.eventDate!==eventDate)throw Error('Frozen draw belongs to a different Hub date.');
  const allocation=boards.allocate(draw.pools,available);
  return {schemaVersion:1,kind:'hub-board-plan',state:'PLANNED_NOT_SENT',eventId:'t_RqC2_2034',leagueId:'lg_tM2v_3523',eventDate,
   seed:draw.seed,frozenAt:draw.frozenAt,availableBoards:allocation.boards.map(b=>b.board),
   pools:draw.pools.map((p,i)=>{const a=allocation.assignments[i];return {poolNumber:i+1,board:a.board,batch:a.batch,matches:a.matches,players:p.players.map(q=>({id:q.id,name:q.name}))};}),
   boards:allocation.boards.map(b=>({board:b.board,matches:b.matches,pools:b.pools.map(p=>p.poolNumber)})),
   note:'Pools sharing a board play sequentially. This file does not reserve boards, start matches or update Nakka.'};
 }
 function text(plan){
  if(plan?.kind!=='hub-board-plan'||plan.state!=='PLANNED_NOT_SENT')throw Error('Invalid board plan.');
  return ['AIK DART · BOARD PLAN · TEST',plan.eventDate,'PLANNED — NOT SENT TO NAKKA','',...plan.boards.flatMap(b=>['BOARD '+b.board+' · '+b.matches+' matches',...b.pools.map(n=>{const p=plan.pools.find(q=>q.poolNumber===n);return '  Batch '+p.batch+' · Pool '+p.poolNumber+' · '+p.players.map(q=>q.name).join(' / ');}),b.pools.length?'':'  Unused','']),plan.note].join('\n');
 }
 const api=Object.freeze({create,text});if(typeof module==='object'&&module.exports)module.exports=api;else root.BeautyPoolBoardPlan=api;
})(typeof globalThis==='object'?globalThis:this);
