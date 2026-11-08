'use strict';
function fix(files){
 const name='LiveCastView',old="||league!==''&&event.league!==1";
 if(files.filter(f=>f.name===name).length!==1)throw Error('Expected one LiveCastView');
 return files.map(f=>{if(f.name!==name)return {...f};if(f.source.split(old).length!==2)throw Error('Unsupported LiveCastView source');return {...f,source:f.source.replace(old,'')};});
}
module.exports={fix};
