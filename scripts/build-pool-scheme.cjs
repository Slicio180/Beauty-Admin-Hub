/* Readable reference using the previously verified original scheme fixture. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const scheme=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/pool-scheme.json'))).sort((a,b)=>a.n-b.n);
const workbook=fs.readFileSync(path.join(root,'public/assets/pool-scheme.xlsx')).toString('base64');
const cell=p=>p.five?'1 pool of 5':`${p.three||'—'}</td><td>${p.four||'—'}`;
const rows=scheme.map(r=>`<tr data-players="${r.n}"><th scope="row">${r.n}</th>${[3,4].map(n=>r[n].five?'<td colspan="2">1 pool of 5</td>':`<td>${cell(r[n])}</td>`).join('')}</tr>`).join('\n');
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pool Scheme</title>
<style>body{margin:0;background:#111;color:#eee;font:18px system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:24px}h1{color:#ffd700}a{display:inline-block;background:#ffd700;color:#111;padding:12px 18px;border-radius:6px;font-weight:700;text-decoration:none}a:focus-visible{outline:3px solid white;outline-offset:4px}.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;background:#191919}th,td{padding:9px 12px;border:1px solid #555;text-align:center}thead{background:#292929;color:#ffd700}tbody tr:nth-child(even){background:#232323}p{line-height:1.5}@media print{body,table{background:white;color:black}a{display:none}th,td{padding:4px;color:black}}</style></head>
<body><main><h1>Pool Scheme</h1><p>Your supplied scheme for 5–101 players. Choose your preferred pool size, then read how many pools of each size to use.</p>
<p><a href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${workbook}" download="Original-Pool-Scheme.xlsx">Download original Excel file</a></p>
<div class="table-wrap"><table><thead><tr><th rowspan="2" scope="col">Players</th><th colspan="2" scope="colgroup">Prefer 3-player pools</th><th colspan="2" scope="colgroup">Prefer 4-player pools</th></tr><tr><th scope="col">Pools of 3</th><th scope="col">Pools of 4</th><th scope="col">Pools of 3</th><th scope="col">Pools of 4</th></tr></thead><tbody>${rows}</tbody></table></div>
</main></body></html>`;
fs.writeFileSync(path.join(root,'public/assets/pool-scheme.html'),html);
