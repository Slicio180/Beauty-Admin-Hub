'use strict';
// Membership is the exact lgid, not the independent top-level league flag.
const changes={
 LiveEventContext:"||c.mode==='league'&&e.league!==1",
 LiveRegister:"||t.mode==='league'&&e.league!==1",
 LiveHub:"||target.mode==='league'&&event.league!==1",
 LivePlanner:"||(typeof beautyContextStandalone_==='function'&&beautyContextStandalone_()?false:t.league!==1)"
};
function fix(files){
 for(const name of Object.keys(changes))if(files.filter(f=>f.name===name).length!==1)throw Error('Expected one '+name);
 return files.map(f=>{const old=changes[f.name];if(!old)return {...f};if(f.source.split(old).length!==2)throw Error('Unsupported source: '+f.name);return {...f,source:f.source.replace(old,'')};});
}
module.exports={fix};
