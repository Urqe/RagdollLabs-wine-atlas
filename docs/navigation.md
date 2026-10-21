# Navigation and history (R2)

`navigation.js` owns view URLs and browser history. Existing modules still own profile computation, comparison validation and rendering. Its rendering guard lets those APIs be used without starting another navigation.

| View | URL parameters |
| --- | --- |
| Welcome | No atlas parameters |
| Profile | `?grape=cabernet-sauvignon&region=napa` (existing links retained) |
| Gallery | `?view=gallery` |
| Compare | `?view=compare&compare=macabeo%3A%3Acava%2C%2Cglera%3A%3Aprosecco-doc&biggest=1` |
| Explore chooser | `?view=explore`, optionally `&action=place` or `&action=search` |

Comparison keys are comma-separated `grape::region` pairs. Empty middle slots are retained; trailing empty slots are omitted. `biggest=1` restores the concise-differences checkbox. At most three keys are accepted. The existing comparison model rejects unknown, malformed, duplicate and incompatible entries, promoting valid later entries if the anchor is invalid. Initial routes are canonicalized in place. Compare/Gallery take precedence over stale profile parameters; unrelated URL parameters are preserved. Invalid profile links show the existing recovery message and remove invalid profile parameters.

Profile, Gallery, Compare and home transitions close the glossary and orient focus to the profile heading, gallery heading, comparison search field or welcome heading. Pointer home navigation focuses the welcome home link. New profile headings scroll into view, including when selected near the bottom of Gallery. Empty Explore routes focus the relevant chooser. Remove and Add operations keep keyboard focus on a useful surviving control.

History entries store window/sidebar scroll, focused control (or gallery card identity) and open details. Back/Forward restore the URL view first and then its saved position/focus. Lazy panel loading may reapply restoration only while the navigation is still current; subsequent focus changes cancel the pending restoration. Initial links without a saved position use the view's normal focus destination. Comparison edits create history entries without leaving Compare; opening a shared comparison never seeds it with a prior Explore profile.

Live status is updated synchronously for the visible selection/view so delayed messages cannot overwrite newer selections. Colour labels cover every allowed value, including `white-gold` as “White / gold”. Definition-list rows each own their label/value grid, with a flexible wrapping value column at narrow widths.

Validation: `npm run validate` includes `tests/navigation.mjs` for Gallery/profile Back/Forward, focus/scroll targets, comparison sharing and sparse slots, invalid keys, Remove focus, legacy links, recovery and colour labels. Existing loading-failure and late-guidance tests also pass. Desktop Chrome is used for deployed navigation and responsive layout checks. iPhone/iPad Safari and physical touch-device behavior are not verified in this environment.


## Guided tasting routes (R8)

- `?view=flights` opens the catalog; `?view=flight&flight=<id>` opens a lesson.
- `?view=worksheet&flight=<id>` opens its printable worksheet. It contains blank writing space, not saved personal notes or expected tasting answers.
- `?view=compare&flight=<id>` seeds the complete canonical flight once. Generated comparison URLs also contain the ordinary `compare` keys and `biggest` preference. If explicit selections differ from the flight, the selection is respected and the flight context is dropped.
- Profile links from a flight retain `flight=<id>` only when that profile belongs to the flight, and show an explicit return link. Existing profile URLs remain valid.
- Refresh and Back/Forward restore flight views through the same router and history-position policy as other views. Links support native open-in-new-tab behavior. Manual wine edits remove a mismatched flight label; toggling the biggest-differences preference preserves it.
- Unknown or unusable lesson/worksheet routes show a visible unavailable state with browse/explore links. An unavailable comparison flight falls back to ordinary Compare without a partial lesson. Missing optional flight data does not block wine browsing. Pending loading is canceled only by a newer route, not keyboard focus changes.
