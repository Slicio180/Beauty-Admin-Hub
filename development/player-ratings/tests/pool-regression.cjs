const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const base=path.resolve(__dirname,'..'),repo=path.resolve(base,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'beauty-ratings-pools-'));
try{fs.cpSync(repo+'/checkpoints',temp+'/checkpoints',{recursive:true});fs.cpSync(repo+'/development/pool-methods',temp+'/development/pool-methods',{recursive:true});
const dest=temp+'/development/pool-methods';if(!fs.existsSync(dest+'/application/LivePlanner.gs'))execFileSync('python3',[dest+'/prepare.py'],{stdio:'inherit'});
for(const name of ['LivePlanner.gs','LiveHubView.html'])fs.copyFileSync(base+'/application/'+name,dest+'/application/'+name);
execFileSync(process.execPath,[dest+'/tests/draw.cjs'],{stdio:'inherit'});
}finally{fs.rmSync(temp,{recursive:true,force:true});}
