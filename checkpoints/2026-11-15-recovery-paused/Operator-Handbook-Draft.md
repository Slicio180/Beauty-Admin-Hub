Beauty helps organisers run dart events. It brings together player registration, the organiser’s player list and links to Nakka, the service used for the competition. This handbook is for a helper who has never used Beauty before.

**Working draft — 15 November 2026.** Start with the introduction below. Procedures headed **TEST only** are practice and diagnostic procedures, not instructions for running a live event. Recovery is visible in the TEST side menu with a circular-arrow icon. LIVE uses rounded menu tabs with white inactive labels; the selected tab is yellow with dark text. This appearance was accepted by the organiser. LIVE version 36 now displays uppercase side-menu labels. Select these labels as you would their previous mixed-case versions; their actions are unchanged. The sidebar will be made narrower in a future grouped update.

**Current recovery checkpoint:** the closed-event popup correction was installed in TEST with full source readback confirmed by the owner’s installer log on 15 November 2026 at 23:23 Stockholm time. One HTML file changed, 37 files were preserved and none added. The exact baseline guard also confirms the preceding automatic-check and registration-gate source was present. The corrected popup still needs visual confirmation after reloading TEST; installation is not end-to-end event acceptance. LIVE is unchanged.

# Understand the parts of Beauty

| Name | What it is for |
| --- | --- |
| Admin Hub | The organiser’s control screen for the event and its players. |
| Kiosk | A shared device where players register themselves. |
| Mobile registration | A registration page players open on their own phones. |
| Beauty Live | The display shown to people at the venue. It is separate from the organiser’s Hub. |
| Nakka | The external competition service that holds event entries and competition information. |
| Event | One particular competition or playing session, identified by its title and date. |
| Player list | The people associated with the selected event. |

**Transfer** means sending players from Beauty to Nakka. **Import** means bringing Nakka entries into Beauty. Neither word means moving to another event. Always read the event title and date before starting either action.

# Know whether you are in TEST or LIVE

**LIVE** is used for real events and real registrations. **TEST** is used to practise and check changes. A successful TEST check does not mean a feature has been released to LIVE.

Use the link supplied by the event organiser. Before making changes, check the environment, event title and date. If you cannot identify them, ask the organiser before continuing. Never use a test fault or diagnostic control during a real event.

# Sign in and sign out

## Sign in

1. Open the Hub link supplied by the organiser.

2. Enter your staff email address and password.

3. Select **Sign in**.

4. Wait for the Hub to finish loading.

5. Check the selected event title and date before changing anything.

If sign-in fails, check that you used the correct staff account and Hub link. Ask the organiser for access if needed. Do not share your password in a screenshot.

## Leave a shared computer

1. Finish the action you are carrying out and read its result.

2. Close any open panel.

3. Use the Hub’s sign-out control.

4. Check that the sign-in page appears. In the TEST Hub, it displays **You are signed out**.

Closing a panel is not the same as signing out. On a shared computer, do not save your password in the browser.

# Understand recovery

An action can save successfully even if its reply or display refresh fails. For example, a player’s information may be saved while the screen still needs updating. Repeating the original registration or transfer can create confusion or duplicates.

**Recovery** means inspecting the saved result and completing only the work that remains. **RECHECK** asks Beauty to check an existing operation. It does not mean “register this player again.” Its exact scope depends on the control you are using.

| Message | Meaning | What to do |
| --- | --- | --- |
| Reading or checking | A request is still running. | Wait for the result. Do not click repeatedly. |
| REVIEW or needs review | Beauty cannot yet confirm that the whole operation is complete. | Read the explanation. Use the recovery control for that saved operation when instructed. |
| VERIFIED | The checks for that operation succeeded. | Read the result and continue. This applies to that operation, not every part of the system. |
| Reply was not received | The screen does not know the result of the request. | Read the saved receipts before deciding what to do next. Do not assume nothing was saved. |

# Recognise the recovery colours

Player recovery in TEST uses compact badges beside affected player names and coloured cards in Recovery. The diagnostic colour examples remain under TEST DIAGNOSTICS; they are demonstrations, not player problems.

