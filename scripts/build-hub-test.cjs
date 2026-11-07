const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('./build-hub-english.cjs').build();
require('./build-pool-scheme.cjs');
require('./build-pool-service.cjs');
require('./build-player-test.cjs').build();
require('./build-stage-test.cjs').build();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let html = read('public/preview.html');
// Only the generated Google TEST gets the real account service. Offline demo
// and the standalone login preview keep their closed service boundaries.
let login=read('public/login.html').match(/<main class="login-card">([\s\S]*?)<\/main>/)[1];
login=login.replace(/<p class="login-setup">[\s\S]*?<\/p>/,'<p class="login-setup">TEST staff access · Session lasts 6 hours. Reloading or closing this page requires sign-in again.</p>');
html=html.replace('</head>','<link rel="stylesheet" href="css/login.css"><style>#nakkaEventCheck,#nakkaCompare{background:#ffd700;color:#080808;border:0;border-radius:5px;font:inherit;font-size:20px;padding:10px 16px;margin:4px 6px 8px 0;min-height:44px}#nakkaEventCheck:disabled,#nakkaCompare:disabled{opacity:.5}#nakkaEventResult ul{padding-left:24px;font-size:19px}#nakkaEventResult details{margin-top:16px}#nakkaEventResult summary{cursor:pointer;color:#ffd700}</style></head>');
html=html.replace('<body>','<body class="beauty-auth-locked"><section id="beautyAuthSurface" class="login-card">'+login+'</section>');
html=html.replace('<div class="masthead-session"></div>', '<div class="masthead-session"><span id="hubSessionEmail" class="sr-only"></span><button id="hubSignOut" type="button">Sign out</button></div>');
if (!html.includes('id="hubSignOut"')) throw Error('Account controls insertion failed');
html=html.replace('<script src="js/hub-services.js"','<script src="js/hub-auth.js"></script>\n<script src="js/hub-services.js"');
html=html.replace('</body>','<script src="js/login.js"></script><script src="js/hub-live-stats.js"></script></body>');
html=html.replace('<h2 id="nakkaPanelTitle">Nakka</h2>', '<h2 id="nakkaPanelTitle">Nakka</h2>'+read('public/nakka-troubleshooting.html'));
html=html.replace('</body>','<script src="js/hub-nakka-workflow.js"></script><script src="js/hub-nakka-event.js"></script></body>');
html=html.replace('</body>','<script src="js/hub-nakka-transfer.js"></script><script src="js/hub-evening-setup.js"></script></body>');
html=html.replace('<span>Event Control</span>','<span>Evening Setup</span>');
html=html.replace('</body>','<script src="js/hub-player-removal.js"></script></body>');
html=html.replace('</head>','<style>#nakkaTransferOpen{background:#ffd700;color:#080808;border:0;border-radius:5px;font:inherit;font-size:20px;padding:10px 16px;margin:16px 0 4px;min-height:44px}</style></head>');


html=html.replace('<link rel="stylesheet" href="css/beauty-dashboard.css">','');
html=html.replace('</head>','<link rel="stylesheet" href="css/beauty-dashboard.css"></head>');
html = html.replace(/  <meta http-equiv="Content-Security-Policy"[^>]+>\n/, '');
html = html.replace('<head>', '<head>\n  <base target="_top">');
html = html.replace('Hub — local preview', 'Hub — IDENTITY TEST');
html = html.replace('LOCAL DEMO — fictional players. No Sheets or Nakka connection. Changes reset on reload.',
  'IDENTITY TEST — separate test spreadsheet. Registration and status changes are saved here. Event date saving requires review and a backup.');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, file) => {
  let css = read('public/' + file);
  css = css.replace(/url\("([^"]+)"\)/g, (_, asset) => {
    const bytes = fs.readFileSync(path.resolve(root, 'public', path.dirname(file), asset));
    return 'url("data:font/woff2;base64,' + bytes.toString('base64') + '")';
  });
  return '<style>' + css + '</style>';
});
for (const asset of ['aik-dart-yellow.png', 'aik-mandagsdartarna.png', 'aik-crest.svg', 'aik-mandagsdartarna-clean.png']) {
  html = html.replaceAll('assets/logo/' + asset, 'data:image/'+(asset.endsWith('.svg')?'svg+xml':'png')+';base64,' +
    fs.readFileSync(path.join(root, 'public/assets/logo', asset)).toString('base64'));
}
html = html.replace(/<script src="js\/([^"]+)"[^>]*><\/script>/g, (_, file) => {
  let js = read('public/js/' + (file === 'hub-services.js' ? 'hub-test-services.js' : file));
  if (file === 'pool-planner.js') js = read('public/js/pool-seeding.js')+'\n'+js+'\n'+read('public/js/pool-board-allocation.js')+'\n'+read('public/js/pool-board-plan.js')+'\n'+read('public/js/pool-planner-seeded.js');
  if (file === 'app.js') {
    const start = js.indexOf('function addStatusCell(');
    const end = js.indexOf('function setStatusClass(', start);
    if (start < 0 || end < 0) throw new Error('Status UI boundary not found');
    js = js.slice(0, start) + read('public/js/hub-test-status.js') + '\n' + js.slice(end);
    js = js.replace("BeautyHubServices.mode === 'mock' ? 'DEMO' : 'BLOCKED'", "'TEST CONNECTED'");
    js = js.replace('Local preview — no Google connection', 'Google Sheets — separate Identity TEST');
    js = js.replace('  5000\n);', '  15000\n);');
  }
  return '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>';
});
html = html.replaceAll('assets/pool-scheme.html', 'data:text/html;base64,' + fs.readFileSync(path.join(root, 'public/assets/pool-scheme.html')).toString('base64'));
fs.writeFileSync(path.join(root, 'apps-script/registration-identity-test/remote-app/HubTest.html'), html);
console.log('Generated HubTest.html from shared Hub UI, AIK assets and TEST bridge.');
