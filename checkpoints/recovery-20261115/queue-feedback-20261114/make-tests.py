from pathlib import Path
w=Path(__file__).parent;s=(w/'panel.test.cjs').read_text();s=s[:s.index('(async()=>{')]
s=s.replace('let queueResponse=', 'const queueCalls=[];let queueResponse=')
s=s.replace('queue:async()=>queueResponse','queue:async(action,input)=>{queueCalls.push({action,input});return queueResponse;}')
s=s.replace('return {c,nodes,requests,intervals,timers,fire,','return {c,nodes,requests,intervals,timers,fire,queueCalls,')
s+='''
const tick=()=>new Promise(r=>setImmediate(r));
function all(f){const seen=new Set(),out=[];const walk=n=>{if(seen.has(n))return;seen.add(n);out.push(n);for(const c of n.children||[])walk(c);};for(const n of f.nodes.values())walk(n);return out;}
const feedback=f=>all(f).find(n=>n.id==='beautyQueueFeedback');
const button=f=>all(f).find(n=>n.textContent==='RECHECK REGISTRATION');
const review={id:'job1',player:'Alice',source:'KIOSK',state:'REVIEW',failure:'Check message'};
(async()=>{
 const f=fixture();f.fire('beauty-hub-opened');f.setQueue({success:true,processed:false,jobs:[review]});await f.intervals.find(t=>t.ms===5000).f();
 let release;f.setQueue(new Promise(r=>release=r));const pump=f.intervals.find(t=>t.ms===5000).f();
 const b=button(f);assert.equal(b['data-live-nakka'],'');b.onclick();b.onclick();assert.match(feedback(f).textContent,/waiting/i);assert.equal(f.queueCalls.filter(q=>q.action==='recheck').length,0);
 release({success:true,processed:false,jobs:[review]});await pump;f.setQueue({success:true,processed:true,jobs:[],recheck:{id:'job1',outcome:'COMPLETE'}});await f.timers.filter(t=>t.ms===0).at(-1).f();await tick();assert.equal(f.queueCalls.filter(q=>q.action==='recheck').length,1);assert.match(feedback(f).textContent,/verified/);
 await f.intervals.find(t=>t.ms===5000).f();assert.match(feedback(f).textContent,/verified/,'background poll must not erase completed feedback');
 const g=fixture();g.fire('beauty-hub-opened');g.setQueue({success:true,processed:false,jobs:[review]});await g.intervals.find(t=>t.ms===5000).f();let finish;g.setQueue(new Promise(r=>finish=r));button(g).onclick();await tick();assert.match(feedback(g).textContent,/Checking/);button(g).onclick();assert.equal(g.queueCalls.filter(q=>q.action==='recheck').length,1);finish({success:true,processed:true,jobs:[review],recheck:{id:'job1',outcome:'REVIEW'}});await tick();assert.match(feedback(g).textContent,/still needs review/);
 g.setQueue({success:true,processed:false,jobs:[review],recheck:{id:'job1',outcome:'NOT_STARTED'}});button(g).onclick();await tick();assert.match(feedback(g).textContent,/did not start/);
 const z=fixture();z.fire('beauty-hub-opened');z.setQueue({success:true,processed:false,jobs:[review]});await z.intervals.find(t=>t.ms===5000).f();let done;z.setQueue(new Promise(r=>done=r));const background=z.intervals.find(t=>t.ms===5000).f();button(z).onclick();z.fire('beauty-hub-locked');done({success:true,processed:false,jobs:[review]});await background;for(const t of z.timers.filter(t=>t.ms===0))await t.f();assert.equal(z.queueCalls.filter(q=>q.action==='recheck').length,0);assert.equal(feedback(z).textContent,'');
 console.log('PASS queued click survives polling; repeated clicks deduplicated; progress shown; completion persists; REVIEW and NOT_STARTED explicit; logout cancels unsent request; live control marker retained.');
})().catch(e=>{console.error(e);process.exitCode=1;});
'''
(w/'feedback.test.cjs').write_text(s)