| Colour | Meaning | Operator response |
| --- | --- | --- |
| Red | Beauty needs help with this player’s specific problem. | Open the card, read the explanation and follow the numbered steps. |
| Orange | Beauty is checking or attempting eligible recovery automatically. | Let it finish; do not register or transfer the player again. |
| Green | Recovery for this item has been verified. | No action needed; the history can explain what happened. |

Read the message as well as the colour. A green item confirms that item’s recovery, not the health of the whole system. TEST diagnostic examples are separate from real player cards. LIVE availability remains unconfirmed.

# TEST player recovery during registration

**Availability:** the corrected popup is installed in TEST. Reload the TEST Hub to load the new page. Closed-event cards should immediately explain the problem and offer **Go to player list**, without a transfer retry. Copy report should remain available during background checks. These behaviours passed local checks; post-reload native visual confirmation remains pending. This is not yet a LIVE procedure.

## Let Beauty check first

1. Sign in to the TEST Hub and check the selected event title and date.

2. Beauty checks the selected event automatically while the Hub is open. You do not need to verify each player.

3. Open **Recovery** or an affected player’s compact **Needs help**, **Checking** or **Resolved** badge.

4. For a red card, read the player-specific explanation and follow its numbered steps. Confirm a reviewed action only when the displayed player and event are correct.

5. Once resolved, the item becomes green. Open **Issue history and report** or use **Copy report** to retain the explanation. Select **Close** to return to registration.

In the prepared correction, ordinary players and unchecked players do not appear as individual recovery tasks. A pending or failed event check is shown once at event level. **Not yet verified** in the older interface is not an instruction to verify every player manually. The original player table and diagnostic controls remain in place.

## Registration is closed

An event that has finished must not accept new registrations. The prepared correction checks Nakka’s event status before saving through Hub, kiosk or mobile. If the event is closed, the message says **Registration is closed** and **Nothing was saved**. Select the correct upcoming event before trying to register there. If the status cannot be checked, nothing is saved.

A registration already saved by the older version needs a different response. If you know it was a mistaken late registration, close the recovery popup, find the player in the Hub player table and change **IN** to **OUT**. This preserves the original registration and excludes the player from the IN list. Do not reopen the completed event or repeat the transfer to make the warning disappear. If the status change does not confirm, retain the message and ask for support; do not delete the registration row.

the affected TEST player in the completed AIK Hub TEST 2026-11-07 event was the observed example. The report showed **TEST_TARGET_ONLY** after the Hub registration had already saved. The owner’s 23:22 screenshot shows him as **OUT**, but still with a Needs help badge. The Remove player popup refused removal because the event had completed. OUT excludes him from the IN list; it does not delete his saved registration. The owner confirmed that this issue did not block the TEST system. Complete cleanup and warning clearance remain unresolved.

## Matching lists and recovery checks

**COMPARE LISTS** compares names. Sixteen matching names and zero missing or duplicate names do not prove every identity or earlier operation is verified. Beauty’s automatic recovery check also examines the selected event, identities and saved operations.

The prepared correction fixes an expired-timestamp problem: repeated successful checks retained an old individual timestamp, which Recovery mistakenly treated as unchecked. It now uses a fresh completed check of the same roster. A failed or stale check must not be shown as green.

## Meaning of workspace

A **workspace** here means the separate spreadsheet used for a particular TEST exercise. **SEPARATE RECOVERY TEST WORKSPACE** is a diagnostic area, separate from the event selected at the top of the Hub. You do not need its preview or recheck controls for ordinary player registration. Completed diagnostic exercises should stay completed.

**Owner decision at pause:** keep the diagnostic tools and their records in the system, hidden during normal operation and revealed only when needed. This replaces the earlier request to leave those controls visible. Implementation was stopped before any cleanup or visibility change was made; the controls may still be visible in the installed TEST page. Do not delete diagnostics or resume development until the owner asks.

# TEST only Read saved recovery results

These sections describe supervised TEST diagnostics. Open **Recovery**, then the named diagnostic section. They are not the everyday player-recovery procedure. Keep these tools in their existing location; do not rerun completed exercises to operate the Hub.

## Separate recovery workspace TEST

