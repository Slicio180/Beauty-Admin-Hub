"""Standalone preview: exact candidate card/CSS, synthetic state, no network."""
from pathlib import Path
import re,sys
root=Path(__file__).resolve().parent
candidate=Path(sys.argv[1]);output=Path(sys.argv[2])
html=(candidate/'LiveHubView.html').read_text()
styles='\n'.join(re.findall(r'<style[^>]*>([\s\S]*?)</style>',html))
assert not re.search(r'url\([\s\"\x27]*https?://',styles), 'Unexpected external CSS request'
card=(root/'source/status-card.html').read_text()
js=(root/'source/status-card.js').read_text()
prefix='''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'"><title>Beauty — System Status preview</title><style>'''
css='''\nbody{display:block!important;background:#080b0c;color:#fff;margin:0;padding:24px;box-sizing:border-box;min-height:100vh}.preview-tools{position:static;max-width:760px;margin:0 auto 20px;font:18px/1.5 sans-serif}.preview-tools button{margin:4px;padding:8px 12px;background:#151a1b;color:#ffd700;border:1px solid #ffd700;cursor:pointer}.hub-health-panel{position:static;margin:auto;width:min(760px,100%);max-height:none!important}.preview-login{border-top:1px solid #383a3e;padding-top:16px;font:20px/1.4 'AIK Display',serif}.preview-login h3{font-size:24px;color:#ffd700}'''
controls='''</style></head><body><div class="preview-tools"><strong>OFFLINE PREVIEW · sample data</strong><p>No Google or Nakka connection. Choose a display state:</p><button id="systemStatusNavButton">Usage</button><button data-state="COOLDOWN">Google limit</button><button data-state="TEST_LIMIT">TEST limit</button><button data-state="RECHECK_DUE">Recheck due</button><button data-state="UNAVAILABLE">Unavailable</button></div><dialog open id="systemStatusPanel" class="hub-health-panel"><h2>System Status</h2>'''
login='''<section class="preview-login"><h3>Sign-in message preview</h3><p id="loginPreview">Sign-in is temporarily paused because Google reported its daily request limit. Please try later; there is no need to reset your password.</p></section></dialog><script>let previewState='COUNTING';const BeautyHubAuth={generation:()=>1,token:()=> 'PREVIEW',isCurrent:()=>true};const BeautyHubServices={quota:async()=>{if(previewState==='UNAVAILABLE')throw Error('Preview unavailable');return {success:true,measured:true,attempted:previewState==='TEST_LIMIT'?2000:128,state:previewState,blockedUntil:Date.now()+1800000,checkedAt:Date.now(),test:true,testBudget:2000,backgroundState:'PAUSED'};}};'''
end="""document.getElementById('systemStatusNavButton').addEventListener('click',()=>{});for(const button of document.querySelectorAll('[data-state]'))button.addEventListener('click',()=>{previewState=button.dataset.state;document.getElementById('systemStatusNavButton').click();});document.getElementById('systemStatusNavButton').addEventListener('pointerdown',()=>{previewState='COUNTING';});document.getElementById('systemStatusNavButton').click();</script></body></html>"""
output.write_text(prefix+styles+css+controls+card+login+js+end)
print('Saved offline preview:',output)
