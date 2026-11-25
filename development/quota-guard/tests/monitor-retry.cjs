const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const html=fs.readFileSync(path.join(process.argv[2],'LiveHubView.html'),'utf8');
const start=html.indexOf(' function check(){',html.indexOf('function drawCompact(r)'));
assert(start>0);const source=html.slice(start,html.indexOf(' let queueBusy=',start));
let success,failure,calls=0,drawn=0,generation=1,timers=[];
const c=vm.createContext({unlocked:true,busy:false,document:{hidden:false},BeautyHubAuth:{token:()=> 'session',generation:()=>generation},window:{beautyHubData:{eventContext:'event'}},refresh:{disabled:false},result:{checkedAt:'last-good'},serial:0,timeout:null,retryCheck:null,status:{textContent:''},compactSummary:{textContent:''},connection(){},tile(){},nav(){},draw(){drawn++},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},google:{script:{run:{withSuccessHandler(fn){success=fn;return this},withFailureHandler(fn){failure=fn;return this},beautyLiveNakkaMonitor(){calls++}}}}});
vm.runInContext(source,c);
for(const code of ['BUSY','CHECK_IN_PROGRESS']){
 timers=[];c.check();success({code,context:'event'});assert.equal(c.busy,false);assert.equal(c.refresh.disabled,false);assert.equal(drawn,0);assert.deepEqual(timers.map(t=>t.ms),[45000]);assert.equal(c.result.checkedAt,'last-good');
}
// A later/manual check remains possible, without installing another timer.
c.check();failure();assert.equal(c.result.checkedAt,'last-good');assert.equal(c.busy,false);
c.check();success({success:true,context:'event'});assert.equal(drawn,1);
c.check();generation++;success({success:true,context:'event'});assert.equal(drawn,1);
assert(html.includes('setInterval(check,120000);'));assert(!html.includes('setTimeout(check,3000)'));
console.log('PASS busy/changing-event replies schedule no rapid retry; last good result retained; manual/later checks work; stale session reply ignored');