**Native TEST result on 15 November 2026:** the owner’s final workspace screenshot shows all four controlled repairs as **COMPLETE**: TRANSFER FAULT, TRANSFER CHECK, IMPORT CHECK and IMPORT FAULT. The import-fault sequence also showed **Imported and verified** before the refreshed list displayed COMPLETE. This supersedes the earlier partial-setup instructions. Do not repeat setup, deliberate interruptions or repair confirmations.

This section uses **Beauty Recovery TEST 2026-11-15 R1**, its own workbook and its own master list. It is separate from the event shown at the top of the main Hub. No Form is linked. Open **Recovery → SEPARATE RECOVERY TEST WORKSPACE → CHECK WORKSPACE** to inspect it. Opening the section alone makes no request. Do not repeat workspace creation, connection initialization, or the old formula Setup/Interrupt.

### Completed setup and repair exercise

The earlier entry-ID inspection and setup-resume instructions are historical. The separate workspace is now populated and its four controlled repair results are COMPLETE. Preserve its records and audit folders. No new fixture setup is required for the player recovery correction.

### Historical supervised repair sequence

The table records the controlled test procedure and its expected results. The owner’s later screenshot shows all four final repairs COMPLETE. It is retained to explain the test, not as a request to run it again.

| Order | Exact player name | Action and expected result |
| --- | --- | --- |
| 1 | BEAUTY TEST R1 TRANSFER FAULT | PREVIEW TRANSFER. Confirmation deliberately discards the add reply and interrupts immediate readback. Expected REVIEW with TEST_TRANSFER_READBACK_INTERRUPTED. Keep its saved reference. |
| 2 | BEAUTY TEST R1 IMPORT CHECK | PREVIEW IMPORT while the first transfer is still pending. Expected COMPLETE. This checks whether an unrelated import can finish. |
| 3 | BEAUTY TEST R1 TRANSFER FAULT | CHECK WORKSPACE, then RECHECK SAVED RESULT beside this repair. Expected COMPLETE without sending another add. |
| 4 | BEAUTY TEST R1 TRANSFER CHECK | PREVIEW TRANSFER. Expected COMPLETE. |
| 5 | BEAUTY TEST R1 IMPORT FAULT | PREVIEW IMPORT. Confirmation deliberately interrupts the display after source records are saved. Expected REVIEW with TEST_IMPORT_DISPLAY_INTERRUPTED. Then CHECK WORKSPACE and RECHECK SAVED RESULT; expected COMPLETE without another source append. |

A deliberate interruption is labelled **CONTROLLED TEST**. These interruptions apply only to the named synthetic players in the separate workspace. They are not normal event behaviour and are not part of event-day recovery.

### Understand results and limits

Transfer sends one uniquely registered IN player to Nakka using an existing league identity. The repair tool never creates league members; only the owner’s controlled fixture setup does that here. Import brings one Nakka entry absent from this workbook into Beauty with consent **N/A**. Its chosen event-window timestamp is not the original Nakka registration time. Preview saves a ten-minute review ticket but changes no player records.

If a reply is missing, select **CHECK WORKSPACE**, then **RECHECK SAVED RESULT** for that operation. Do not confirm again. Recheck can inspect an attempted write and rebuild the derived display, but cannot resend an add or append. Keep the reference if it remains REVIEW.

A changing Nakka list can make an uncertain earlier transfer require review. Beauty must inspect the existing entry and preserve the original operation record, rather than repeat an uncertain add. Local tests cover guided existing-entry review and other arrivals; broad native event-day acceptance remains pending.

### Existing menus and monitoring

The installed Nakka/Recovery layout, existing controls and completed formula exercise remain available. Player checks run every 30 seconds while the Hub is visible; API health is separate at five minutes. Green means verified clear, orange checking or incomplete, and red a reported issue. Colour preview cards are examples. The approved TEST visuals and LIVE’s existing recovery capabilities remain recorded in the promotion map; nothing in this test package deploys LIVE.

1. Sign in to the TEST Hub and wait for it to load.

2. Select **Recovery** directly from the Hub side menu.

3. Check the test event title and synthetic player shown at the top.

4. Read each card’s saved result. **Last result: verified** describes a saved result; opening the panel does not run a new recovery check.

5. To read the saved results again, select **REFRESH RECEIPTS**.

6. When instructed to check an operation, select **RECHECK** beside that specific card once.

