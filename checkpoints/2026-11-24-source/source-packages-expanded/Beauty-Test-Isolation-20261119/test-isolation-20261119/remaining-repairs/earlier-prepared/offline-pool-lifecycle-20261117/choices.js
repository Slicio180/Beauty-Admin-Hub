function beautyPoolDraftChoices_(value,draw){
 if(!value||Array.isArray(value)||Object.keys(value).sort().join(',')!=='boardChoices,boards,cardLabels,format,plannedBoards')throw Error('Invalid draft choices');
 const ids=new Set(draw.pools.map(p=>String(p.id))),validBoard=n=>Number.isInteger(n)&&n>=0&&n<=16;
 for(const k of ['boardChoices','cardLabels'])if(!value[k]||Array.isArray(value[k])||typeof value[k]!=='object'||!Object.keys(value[k]).every(id=>ids.has(id)))throw Error('Unknown pool choice');
 for(const c of Object.values(value.boardChoices))if(!c||![0,1,2].includes(c.count)||!Array.isArray(c.boards)||c.boards.length>2||!c.boards.every(validBoard))throw Error('Invalid board choice');
 for(const c of Object.values(value.cardLabels))if(!c||!validBoard(c.board)||!Number.isInteger(c.group)||c.group<1||c.group>128)throw Error('Invalid group label');
 if(typeof value.boards!=='string'||value.boards.length>100||!/^[0-9, ]*$/.test(value.boards)||typeof value.format!=='string'||value.format.length>60||value.plannedBoards!==null&&(!Array.isArray(value.plannedBoards)||value.plannedBoards.length>16||!value.plannedBoards.every(validBoard)))throw Error('Invalid draft settings');
 const text=JSON.stringify(value);if(text.length>20000)throw Error('Draft choices too large');return JSON.parse(text);
}
if(typeof module!=='undefined')module.exports=beautyPoolDraftChoices_;
