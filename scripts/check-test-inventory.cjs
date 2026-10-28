// Offline inventory drift check. Executes only the explicitly inventoried test files.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const inventory = JSON.parse(fs.readFileSync('docs/handoff/test-inventory.json'));
const requirements = new Set(JSON.parse(fs.readFileSync('docs/handoff/requirements.json')).map(r => r.id));
const ids = new Set();
for (const item of inventory) {
  assert(!ids.has(item.id), `duplicate ID ${item.id}`); ids.add(item.id);
  assert(requirements.has(item.requirement), `unknown requirement ${item.id}`);
  assert(fs.existsSync(item.evidence), `missing evidence ${item.id}`);
}
const files = [...new Set(inventory.map(i => i.file))].sort();
function discover(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const file = `${dir}/${e.name}`;
    return e.isDirectory() ? discover(file) : /\.test\.cjs$/.test(file) ? [file] : [];
  });
}
assert.deepEqual(files, discover('tests').sort(), 'unmapped test file');
for (const file of files) {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${file}\n${result.stdout}\n${result.stderr}`);
  const actual = [...result.stdout.matchAll(/^# Subtest: (.*)$/gm)].map(m => m[1]);
  const expected = inventory.filter(i => i.file === file).map(i => i.name);
  assert.deepEqual(actual, expected, `case drift in ${file}`);
}
console.log(`PASS: ${inventory.length} cases across ${files.length} files map to known requirements and evidence.`);
