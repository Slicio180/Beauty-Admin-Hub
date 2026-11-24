const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),clone=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),checks=[];
const c={beautyRecoverySame_:(a,b)=>JSON.stringify(a)===JSON.stringify(b),beautyLiveRegistrationKey_:v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase(),beautyLiveRemoveHash_:hash};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'application/BeautyRemovalReconcile.gs'),'utf8'),c);
function fixture(){
 const player='Synthetic Removed',context={version:1,mode:'league',sheetId:'fixture',eventId:'t_fixture',leagueId:'lg_fixture',date:'2026-11-24',title:'Fixture',revision:'current'};
 const table=(id,values)=>({id,values:clone(values),display:values.map(row=>row.map(String)),formulas:values.map(row=>row.map(()=>'')),formats:values.map(row=>row.map(()=>'General'))});
 const snap={Control:table(0,[['DATE','START'],[46350,46349]]),
 'Form responses 2':table(1,[['Timestamp','Name','New','Consent','Message','Source'],[46349.1,player,'','JA','Keep history','HUB'],[46349.2,'Unrelated','','NEJ','Keep message','MOBIL']]),
 'PLAYER STATUS DATA':table(2,[['PLAYER','OLD NAME','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],[player,'','IN','JA','Keep history','HUB'],['Unrelated','','STANDBY','NEJ','Keep message','MOBIL']]),
 "TONIGHT'S PLAYERS":table(3,[['PLAYER','NEW','STATUS','FOTO&VIDEO','MEDDELANDE','WHERE FROM'],['Unrelated','','STANDBY','NEJ','Keep message','MOBIL']]),
 "PLAYER'S MASTER LIST":table(4,[['PLAYERS'],[player],['Unrelated']])};
 const event={id:context.eventId,title:'Fixture',date:context.date,status:20},identity={name:player,lpid:'LP01'},entry={tpid:'TP01',lpid:'LP01',name:player};
 const state={snap,event,identity,entry,fullEntries:[entry],journal:'journal-fixture',stored:{i:1,v:clone(snap['PLAYER STATUS DATA'].display[1])},registrations:[{i:1,v:clone(snap['Form responses 2'].values[1])}]};
 state.version=hash({snap:state.snap,event:state.event,identity:state.identity,entry:state.entry,fullEntries:state.fullEntries});
 const backup={uid:'owner',player,state},receipt={state:'ATTEMPTED',recoveryVersion:1,uid:'owner',player,context:clone(context),sheetId:context.sheetId,event:clone(event),identity:clone(identity),tpid:entry.tpid,version:state.version,backupHash:hash(backup),authority:'unchanged'};
 const x={receipt,backup,context,current:clone(snap),journal:state.journal,authority:'unchanged',dateSerial:46350,startSerial:46349,responseSerials:[null,46349.1,46349.2],provider:{event:{tdid:context.eventId,lgid:context.leagueId,title:context.title,status:20},date:context.date,entries:[],league:[identity]}};
 const updateBackup=()=>{state.version=hash({snap:state.snap,event:state.event,identity:state.identity,entry:state.entry,fullEntries:state.fullEntries});receipt.version=state.version;receipt.backupHash=hash(backup);};
 return {x,plan:()=>clone(c.beautyLiveRemovalPlan_(x)),updateBackup};
}
function test(name,fn){fn();checks.push(name);}
test('Original source produces exactly the removal-owned response and status ranges',()=>{const f=fixture(),before=clone(f.x);assert.deepEqual(f.plan(),[{title:'Form responses 2',row:1,column:1,width:2},{title:'PLAYER STATUS DATA',row:1,column:2,width:4}]);assert.deepEqual(f.x,before);});
test('Partially cleared source completes only remaining original cells',()=>{const f=fixture();f.x.current['Form responses 2'].values[1][1]='';f.x.current['PLAYER STATUS DATA'].values[1][3]='';assert.deepEqual(f.plan(),[{title:'PLAYER STATUS DATA',row:1,column:2,width:4}]);});
test('Fully cleared source is a readback with no write plan',()=>{const f=fixture();f.x.current['Form responses 2'].values[1][1]='';f.x.current['PLAYER STATUS DATA'].values[1].splice(2,4,'','','','');assert.deepEqual(f.plan(),[]);});
for(const [name,change,code] of [
 ['legacy receipt',f=>delete f.x.receipt.recoveryVersion,'LEGACY'],
 ['different event revision',f=>f.x.context.revision='new','CONTEXT'],
 ['different workbook',f=>f.x.context.sheetId='new','CONTEXT'],
 ['changed backup document',f=>f.x.backup.uid='other','BACKUP'],
 ['changed stored fingerprint',f=>f.x.receipt.backupHash='wrong','BACKUP'],
 ['later registration or recovery operation',f=>f.x.authority='later','LATER_OPERATION'],
 ['changed consent',f=>f.x.current['PLAYER STATUS DATA'].values[1][3]='NEJ','PLAYER_CHANGED'],
 ['changed message',f=>f.x.current['PLAYER STATUS DATA'].values[1][4]='New message','PLAYER_CHANGED'],
 ['changed source',f=>f.x.current['PLAYER STATUS DATA'].values[1][5]='MOBIL','PLAYER_CHANGED'],
 ['later OUT status',f=>f.x.current['PLAYER STATUS DATA'].values[1][2]='OUT','PLAYER_CHANGED'],
 ['changed response timestamp',f=>f.x.current['Form responses 2'].values[1][0]++,'PLAYER_CHANGED'],
 ['changed source formula',f=>f.x.current['PLAYER STATUS DATA'].formulas[1][3]='="JA"','LAYOUT'],
 ['changed display formula',f=>f.x.current["TONIGHT'S PLAYERS"].formulas[1][3]='=OTHER()','LAYOUT'],
 ['changed master identity',f=>f.x.current["PLAYER'S MASTER LIST"].values.push(['Synthetic Removed']),'IDENTITY'],
 ['still-present provider entry',f=>f.x.provider.entries.push({tpid:'TP01',name:'Synthetic Removed',lpid:'LP01'}),'ENTRY_STILL_PRESENT'],
 ['renamed retained provider identity',f=>f.x.provider.entries.push({tpid:'TP02',name:'Renamed',lpid:'LP01'}),'ENTRY_STILL_PRESENT'],
 ['changed provider league identity',f=>f.x.provider.league[0]={lpid:'LP02',name:'Synthetic Removed'},'IDENTITY'],
 ['started provider event',f=>f.x.provider.event.status=30,'EVENT_CHANGED'],
 ['provider date change',f=>f.x.provider.date='2026-11-25','EVENT_CHANGED'],
 ['retained tournament bracket',f=>f.x.provider.event.rr_table=[['TP01','TP02']],'BRACKET'],
 ['changed selected date window',f=>f.x.current.Control.values[1][0]++,'CONTEXT']
])test(name+' requires review without a source mutation',()=>{const f=fixture();change(f);const before=clone(f.x);assert.throws(f.plan,new RegExp(code));assert.deepEqual(f.x,before);});
test('A later response for the same player prevents clearing a new registration',()=>{const f=fixture();f.x.current['Form responses 2'].values.push([46349.9,'Synthetic Removed','','JA','','MOBIL']);f.x.responseSerials.push(46349.9);assert.throws(f.plan,/LATER_REGISTRATION/);});
test('A historical response outside the current window is preserved',()=>{const f=fixture();f.x.current['Form responses 2'].values.push([46300,'Synthetic Removed','','JA','','MOBIL']);f.x.responseSerials.push(46300);assert.equal(f.plan().length,2);});
test('An unrelated player edit is not part of the removal plan',()=>{const f=fixture();f.x.current['PLAYER STATUS DATA'].values[2][4]='Updated unrelated message';assert.equal(f.plan().length,2);assert.equal(f.x.current['PLAYER STATUS DATA'].values[2][4],'Updated unrelated message');});
test('Nakka-only player with no master-list entry retains that absence',()=>{const f=fixture();f.x.backup.state.snap["PLAYER'S MASTER LIST"].values.splice(1,1);f.x.current["PLAYER'S MASTER LIST"].values.splice(1,1);f.updateBackup();assert.equal(f.plan().length,2);});
fs.writeFileSync(path.join(root,'evidence/removal-tests.json'),JSON.stringify({result:'PASS',checks:checks.length,details:checks,scope:'Actual combined removal planning logic with synthetic complete snapshots; native partial-write and UI acceptance still required.'},null,2));console.log(JSON.stringify({result:'PASS',checks:checks.length}));
