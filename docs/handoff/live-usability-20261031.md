# Live usability and six-hour Hub session —31October2026
Owner installed LiveFill659testsPASS and verified19GoogleTESTfiles at
2026-10-31T20:27:27.960Z (21:27Stockholm), recovery/2026-10-28,ad64659.

Four-group desktop mode reserves two equal outer cardtracks from actual stage
height, regardless of three/four players or finaltwo-group partial page. Final
page leaves lower tracks empty instead of enlarging/reducing cards. Padding only
between neighbour3/4groups remains. Outer size may require readable-minimum
scroll on short screens; single-columnnarrow fallback retained. Sixgroups
unchanged. Pixel rounding can leave1px below. START/NU labels now bold uppercase
AIKCondensed at12/10px, numericvalueAIKDisplay24/20px, same intendedhalfratio
but stronger visiblelettering. No fabricatedNu: providerweightedaverage only.

Footer previous/next textbuttons replaced by accessible SVG arrows above feed
status/cards: leftcentredaboveleftcardcolumn,rightaboveright. Disabled endpoints
and auto paging retained. The page-owned top border isyellow1px. Chrome/Google
outerframe border cannot be recoloured from inside thisHTML. No browserchrome
or widened permissions change.

Authentication: exactTESTserverHubTestAuth.gs nowissues an opaque six-hour
absolute session after Firebase verifies freshIDtoken andapprovedUID. Its own
expiry is no longer truncated by the identityproof's one-hour expiry. Identity
proof itself is still validated at login and neverstored. Idlelimit sixhours,
absoluteexpiry neverextended. Server stores only opaqueHubsessionrecords in
ScriptProperties with cacheacceleration (600sec), fallsback aftercacheeviction,
and prunes expired/revokedrecords onlogin. Logout removesrecordand bumpsaccount
epoch, so siblingsrevoked; approvalcheckedonrequire, write-lockrechecksretained.
Client credentialsremainmemoryonly, existingpagehide/historyguards clear them;
reload/close requireslogin, no refresh token/cookie/storage added. Lostclient
sessionrecord mayremainserveruntilabsoluteexpiry/prune; reload does not silently
restoreit. Inflight oldcallbacks remain generationguarded. No real six-hour
native acceptanceclaim: clockcontrolled tests coverlimits,cacheeviction,revoke,
close/reload. Oldsessions keepoldissuedexpiry; signout/reopen/signin afterupdate.

Planner: hidden redundantBOARDStextinput retained asinternalstate. Numberedboard
buttons stillselectavailableboards. Scheme shows onlynonzero sizechips (black,
yellowcounts/size/outline), e.g62players preferred3 =>18×3players and2×4players;
preferred4 =>14×4 then2×3. Nozero-counttiles/boardcountinScheme. RealINcount and
verifiedplanningalgorithm unchanged. AdvancedbuttonEDITDISPLAYBOARDS explicitly
states display-only effect. Rowsidentify currentpool+board/group/playercount,
dropdown choosesnewboard, sharedgroup automaticallypickedandpreviewed. SAVE
DISPLAYBOARDS uses sameguardedlabelendpoint/frozenmembership; noNakka assignment
write or resend. Unknownplan/session remainsblocked.

664offline tests/52files and inventoryPASS. Newpackage adds HubTestAuth.js as
seventh Googleoverlay; exactpreviousauthhash checked, preserves12otherfiles,
readsbackall19. All changesTESTonly, noGitcommit/push, production, Nakka writes.
Installerbackups,evidence,local+mockGoogleflow/refusals shipped; actualnewGoogle
readback andnativecard/menu/font/sessionreview pending.
