from pathlib import Path
import json
D=Path(__file__).parent
p=D/'LiveRegistrationQueue.js';s=p.read_text();s=s.replace('function beautyQueueWriteGuard_(player,allJobs=false){','function beautyQueueWriteGuard_(player,allJobs=false){\n beautyRecoveryGuard_(player,allJobs);return beautyQueueWriteGuardWithoutRecovery_(player,allJobs);\n}\nfunction beautyQueueWriteGuardWithoutRecovery_(player,allJobs=false){',1);s=s.replace('function beautyQueueLegacyBlock_(player){','function beautyQueueLegacyBlock_(player){\n beautyRecoveryGuard_(player,false);return beautyQueueLegacyBlockWithoutRecovery_(player);\n}\nfunction beautyQueueLegacyBlockWithoutRecovery_(player){',1);p.write_text(s)
p=D/'LiveHub.js';s=p.read_text().replace("  if(typeof action==='string'&&action.startsWith('queue:'))", "  if(typeof action==='string'&&action.startsWith('recovery:'))return beautyRecoveryService_(action.slice(9),input,token);\n  if(typeof action==='string'&&action.startsWith('queue:'))",1);p.write_text(s)
p=D/'LiveHubView.html';s=p.read_text().replace("consent:input=>rpc('consent',input)","recovery:(action,input={})=>rpc('recovery:'+action,input), consent:input=>rpc('consent',input)",1)
needle=" const stamp=create('p','Checks every 30 seconds while signed in and the Hub is visible.',panel);"
s=s.replace(needle," for(const [label,mode] of [['TRANSFER PLAYERS','transfer'],['IMPORT FROM NAKKA','import'],['RECOVERY','recovery']]){const b=create('button',label,actions);b.type='button';b.dataset.liveNakka='true';b.addEventListener('click',()=>window.BeautyRecovery.open(mode));}\n"+needle,1)
s=s.replace('</body>', '<script>\n'+(D/'recovery-ui.js').read_text()+'\n</script></body>',1);p.write_text(s)
b=json.loads((D/'baseline.json').read_text());cfg=json.loads('null')
for d in b['projects'][0]['deployments']:
 if d['deploymentConfig'].get('description','').startswith('Match message') or d['deploymentConfig']['versionNumber']==32:d['deploymentConfig']['versionNumber']=33
(D/'baseline.json').write_text(json.dumps(b))
