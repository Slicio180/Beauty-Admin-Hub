# Mobile and kiosk approved design implementation — 2026-11-02

Scope: TEST RemoteRegistration.html and KioskTest.html only. Existing provider calls, identity resolution, registration data, consent values, source stamping, journals and server files unchanged.

Approved mockups: mobile Library libfile_04a09271c4bc8191a3846f29e1b66824; portrait kiosk libfile_2202e79c45788191aad26cee30ce0379; open kiosk picker libfile_5fb562ee21308191a829e641c18b4ed0. Original embedded AIK assets retained; generated illustrative branding is not used in code.

Implemented: white form, larger remote text; solid yellow/black new-player action and Swedish help on both form and pinned picker header; top-aligned modal with keyboard opening only on editable focus; visual viewport resize handling; separate name scroll; selection automatically closes and blurs search; scroll and focus restoration; background inert and scroll locked; Escape/backdrop/X exits name picker; keyboard Tab trapped. New-player selection retains the existing full-name entry flow and requests keyboard focus because typing is required. Done dismisses search keyboard without submitting registration.

Remote Tonight's Players: tall popup, number-only yellow tile inside common outlined heading, numbered read-only name rows, no arrows/X, fixed bottom STÄNG button. No attendee list added to kiosk.

Verification: focused Node behavioural tests exercise focus, selection, close, inert/scroll restoration, viewport resize, new-player action and safe dismissal. Theme build deterministic and inline scripts parse. Full reconstructed baseline comparison initially 666 tests / 601 pass / 65 fail, after change 674 tests / 609 pass / same 65 failures. See saved logs and machine-readable comparison. Full inventory cannot pass while those baseline tests fail. Inventory entries updated for new and changed UI contracts; no unrelated test expectations weakened.

LIMITATION: no browser engine available in this environment; attempted Playwright download returned invalid archive. Native iPhone Safari keyboard and Lenovo Chrome touch, scroll, orientation and usable name counts still require device acceptance. Five/six names with keyboard and eight/ten attendees depend on usable viewport/font metrics. This is code-test evidence, not a device/browser PASS.

No production changes, Google upload, Nakka calls, commits, pushes or deployments.
