# Cast footer correction —31October2026
Owner screenshots15:00:29and15:01:07 show duplicated player footer space and pool
pagination in a separate row above the attribution footer; bottom cards clipped
in the available900px-high fullscreen. Earlier native layout acceptance not PASS.

Pagination moved into the common cast footer, one reserved32px row. TEST notice
shortened to Endast visning; planned-board wording removed from the player list.
Player view uses its own30px status/page/stats footer and hides the common footer
unless a fullscreen error must be shown. Page indicator truly centred between
equal side columns. Pool card header reduced52to48px and vertical cell padding
2to1px; fonts and name/average slots unchanged. Pool area retains explicit
internal overflow so a larger four-player page on a short screen can scroll;
footer is outside its scroll area. No absolute overlay footer. Knockout scroll,
pause controls and feed freshness remain wired in the common footer.

648tests/52files PASS;2new footer cases plus existing646. Generated StageTest and
BeautyLiveTest rebuilt byte-identical; Hub output rebuilt/verified. Installer
requires exact installed PoolCards atad64659; does not rerun that installer.
Backup and rollback, unknown edit guard, inventory and output hashes retained.
New Google preparer accepts last verifiedPoolCards19-file TEST baseline; no
production/Nakka/GitHub writes. Actual TEST readback and native re-review PENDING.
