function checkSavedTestPools() {
  if (Session.getActiveUser().getEmail().toLowerCase() !== 'alessiotampella@gmail.com') {
    throw new Error('Use the league owner account in the TEST editor.');
  }
  beautyPoolReconcileAttempt_();
}