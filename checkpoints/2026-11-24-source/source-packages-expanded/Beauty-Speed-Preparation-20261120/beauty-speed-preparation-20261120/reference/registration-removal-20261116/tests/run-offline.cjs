/* Runs local fixtures only. Does not fetch, install, deploy or execute Beauty remotely. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'evidence');
fs.mkdirSync(evidence, {recursive: true});
const changed = ['LiveRegister.js', 'LiveRegistrationQueue.js', 'LiveRemove.js'];
function run(args, log, extraEnv = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: root, env: {...process.env, ...extraEnv}, encoding: 'utf8',
    timeout: 120000, maxBuffer: 10 * 1024 * 1024,
  });
  fs.writeFileSync(path.join(evidence, log), (result.stdout || '') + (result.stderr || ''));
  if (result.error || result.status !== 0) throw new Error('Local check failed: ' + log);
}
for (const name of changed) run(['--check', 'candidate/' + name], name + '.syntax.log');
run(['tests/queue-legacy.cjs'], 'baseline-queue-output.log', {SOURCE_VARIANT: 'baseline'});
run(['tests/queue-legacy.cjs'], 'candidate-queue-output.log', {SOURCE_VARIANT: 'candidate'});
run(['tests/performance-safety.cjs'], 'performance-safety-output.log');
const read = name => JSON.parse(fs.readFileSync(path.join(evidence, name), 'utf8'));
const baseline = read('baseline-queue-test-results.json');
const candidate = read('candidate-queue-test-results.json');
const performance = read('performance-safety.json');
if ([baseline, candidate, performance].some(r => r.result !== 'PASS')) throw new Error('Missing passing evidence');
const hashes = {};
for (const folder of ['baseline', 'candidate']) for (const name of [...changed, 'LiveHub.js']) {
  hashes[folder + '/' + name] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, folder, name))).digest('hex');
}
const result = {
  result: 'PASS', status: 'LOCAL_TESTED_NOT_DEPLOYED', finishedUTC: new Date().toISOString(),
  candidateScenarios: candidate.tests.length + performance.checks.length,
  baselineReferenceScenarios: baseline.tests.length, syntaxCheckedModules: changed,
  remoteCalls: 0, nativeSpeedMeasured: false, sourceSha256: hashes,
};
fs.writeFileSync(path.join(evidence, 'validation-summary.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
