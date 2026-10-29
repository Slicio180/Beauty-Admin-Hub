/* Local validation only. Does not upload or activate a ranking. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{qualify}=require('../server/league-ranking.cjs');
function main(args){
 if(args.length!==3)throw Error('Usage: node scripts/qualify-native-ranking.cjs native-ranking.json profiles.json output.json');
 const input=JSON.parse(fs.readFileSync(args[0],'utf8')),profiles=JSON.parse(fs.readFileSync(args[1],'utf8'));
 const snapshot=qualify(input,profiles);fs.writeFileSync(path.resolve(args[2]),JSON.stringify(snapshot,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('Native ranking contract validated. '+snapshot.rows.length+' league identities; no upload or activation.');
}
module.exports={main};if(require.main===module)try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
