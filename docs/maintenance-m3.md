# M3 — R12 code maintenance

Implemented 2026-10-22. Scope: code paths shared by Explore, Compare, flights and the beginner journey. No wine profiles, evidence claims, tasting scores or lessons change.

## Findings and fixes

1. **Compare search could publish stale results.** Unlike Explore's renderer, Compare checked only whether the input text still matched the pending query. In an A → B → A sequence, the oldest A response could overwrite the newest A response. Leaving Compare also did not invalidate a pending search. A monotonically increasing request generation now rejects both results. The regression uses deliberately reordered promises and checks the rendered candidates and clearing on mode exit.
2. **Optional-route loading lacked a visible focus target and timely URL.** `WineNavigation.go()` returned from its loading branch before route writing and focus orientation. On a slow flight or lesson request, the URL stayed on the previous view and keyboard focus could remain inside content just hidden by the loading view. The loading heading is now focused and the destination URL written before awaiting optional data. The transition guard still prevents a late response from rerouting after the user leaves. Regressions cover a slow beginner lesson, navigating away before its completion, and a slow worksheet resolving to its final heading.
3. **Unused search alias removed.** `atlasPairingScore` only forwarded to `FoodDiscovery.score` and was referenced by tests, not by app behavior. Tests now exercise `FoodDiscovery.score` and `WineSearch.rank` directly, avoiding test-only global aliases. The legacy Explore search fallback is deliberately kept: it is covered by a missing-enhancement regression and provides graceful degradation when that optional script is absent.

## Verification and limits

`npm run validate` passes: JavaScript syntax, blocking data contracts, advisory content audit, DOM suites and Python validation contracts. The catalog remains 150 profiles across 23 countries. This audit is focused; it does not claim to prove the absence of all dead code or bugs. Browser checks should confirm the deployed URL and focus behavior. macOS/iOS Safari, physical touch, enlarged text, real screen-reader use and novice tasting outcomes remain unverified here.
