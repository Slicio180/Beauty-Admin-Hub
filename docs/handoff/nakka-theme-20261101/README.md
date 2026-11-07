# Beauty Nakka theme — inactive Hub launch staging

This directory contains a tested CSS release and instructions for the eventual combined Hub launch. It is a handoff asset, not an enabled Hub feature. No Hub runtime imports it automatically.

`launch.json` deliberately has `enabled: false`, `autoApply: false` and `targetEventId: null`. Do not automatically apply this theme to new or existing events. Monday 2 November 2026 must retain the normal layout. The custom layout is to launch together with the Hub only after Alessio approves a named target event.

## Applying at the combined launch

1. Confirm the target event and record its current Theme selection and complete CSS URL.
2. Use the pinned URL in `launch.json`. In that event's Detail settings, select Customise and paste the URL into Theme CSS URL, then save. The field takes a URL, not CSS source code.
3. League defaults affect new events; an existing event has its own settings. Change league defaults only when that broader scope is explicitly approved.
4. Check the event on the tablet in portrait and landscape: bracket, open match, keypad, Stats, Watch Game/Exit, Live and Results.
5. To roll back, restore the exact prior Theme selection and URL. Do not reset players, draws or results.

Keep pinned filenames unchanged. Publish future revisions under a new content-hash filename. Credentials and passwords must not be stored in this directory.

## Live behaviour verified on 1 November 2026

The native Live card flashed and disappeared while the scoring session was inactive. Reopening the actual scorer restored it. With the scorer open and new TEST throws submitted, the user verified remaining scores C441 then B476/C441 and correct turn-marker changes. Two simultaneous pool matches were then verified, followed by one completed match moving to Results while the other remained in Live.

This is the behaviour of the controlled test, not a claim that every backgrounding or disconnection case has been tested. A direct Watch Game view can display retained match data and is not proof that the match is currently present in the Live list.

For operation, keep the actual scorer open on the scoring tablet and use another device or screen for Live. If Live becomes empty, first check that the scorer is open, connected and submitting updates. Compare Bracket and Results before assuming data is lost. Reopen Watch Game from the event after a theme update; an already-open viewer can retain an older CSS URL.

START and NU group averages intentionally remain on Beauty Live venue screens only. Native Nakka cards show provider scores, averages and ranks. The interfaces have separate renderers.

## Installation and verification

Run the supplied installer from the Beauty-Admin-Hub project root. It validates the package name, file checksums and inactive manifest before adding this directory. It refuses to overwrite differing existing files and can be rerun safely. It makes no Google upload, commit, push or deployment and does not edit Hub application code.

After installation, open this directory in VS Code and confirm `launch.json` is still inactive. Runtime launch wiring is intentionally not added by this staging installer.
