/* Build-time target validation only. Never edits TEST guards or activates production. */
'use strict';
const TEST=Object.freeze({spreadsheetId:'1SIj4F8_WfWaeDVsdagRw8AoLsz0XsjhtdIn_OOxoDnU',scriptId:'1toxHCexOm5xyillytqPLBidiv62PePvrX4EQROvWeTZddfjrUJGMem6N',eventId:'t_RqC2_2034',firebaseProjectId:'beauty-admin-hub-test'});
function validate(profile){
 const problems=[],required=['schemaVersion','environment','scriptId','spreadsheetId','firebaseProjectId','eventId','leagueId','eventTitle','eventDate','writesEnabled','allowedStaffUids'];
 if(!profile||typeof profile!=='object'||Array.isArray(profile))throw Error('Release profile must be an object.');
 for(const key of Object.keys(profile))if(!required.includes(key))problems.push('Unknown profile field: '+key);
 if(profile.schemaVersion!==1)problems.push('schemaVersion must be 1');if(profile.environment!=='production')problems.push('environment must be production');
 for(const key of ['scriptId','spreadsheetId'])if(typeof profile[key]!=='string'||!/^[A-Za-z0-9_-]{20,160}$/.test(profile[key]))problems.push(key+' must be provisioned');
 if(typeof profile.firebaseProjectId!=='string'||!/^[a-z][a-z0-9-]{4,62}$/.test(profile.firebaseProjectId))problems.push('firebaseProjectId must be provisioned');
 if(typeof profile.eventId!=='string'||!/^t_[A-Za-z0-9]+_[A-Za-z0-9]+$/.test(profile.eventId))problems.push('eventId must be a real Nakka event');
 if(typeof profile.leagueId!=='string'||!/^lg_[A-Za-z0-9]+_[A-Za-z0-9]+$/.test(profile.leagueId))problems.push('leagueId must be a real Nakka league');
 if(typeof profile.eventTitle!=='string'||!profile.eventTitle.trim()||profile.eventTitle.length>300||/TEST|DO NOT USE LIVE/i.test(profile.eventTitle))problems.push('eventTitle must identify the approved live event');
 if(typeof profile.eventDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(profile.eventDate)||!Number.isFinite(Date.parse(profile.eventDate))||new Date(profile.eventDate).toISOString().slice(0,10)!==profile.eventDate)problems.push('eventDate must be a valid calendar date');
 if(profile.writesEnabled!==false)problems.push('Production writes must remain disabled in this preparation profile');
 if(!Array.isArray(profile.allowedStaffUids)||!profile.allowedStaffUids.length||profile.allowedStaffUids.some(v=>typeof v!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(v))||new Set(profile.allowedStaffUids).size!==profile.allowedStaffUids.length)problems.push('allowedStaffUids must explicitly list unique approved staff');
 if(profile.eventId==='t_QHaG_7792')problems.push('eventId must be isolated from registration TEST');
 for(const key of Object.keys(TEST))if(profile[key]===TEST[key])problems.push(key+' must be isolated from TEST');
 if(problems.length){const error=Error(problems.join('; '));error.code='PROFILE_NOT_READY';throw error;}
 const copy=JSON.parse(JSON.stringify(profile));copy.allowedStaffUids=Object.freeze(copy.allowedStaffUids);return Object.freeze(copy);
}
function readiness(profile){validate(profile);return Object.freeze({result:'PROFILE_VALID_NOT_ACTIVATED',writesEnabled:false,blockers:['Migrate and verify runtime TEST-only guards for the approved production targets','Complete native TEST rehearsal and provider field qualification','Create production backup, readback and rollback evidence']});}
module.exports={validate,readiness};
