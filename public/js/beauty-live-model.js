/* Pure casting projection; never carries operational/private fields. */
const BeautyLiveModel = (() => {
  const collator = new Intl.Collator('sv', {sensitivity:'base', numeric:true});
  function project(data, order) {
    if (!data || data.success !== true || !Array.isArray(data.players)) throw Error('Invalid feed');
    const finite = v => typeof v === 'number' && Number.isFinite(v);
    const players = data.players.map(p => ({name:String(p.name || '').trim(), registeredAt:finite(p.registeredAt)?p.registeredAt:null,
      rank:finite(p.rank)&&p.rank>0?p.rank:null, points:finite(p.points)?p.points:null})).filter(p=>p.name);
    const number = v => v === null ? Infinity : v;
    const alpha = (a,b) => collator.compare(a.name,b.name);
    return players.sort((a,b) => (order==='ranking' ? number(a.rank)-number(b.rank) : order==='registration' ? number(a.registeredAt)-number(b.registeredAt) : 0) || alpha(a,b));
  }
  return {project};
})();
if (typeof module !== 'undefined') module.exports = BeautyLiveModel;
