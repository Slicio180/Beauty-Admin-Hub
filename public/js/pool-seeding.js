/* Pure draw planning. No services, storage, timers, credentials or provider writes. */
(function(root){
  'use strict';
  const fail=message=>{throw Error(message);};
  const copy=value=>JSON.parse(JSON.stringify(value));
  function validatePlayers(players){
    if(!Array.isArray(players)||players.length>1000)fail('Invalid event roster.');
    const ids=new Set();
    return players.map(p=>{
      if(!p||typeof p.id!=='string'||!p.id||p.id.length>120||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!['IN','OUT','STANDBY'].includes(p.status))fail('Missing or ambiguous player identity or status.');
      ids.add(p.id);
      if(p.average!==null&&(typeof p.average!=='number'||!Number.isFinite(p.average)||p.average<0||p.average>180))fail('An average must be a verified number or explicitly missing.');
      return {id:p.id,name:p.name,status:p.status,average:p.average};
    });
  }
  const compareId=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
  function rosterSignature(players){return JSON.stringify(validatePlayers(players).filter(p=>p.status==='IN').sort(compareId).map(p=>[p.id,p.name]));}
  function sizesFromPlan(plan){
    if(!plan||!['three','four','five','pools'].every(k=>Number.isInteger(plan[k])&&plan[k]>=0)||plan.pools!==plan.three+plan.four+plan.five||plan.five&&plan.pools!==1||plan.five>1)fail('Invalid pool-size scheme.');
    return [...Array(plan.four).fill(4),...Array(plan.three).fill(3),...Array(plan.five).fill(5)];
  }
  function shuffled(players,seed){
    let state=seed>>>0;
    const random=()=>{state=(state+0x6D2B79F5)>>>0;let n=state;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
    const result=players.slice().sort(compareId);
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function groupName(index){let name='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))name=String.fromCharCode(65+(n-1)%26)+name;return name;}
  function summary(group){
    const known=group.players.filter(p=>p.average!==null);
    return {players:group.players.length,capacity:group.capacity,known:known.length,unseeded:group.players.length-known.length,
      knownAverage:known.length?known.reduce((sum,p)=>sum+p.average,0)/known.length:null};
  }
  function check(draw){
    if(!draw||!Array.isArray(draw.pools)||!Array.isArray(draw.roster))fail('Invalid draw.');
    const roster=validatePlayers(draw.roster);if(roster.some(p=>p.status!=='IN'))fail('Draw includes an excluded player.');
    const expected=new Map(draw.roster.map(p=>[p.id,p])),seen=new Set();
    if(draw.pools.some(g=>![3,4,5].includes(g.capacity))||draw.pools.some(g=>g.capacity===5)&&draw.pools.length!==1)fail('Unsupported pool capacities.');
    for(const [index,group] of draw.pools.entries()){
      if(group.id!==index||group.name!==groupName(index))fail('Pool identity changed.');
      if(group.players.length!==group.capacity)fail('Every pool must match its chosen capacity.');
      for(const p of group.players){
        if(seen.has(p.id)||!expected.has(p.id)||JSON.stringify(p)!==JSON.stringify(expected.get(p.id)))fail('Draw changed, repeated or omitted a player.');
        seen.add(p.id);
      }
    }
    if(seen.size!==expected.size)fail('Draw omitted a player.');
    return true;
  }
  function warnings(draw){
    const counts=draw.pools.map(g=>summary(g).unseeded),messages=[];
    if(Math.max(...counts)-Math.min(...counts)>1)messages.push('Manual changes have made the unseeded distribution uneven.');
    const first=new Set(draw.firstSeeds),repeated=draw.pools.some(g=>g.players.filter(p=>first.has(p.id)).length>1);
    if(repeated)messages.push('Manual changes have put first-round seeds together.');
    if(draw.roster.some(p=>p.average===null))messages.push('Pool strength uses known averages only; unseeded players are not treated as zero.');
    return messages;
  }
  function draw(options){
    const all=validatePlayers(options?.players),roster=all.filter(p=>p.status==='IN');
    if(roster.length<5||roster.length>101)fail('Seeded draws support 5–101 IN players.');
    const sizes=options.sizes;
    if(!Array.isArray(sizes)||!sizes.length||sizes.some(n=>![3,4,5].includes(n))||sizes.includes(5)&&(sizes.length!==1||sizes[0]!==5)||sizes.reduce((a,b)=>a+b,0)!==roster.length)fail('Pool capacities must match the selected IN list and scheme.');
    if(!Number.isInteger(options.seed)||options.seed<0||options.seed>0xFFFFFFFF)fail('A recorded unsigned 32-bit draw seed is required.');
    if(typeof options.eventDate!=='string'||!/^20\d\d-\d\d-\d\d$/.test(options.eventDate)||!Number.isFinite(Date.parse(options.eventDate+'T12:00:00Z'))||new Date(options.eventDate+'T12:00:00Z').toISOString().slice(0,10)!==options.eventDate||typeof options.frozenAt!=='string'||!Number.isFinite(Date.parse(options.frozenAt))||
      !options.source||typeof options.source.leagueId!=='string'||!options.source.leagueId||typeof options.source.fetchedAt!=='string'||!Number.isFinite(Date.parse(options.source.fetchedAt)))fail('Record the event, league and frozen statistics time.');
    const order=shuffled(roster,options.seed),known=order.filter(p=>p.average!==null).sort((a,b)=>b.average-a.average),unknown=order.filter(p=>p.average===null);
    const pools=sizes.map((capacity,i)=>({id:i,name:groupName(i),capacity,players:[],unseededQuota:0}));
    // Water-fill counts, favouring larger pools for remainder slots. Counts differ by at most one.
    for(let i=0;i<unknown.length;i++){
      const group=pools.filter(g=>g.unseededQuota<g.capacity).sort((a,b)=>a.unseededQuota-b.unseededQuota||b.capacity-a.capacity||a.id-b.id)[0];
      group.unseededQuota++;
    }
    const seededCapacity=pools.map(g=>g.capacity-g.unseededQuota),firstSeeds=[];
    let placed=0,round=0;
    while(placed<known.length){
      const indices=pools.map((_,i)=>i);if(round%2)indices.reverse();
      for(const i of indices){
        if(pools[i].players.length>=seededCapacity[i]||placed>=known.length)continue;
        if(round===0)firstSeeds.push(known[placed].id);
        pools[i].players.push(known[placed++]);
      }
      round++;
    }
    // Improve comparable known-player means without moving first-round seeds or unknown quotas.
    const protectedIds=new Set(firstSeeds),target=known.length?known.reduce((s,p)=>s+p.average,0)/known.length:0;
    const means=pools.map(g=>({sum:g.players.reduce((s,p)=>s+p.average,0),count:g.players.length}));
    const cost=(sum,count)=>count?Math.pow(sum/count-target,2):0;
    for(let pass=0;pass<100;pass++){
      let best=null,improvement=1e-9;
      for(let a=0;a<pools.length;a++)for(let b=a+1;b<pools.length;b++){
        const left=means[a],right=means[b];if(!left.count||!right.count)continue;
        const before=cost(left.sum,left.count)+cost(right.sum,right.count);
        for(let x=0;x<pools[a].players.length;x++)for(let y=0;y<pools[b].players.length;y++){
          const p=pools[a].players[x],q=pools[b].players[y];if(protectedIds.has(p.id)||protectedIds.has(q.id))continue;
          const delta=q.average-p.average,gain=before-cost(left.sum+delta,left.count)-cost(right.sum-delta,right.count);
          if(gain>improvement){improvement=gain;best={a,b,x,y,delta};}
        }
      }
      if(!best)break;
      const {a,b,x,y,delta}=best;[pools[a].players[x],pools[b].players[y]]=[pools[b].players[y],pools[a].players[x]];means[a].sum+=delta;means[b].sum-=delta;
    }
    let index=0;for(const group of pools)for(let i=0;i<group.unseededQuota;i++)group.players.push(unknown[index++]);
    const result={version:1,eventDate:options.eventDate,frozenAt:options.frozenAt,source:{leagueId:options.source.leagueId,fetchedAt:options.source.fetchedAt},seed:options.seed,
      method:'seeded snake with protected first-round seeds and bounded mean balancing',unseededPolicy:'even counts, no invented averages',
      roster:roster.slice().sort(compareId).map(copy),rosterSignature:rosterSignature(all),firstSeeds,pools:pools.map(g=>({id:g.id,name:g.name,capacity:g.capacity,players:g.players.map(copy)})),manualChanges:[]};
    check(result);return result;
  }
  function adjust(current,change){
    check(current);const result=copy(current);
    const origin=result.pools.find(g=>g.players.some(p=>p.id===change.playerId)),target=result.pools.find(g=>g.id===change.targetPool);
    if(!origin||!target||origin===target)fail('Choose a player and another pool.');
    const from=origin.players.findIndex(p=>p.id===change.playerId);
    if(target.players.length>=target.capacity){
      const other=target.players.findIndex(p=>p.id===change.swapWith);
      if(other<0)fail('The destination is full. Choose a player to swap.');
      [origin.players[from],target.players[other]]=[target.players[other],origin.players[from]];
    }else{target.players.push(origin.players.splice(from,1)[0]);}
    result.manualChanges.push({playerId:change.playerId,from:origin.id,to:target.id,swapWith:change.swapWith||null});
    check(result);return result;
  }
  function band(average,thresholds=[50,55,60]){
    if(!Array.isArray(thresholds)||thresholds.length!==3||thresholds.some((n,i)=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>180||i&&n<=thresholds[i-1]))fail('Average-band boundaries must increase without overlap.');
    if(average===null)return 'UNSEEDED';
    if(typeof average!=='number'||!Number.isFinite(average)||average<0||average>180)fail('Invalid average.');
    return thresholds.filter(n=>average>=n).length;
  }
  const api={draw,adjust,check,summary,warnings,band,rosterSignature,sizesFromPlan};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.BeautyPoolSeeding=Object.freeze(api);
})(typeof window==='undefined'?globalThis:window);