7. Wait for the result message. Do not switch to another action while the check is running.

8. If it reports **VERIFIED**, read the accompanying explanation. If it still needs review, preserve the message and ask the organiser or support person to inspect it.

9. Select **CLOSE** when finished.

The panel can scroll. If a heading or control is outside the visible area, scroll inside the panel.

## If the reply is lost

Select **REFRESH RECEIPTS** to read the saved state. Do not repeat a confirmation simply because its reply was lost. If the saved state remains unclear, record the event title, affected operation, exact message and approximate time, then ask for help. Do not delete records or clear saved receipts to make an error disappear.

# TEST only Preview the colours

1. Select **Recovery** from the Hub side menu.

2. Expand **COLOUR PREVIEW — DISPLAY ONLY**.

3. Compare the red, orange and green example cards.

4. Collapse the preview when finished.

These are examples, not current issues. Opening this section makes no server request and changes no records. There is no RECHECK button on the examples.

# TEST only Understand the unfinished operation exercise

This exercise is for a supervised test session. It deliberately interrupts the display refresh for a synthetic player whose source information is already saved. It does not add a player or append a registration row. Do not run it as an everyday repair procedure. The exercise rebuilds a separate test display directly. It does not check the formulas that populate the normal player list or the Google Form connection. A green result here therefore does not confirm that normal registration recovery is ready. The read-only event/workbook connection check passed on 15 November at 16:10 Stockholm time. The actual TEST player-list formulas have been inspected. The TEST editor showed zero triggers for the current account; the workbook menu showed Create a new form. These observations do not establish that no other account or script can write data. Full registration recovery remains unfinished.

1. Open the authorised **Recovery TEST** panel.

2. Under **Unfinished operation test**, select **PREVIEW TEST**.

3. Read the preview. If it is accepted, a **CONFIRM DISPLAY TEST** button appears. The preview is valid for ten minutes.

4. Only when instructed to run the exercise, select **CONFIRM DISPLAY TEST** once.

5. The expected result is **REVIEW** with `TEST_UNFINISHED_DISPLAY_FAILURE`. In this exercise, that message confirms the deliberate interruption.

6. Find the **Unfinished operation recovery** card and select its **RECHECK** button once.

7. Wait for **VERIFIED**, then check that the card shows a verified result.

If the expected message does not appear, stop and preserve the actual result for inspection. If confirmation’s reply is lost, refresh receipts rather than confirming again. A completed exercise does not need to be repeated to check the colours.

# TEST only Check recovery with real spreadsheet formulas

**Completed successfully in native TEST on 15 November 2026 at 16:47 Stockholm time.** The corrected diagnostic resumed the preserved setup, deliberately interrupted the synthetic player's display update, and recovered it using the real spreadsheet formulas. No source rows were appended during recovery, no Nakka calls were made, and the original event tabs and earlier receipts were verified unchanged. The provider was simulated, so this result does not establish full normal Hub or Nakka integration. The sequence below documents the supervised exercise; it is not a request to repeat it. The normal-Hub connection was subsequently installed and its isolated current-result check and recheck were verified in the owner's TEST Hub. It connects only this isolated formula fixture; full real-event recovery remains unfinished.

The test copies the inspected player-list formulas into these isolated tabs. It creates one synthetic player to preserve and one synthetic player whose status update will be interrupted. Nakka is simulated: no Nakka request is made. A successful result will verify this formula exercise, not release recovery to LIVE.

1. With the TEST editor closed, install Beauty-TEST-Formula-Readback-Fix-20261115.cjs from Terminal. It updates only the existing formula diagnostic, preserves the other 35 source files and leaves deployment settings unchanged. It does not run a function or change spreadsheet records. Return the installer result first.

2. After TEST_LAB_INSTALLED or ALREADY_INSTALLED, reopen the TEST script editor and select BeautyFormulaRecoveryTest20261115.gs.

3. Select beautyTestFormulaResumeSetup20261115 and click Run once. Use Resume Setup for the preserved failed setup, not the original Setup function. It verifies the existing source rows, tab identities, formulas and receipts, then rebuilds the fixture status display. It creates no tabs and rewrites no source rows or formulas. Expected result: FORMULA_TEST_READY with resumedExistingSetup: true. Send the execution log before proceeding to interruption.

