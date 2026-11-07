# League identity list correction — 5 November 2026

The real public league entry endpoint returns all 105 records, including when count=100 and skip=100 are sent. The previous mock paginated this endpoint, masking a production-response incompatibility: >100 records caused statistics refresh to fail before reading averages. Official endpoint documentation describes the full entry list, not paginated league/tournament search.

The corrected fixed-target read omits pagination parameters, validates all identities once and retains duplicate-ID, malformed-name and supported-size rejection. No source data or statistics calculations are changed. Existing fixture now models the provider response. Two new cases cover a complete 105-entry refresh and invalid/oversize identities.

Google TEST and actual statistics refresh acceptance remain pending. No production changes or external writes.
