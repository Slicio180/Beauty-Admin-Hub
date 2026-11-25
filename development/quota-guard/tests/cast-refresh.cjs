const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const html=fs.readFileSync(path.join(process.argv[2],'LiveCastView.html'),'utf8');
const start=html.indexOf('  function refresh(){if(disposed||refreshBusy)');assert(start>0);
const body=html.slice(start,html.indexOf('  const settings=',start));
let calls=0,success,failure,unavailable=0,id=0,throwNow=false;
const timers=new Map(),good={players:['Synthetic player']};
const c=vm.createContext({disposed:false,refreshBusy:false,refreshFailures:0,refreshTimer:null,refreshDeadline:null,sequence:0,latest:good,status:{textContent:'',dataset:{}},Math,window:{BeautyCastShell:{playersUnavailable(){unavailable++}}},setTimeout(fn,ms){const key=++id;timers.set(key,{fn,ms});return key},clearTimeout(key){timers.delete(key)},google:{script:{run:{withSuccessHandler(fn){success=fn;return this},withFailureHandler(fn){failure=fn;return this},beautyLiveCastData(){calls++;if(throwNow)throw Error('RPC unavailable')}}}}});
c.apply=data=>{if(!data?.players)throw Error('Bad data');c.latest=data};vm.runInContext(body,c);
const pending=()=>[...timers.values()].map(t=>t.ms);
c.refresh();c.refresh();assert.equal(calls,1);assert.deepEqual(pending(),[20000]);success(good);assert.deepEqual(pending(),[15000]);
c.refresh();assert.deepEqual(pending(),[20000]);const old=success;failure();assert.deepEqual(pending(),[30000]);assert.equal(c.latest,good);assert.equal(c.status.dataset.state,'error');old({players:[]});assert.equal(c.latest,good);
for(const expected of [60000,120000,240000,300000,300000]){c.refresh();failure();assert.deepEqual(pending(),[expected]);}
c.refresh();success(good);assert.equal(c.refreshFailures,0);assert.deepEqual(pending(),[15000]);
c.refresh();const late=success;const deadline=timers.get(c.refreshDeadline);timers.delete(c.refreshDeadline);deadline.fn();assert.deepEqual(pending(),[30000]);late({players:[]});assert.equal(c.latest,good);
throwNow=true;c.refresh();assert.equal(c.refreshBusy,false);assert.deepEqual(pending(),[60000]);throwNow=false;
c.refresh();success({invalid:true});assert.equal(c.latest,good);assert.deepEqual(pending(),[120000]);
c.refresh();c.disposed=true;c.sequence++;timers.clear();success(good);assert.equal(timers.size,0);const before=calls;c.refresh();assert.equal(calls,before);
console.log('PASS cast request deduplication, timer replacement, retained list, failure backoff/cap/reset, timeout and late reply, synchronous RPC failure, invalid response and page disposal');
