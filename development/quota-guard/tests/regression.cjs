// Redirect only application reads to the private assembled candidate.
const fs=require('fs'),path=require('path'),Module=require('module');
const candidate=path.resolve(process.argv[2]),repo=path.resolve(__dirname,'../../..');
const file=path.join(repo,'development/player-ratings/tests/ratings.cjs');
// The original uses single quoted suffixes, so replace the root expression instead.
const original=fs.readFileSync(file,'utf8').replace("const root=path.resolve(__dirname,'..')",'const root='+JSON.stringify(path.dirname(candidate)) ).replaceAll("root+'/application", "root+'/"+path.basename(candidate));
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(original,file);
