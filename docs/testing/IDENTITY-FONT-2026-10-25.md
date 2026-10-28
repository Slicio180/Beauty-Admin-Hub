# Identity popup AIK font correction

Screenshot 2026-10-25 at 13.05.48.png showed Arial fallback in the new identity popup. Hub stylesheet registers AIKDisplay-Light.woff2 as AIK Display at weight 400, while the popup requested AIK Display Light.

The shared popup body now uses AIK Display at weight 400 in the Hub. Remote/kiosk candidate pages explicitly select their already-declared AIK Display Light at weight 300 using CSS custom properties. Headings and player name use AIK Display at weight 700. Buttons use AIK Condensed at weight 700. No font asset or Cloudflare configuration changes were made.

All 175 behavioral regression tests and the 175-case inventory check pass in the assistant environment. These results do not establish font rendering. Mac visual retest is pending; no new test that merely mirrors CSS was added.

Only the shared identity popup stylesheet and its embedded copies in candidate pages changed. Original live Apps Script project snapshots and deployments remain unchanged.
