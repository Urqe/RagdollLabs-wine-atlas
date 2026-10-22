# M2 — Focus and browser polish

Implemented 2026-10-22 following the supplied macOS Safari screenshot showing a blue outline around the complete two-line landing heading.

## Cause and correction

`WineNavigation.destination()` selects `#welcomeTitle` for the home route. `orient()` gives this non-interactive heading `tabIndex=-1` and focuses it for route orientation, including on startup. No author rule previously suppressed its browser-native focus outline. Desktop Chrome before the fix confirms `welcomeTitle` is focused with `tabIndex=-1` and a computed native `outline: auto 1px`. This supports the focus-ring diagnosis; the exact Safari rendering/settings have not been reproduced in this environment.

`home-brand.css` now removes the outline only from `#welcomeTitle:focus`. The heading still receives focus, retains its semantics and stays out of sequential Tab order. All interactive controls retain their existing focus-visible styling. Routing, history restoration, pointer/keyboard home-return behavior and other route headings are unchanged. This is deliberately narrower than suppressing focus outlines throughout the app or removing route orientation. All asset cache tokens advance to `20261022-maintenance-m2`.

## Verification

- Run the existing full `npm run validate` suite, including navigation/history/focus and home-return regression checks. No behavioral test is added for this CSS-only correction; a DOM test cannot verify Safari’s native painting.
- Deployed desktop Chrome check: pending at implementation commit. Check fresh load, refresh, pointer/keyboard home return, control focus, history and representative other headings.
- User-provided screenshot establishes the macOS Safari symptom. Actual before/after Safari rendering, Safari keyboard settings and physical iPhone/iPad testing remain unverified here.
- Real screen-reader use, mobile/enlarged-text checks and browser-native printing remain inherited open verification items; M2 does not mark those as complete.
