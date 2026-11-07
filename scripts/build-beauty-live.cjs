/* Both TEST entry points use the same four-view cast shell. */
const fs=require('node:fs'),path=require('node:path');
require('./build-stage-test.cjs').build();
const folder=path.resolve(__dirname,'../apps-script/registration-identity-test/remote-app');
fs.writeFileSync(path.join(folder,'BeautyLiveTest.html'),fs.readFileSync(path.join(folder,'StageTest.html'),'utf8'));
console.log('Generated Swedish four-view TEST Live.');
