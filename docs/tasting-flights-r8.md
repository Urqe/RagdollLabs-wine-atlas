# R8 — Taste the Difference

Implemented 2026-10-21. The release adds six curated flights using the existing 150 profiles, with no new regions, scores, source-review claims, backend or personal data storage.

## What ships

- Sauvignon Blanc: Sancerre and Marlborough.
- Cabernet: Cabernet-led Bordeaux and Napa.
- Fresh versus dried grapes: Valpolicella Classico and Amarone.
- Shared grape identity: dry Primitivo di Manduria and Lodi Zinfandel.
- Sparkling production: Prosecco and Champagne Brut NV.
- Routes to sweetness: Niagara Riesling Icewine, Sauternes and Tokaji Aszú.

Each flight has a question, selection cues, suggested tasting order, serving setup, three observation prompts and explicit limitations. Bottle shopping is optional: the lesson and comparison work without purchasing or drinking wine. Setup/order are editorial suggestions rather than measured rankings or universal serving rules.

The landing page, sidebar and existing beginner guide link to the same flight catalog. Participating profiles also expose relevant flights. A lesson can open its full two/three-wine selection in one comparison transaction, or open an individual profile with a return link. Flights never force numerical differences or equate broad Compare compatibility with substitutability.

The worksheet offers blank bottle/producer, vintage/date, aroma, structure, finish and reflection fields for handwriting. Expected aromas and scores stay off it. Print CSS uses black text and writing lines on white, hides navigation and avoids dark backgrounds. It is not a saved tasting notebook.

## Architecture and contracts

- `data/tasting-flights.json` references canonical grape/region pairs. `tasting-flights.js` renders safe text nodes and checks complete profile availability, uniqueness and existing `WineModel.compatible()` semantics before offering a flight.
- `WineComparison` remains the single comparison owner. Route-driven replacement/restoration is atomic and clears stale slots. Changing a flight's wines ends its guided context; changing only the display preference preserves it and its focused nodes.
- `WineNavigation` owns lesson, worksheet, profile and comparison history. The flight identifier survives only where its context applies. See [navigation](navigation.md) for the route contract.
- Optional flight loading starts alongside startup and does not delay wine browsing. Loading routes cancel on subsequent navigation, not on a keyboard-focus change. A bounded failure offers a visible fallback and reload guidance; malformed, duplicate or incompatible references never become partial lessons.
- The data validator checks lesson fields, stable unique IDs, 2–3 distinct valid profile references, 2–3 prompts and broad comparison compatibility. Runtime guards handle stale deployments gracefully as well.
- All visible script/style cache tokens advance together to `20261021-tasting-r8`.

## Evidence boundaries

These lessons synthesize existing selected expressions and their evidence contracts; they do not certify every regional claim anew. Existing source links and evidence gaps remain on each profile under Learn more → Sources & methodology. In particular, the Sancerre/Marlborough, Napa/Lodi, Champagne/Prosecco and Sauternes/Aszú legacy claim-review backlog remains open. Reviewed evidence for grape identity, Bordeaux blending, appassimento and Ontario icewine remains scoped as before.

Flights explain confounding variables instead of presenting producer/vintage/grape/blend differences as controlled climate or production experiments. No universal sweetness, oak, ageing or quality conclusion follows solely from a place name.

## Verification

- `npm run validate`: syntax, blocking data contracts, advisory content audit and all existing regression suites plus the new flight suite.
- New regression checks cover all six atomic selections, stale-slot removal, context matching, share/refresh, Back/Forward, catalog-card focus, profile returns, worksheet rendering and print action, invalid IDs, unavailable/malformed/incompatible data, safe text rendering, nonblocking loading and late-response cancellation.
- Validator fixtures reject duplicate IDs/wines, unknown profiles, incompatible families, missing prompts and missing limitations.
- The three-wine worksheet was exported from the rendered DOM, laid out with its actual print styles using WeasyPrint, and visually inspected as a single A4 page with no clipping. This is a secondary print renderer, not a claim of Safari or Chrome print-preview verification.
- Local server inspection through the available preview browser was blocked by its network boundary. Deployed desktop Chrome verification is pending at this commit.
- iPhone/iPad Safari, physical touch behavior, real screen-reader interaction and browser-native print dialogs remain unverified. Existing release-plan device obligations are not marked complete by DOM tests.

R9's short beginner journey and R10's expanded bottle-label guidance remain separate planned releases. This release supplies flight-specific buying cues only.
