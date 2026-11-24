// Offline reproduction of the current LIVE import contract. No network or writes.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const source = fs.readFileSync(path.join(root, 'native-readback/LiveRecovery.js'), 'utf8');
const client = fs.readFileSync(path.join(root, 'native-readback/LiveHubView.html'), 'utf8');
const results = [];
const key = value => String(value || '').trim().toLowerCase();
function run(name, fn) { fn(); results.push({ name, result: 'EXPECTED_BEHAVIOR_REPRODUCED' }); }
function stateFor(statusRows) {
  const snap = {
    "TONIGHT'S PLAYERS": { display: [['PLAYER', 'OLD NAME', 'STATUS']] },
    'PLAYER STATUS DATA': { display: [['PLAYER', 'OLD NAME', 'STATUS'], ...statusRows] }
  };
  const ctx = vm.createContext({
    beautyLiveRegistrationKey_: key,
    beautyLiveRemoveHash_: value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),
    beautyQueueWriteGuard_: () => {},
    beautyQueueLegacyBlock_: () => {},
    // Explicitly simulate the linked Google Form being paused. This is not a LIVE observation.
    beautyEventExternalWritesClosed_: () => {}
  });
  vm.runInContext(source, ctx);
  ctx.beautyRecoveryEvent_ = () => ({ target: { mode: 'league' }, provider: { status: 20 } });
  ctx.beautyRecoverySnapshot_ = () => ({ ss: {}, snap });
  ctx.beautyRecoveryEntries_ = () => [{ name: 'Synthetic Nakka Player', tpid: 'AB12', lpid: 'CD34' }];
  return ctx;
}
run('Absent status row permits a manual import preview state', () => {
  const s = stateFor([]).beautyRecoveryState_('import', 'Synthetic Nakka Player');
  assert.equal(s.state.identity.name, 'Synthetic Nakka Player');
});
run('Name-only status row rejects the same Nakka-only player', () => {
  assert.throws(() => stateFor([['Synthetic Nakka Player', '', '', '', '', '']]).beautyRecoveryState_('import', 'Synthetic Nakka Player'), /Import would replace an existing or previously removed Hub record/);
});
run('Existing OUT record is protected by the current guard', () => {
  assert.throws(() => stateFor([['Synthetic Nakka Player', '', 'OUT', 'NEJ', '', 'HUB']]).beautyRecoveryState_('import', 'Synthetic Nakka Player'), /Import would replace an existing or previously removed Hub record/);
});
run('The current client hides a failed preview behind a generic busy message', () => {
  const start = client.indexOf('async function call(action,input,working)');
  const end = client.indexOf('async function check(item,b)', start);
  const block = client.slice(start, end);
  assert.ok(block.includes("if(!r?.success){status.textContent='Issue not solved. Try Resolve issue when the current action has finished.'"));
});
run('The current import path requires a preview ticket and explicit confirmation', () => {
  assert.ok(source.includes("input.confirmed==='true'"));
  assert.ok(source.includes("cache.get(k)||'null'"));
  assert.ok(client.includes("'CONFIRM IMPORT'"));
  assert.ok(client.includes("call('save',{ticket:r.ticket,confirmed:'true'}"));
});
const output = {
  status: 'CURRENT_DEFECT_REPRODUCED_NOT_FIXED',
  checkedAt: new Date().toISOString(),
  results,
  assertions: results.length,
  scope: 'Offline synthetic dependency stubs; actual current LiveRecovery state guard and client source inspected. No network, real Sheets, Nakka, credentials, triggers, deployments or registration writes.',
  limits: 'Does not recover the hidden LIVE preview response, prove the original registration route, validate an automatic import implementation or measure end-to-end performance.'
};
fs.writeFileSync(path.join(root, 'contract-reproduction.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