4. When instructed, run beautyTestFormulaInterrupt20261115 once. It saves an operation receipt, clears only the synthetic target's display status and deliberately interrupts refresh. Expected result: FORMULA_RECOVERY_REVIEW with TEST_FORMULA_DISPLAY_INTERRUPTED.

5. Run beautyTestFormulaRecheck20261115. Expected result: FORMULA_RECOVERY_VERIFIED. Recovery updates only the test display status column and its own receipt; it must preserve both source records, all formulas, the other synthetic player, original event tabs and earlier test receipts.

6. Once FORMULA_RECOVERY_VERIFIED appears, retain the saved result and stop. This exercise is now complete; no further interruption or setup run is needed. Never use these diagnostic functions during a real event.

If a reply is lost after interruption, use RECHECK instead of repeating interruption. If setup stops with FORMULA_SETUP_INCOMPLETE_PRESERVE_EVIDENCE, keep its partial tabs and log for inspection; do not rerun setup or delete its evidence. A changed source, formula, event or receipt must be inspected before continuing. These are diagnostic procedures, not everyday operator repair instructions.

# TEST only Check the formula result through the Hub

**Installed and verified through the owner's TEST Hub — 15 November 2026, 17:13–17:14 Stockholm time.** CHECK CURRENT RESULT showed VERIFIED at 16:13:15.019Z; after the instructed RECHECK ISOLATED DISPLAY action, the owner supplied a second VERIFIED result at 16:14:19.030Z. Both displayed original receipt unchanged, no source rows appended and no Nakka calls. This confirms the isolated Hub path with a simulated provider, not real-event recovery or a newly injected interruption. The steps below document the completed acceptance; no repeat is needed.

1. Close the TEST Apps Script editor. Download Beauty-TEST-Normal-Hub-Recovery-20261115.cjs to Downloads and run it from Terminal with Node. It checks the fixed TEST project, saves a backup, changes two Hub files and adds one adapter. It preserves 34 other files and does not deploy or execute Beauty functions.

2. Return the installer log first. If it reports STOPPED, preserve its audit folder and exact error; do not bypass its source checks. Do not repeat formula Setup or Interrupt.

3. Reload the existing owner TEST Hub editor-preview URL and sign in. Open **Recovery**, then find **Real-formula check · isolated TEST**. The owner supplied screenshots of this section and its verified results on 15 November 2026.

4. Select **CHECK CURRENT RESULT**. This reads the saved result and checks the current isolated display without writing spreadsheet cells. Expected result: **VERIFIED**, with a check time and an explicit statement that the provider is simulated.

5. **RECHECK ISOLATED DISPLAY** becomes available after a successful current-result check. It can rebuild only the isolated display status column from already-saved source records. It cannot append source rows, contact Nakka, recreate the test or rewrite its original receipt. Use this only during supervised TEST acceptance; it is not an event-day repair button.

6. If a reply is lost, use **CHECK CURRENT RESULT** before another recheck. After a 60-second timeout, close and reopen Recovery, then check the current result. No request is repeated automatically. If the event changes or the session expires, reopen the panel after selecting the correct TEST event and signing in.

7. Keep the displayed result for review, then close the panel. A verified isolated result does not release normal event recovery to LIVE.

# Get help without repeating an uncertain action

Tell the organiser or support person:

- Whether you are using TEST or LIVE.

- The event title and date.

- Which screen and button you used.

- The exact message and approximate time.

- Whether the player is already visible in Beauty or Nakka, if you can check without making changes.

Include a screenshot if useful, but leave passwords and other credentials out. Keep the original records and saved recovery information intact.

# Chapters to add as the workflow is verified

The complete event-day handbook will also cover selecting or creating an event, registering existing and new players, status and consent changes, messages, sorting the player list, transfers and imports, Beauty Live, competition controls, ending an event and opening the next one. Those click-by-click chapters will be added as their current screens and results are checked.

The future Instructions side panel will present the relevant chapter beside each task, with search across headings, procedures, button names and error messages. Search results will show a short excerpt and open the matching section; everyday phrases such as “player missing” should lead to relevant help. This draft and its search have not yet been installed in that panel.
