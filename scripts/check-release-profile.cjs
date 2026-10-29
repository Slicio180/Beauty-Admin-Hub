/* Offline only. No deployment, provision, credentials or provider requests. */
const fs=require('node:fs'),path=require('node:path'),{readiness}=require('../server/release-profile.cjs');
try{const file=process.argv[2];if(!file)throw Error('Pass a release profile JSON file.');console.log(JSON.stringify(readiness(JSON.parse(fs.readFileSync(path.resolve(file),'utf8'))),null,2));}
catch(error){console.error(JSON.stringify({result:'NOT_RELEASE_READY',reason:error.message}));process.exitCode=2;}
