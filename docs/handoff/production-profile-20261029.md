# Production profile preparation - not activated

The current application remains fixed to the dedicated TEST project/event.
This preparation adds an offline schema/validator, not a live runtime migration.

`config/release-production.template.json` deliberately contains blanks for the
production script, spreadsheet, Firebase project, event and approved staff.
It contains no passwords or tokens. Production writes must remain false.

When the production identities are provisioned, copy the template to a private
working profile and validate it locally:

```
node scripts/check-release-profile.cjs /path/to/approved-production-profile.json
```

An incomplete template returns NOT_RELEASE_READY with exit code2. A valid profile
returns PROFILE_VALID_NOT_ACTIVATED. Neither result deploys, edits source, changes
properties, creates an event, grants access or sends a provider request.

The validator rejects the current TEST script, TEST spreadsheet, TEST event,
TEST Firebase project, unknown fields, injected endpoint fields, invalid dates,
missing/duplicate staff and any attempt to enable writes. The intended league
can remain the existing AIK league; the event must be the approved live event.

Remaining before release: migrate runtime TEST-only guards using the approved
identities without weakening them; verify access/session/source isolation;
complete native TEST rehearsal and Nakka response qualification; record backup,
production readback and rollback evidence. Do not bulk replace TEST identifiers
or upload the TEST bundle into production. The profile is preparation for that
controlled migration, not evidence it has happened.
