# AUD-083 — Identity TEST Nakka health
Enable signed-in Hub RPC health action using existing getNakkaHealth_ implementation. Credentials remain in Google Script Properties. Exact TEST project and sheet guard applies before session check and before outbound contact; health action accepts no input. Existing fixed league GET, bounded safe response, 60-second cache and non-waiting lock retained. No league, tournament, registration or player writes enabled. Existing public legacy health route unchanged.

298 automated cases pass, inventory passes. Changed bridge test checks actual client/server routing, rejects unexpected input and wrong project before contact. Auth suite checks missing session blocks health alongside all other Hub actions. Native Nakka connectivity in this Identity TEST project remains PENDING. Owner confirmed both credential property names exist; values not requested.

Browser Back check after logout was confirmed PASS by owner after AUD-082, recorded here as supplemental acceptance. Native idle timeout and completed password reset remain pending. No production or JDC changes.
