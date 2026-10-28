# Event Hub branding size refinement — 2026-10-25

Source checkpoint 64976db. User reviewed full dashboard screenshot 22.17.49 and requested larger top AIK logo/EVENT HUB and slightly larger Måndagsdartarna artwork centred between date and Event Control.

CSS-only visual refinement plus generated HubTest.html. Top branding scales up toward previous 85px title at wide desktop widths; 58px at the supplied approximately 853px working width. Header minimum height returns to 220px. Player tile and sidebar grey system indicator remain. Event row uses date/content/button grid, centres the logo in the remaining space, and compensates original image transparent padding vertically. At narrow widths the logo wraps below the controls. Original assets and server sources unchanged.

227-case local regression and inventory checks; no extra implementation-mirroring unit tests added for CSS. Actual layout/rendering review pending in Mac browser. After installer success upload HubTest.html only, save and reload full dashboard. No date saving, deployment or production write.
