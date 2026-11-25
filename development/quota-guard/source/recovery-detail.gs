// Explain the saved failed check; it is not a new verification or permission to replay.
function beautyLivePlayerRecoveryRegistrationDetail_(job){
 const labels={displayRead:'The player list could not be read.',response:'The original registration response could not be verified.',master:'The master-list entry could not be verified.',statusRecord:'The saved player record does not match the original registration.',displayIdentity:'The player could not be identified uniquely in the displayed list.',displayStatus:'The displayed IN / OUT / STANDBY status does not match the registration.',displayConsent:'The displayed photo/video consent does not match the registration.',displayMessage:'The displayed message does not match the registration.',displaySource:'The displayed registration source does not match the registration.'};
 const code=job?.readbackFailure;
 if(job?.state!=='REVIEW'||!Object.prototype.hasOwnProperty.call(labels,code))return null;
 return {failedCheck:code,problem:'Last registration check: '+labels[code],next:'If this has already been corrected, use Check after correction to verify the original request. Do not register the player again.'};
}
