# Mobile readability correction v2 — 2026-11-02

User screenshots show desktop scaling and black new-player action. Corrected HtmlService viewport for remote and kiosk only; unchanged route guards, RPCs and provider logic. Original body button[class] specificity overrode the intended yellow fill; corrected button selector and explicit yellow/black colors. Remote controls taller with larger text; picker names centred and larger. Tonight popup height now content-driven up to screen limit with internal scrolling.

Google documents that HTML viewport meta is ignored and addMetaTag is required: https://developers.google.com/apps-script/reference/html/html-output#addMetaTag(String,String)

Offline tests and full-regression comparison included. Three existing route test fakes now support HtmlOutput.addMetaTag; assertions preserved. No native browser/keyboard PASS claimed; physical iPhone/Lenovo acceptance pending. No provider calls, Google upload or production changes.
