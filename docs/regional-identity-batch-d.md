# R5 batch D — Further regional identity

Implemented 2026-10-21. Five selected expressions bring coverage to **141 profiles, 112 region/style records, 59 grape/blend baselines and 22 countries**. Existing profiles, scores and routes are preserved. Completing batch D closes the four planned R5 batches; **R6 America Beyond California is next**, followed by R7 Canadian icewine.

| Selected expression | Canonical route | Scope and learning value |
| --- | --- | --- |
| Red Châteauneuf-du-Pape | `grenache / chateauneuf-du-pape` | Representative Grenache-led blend with Syrah/Mourvèdre in the cited Les Sinards example. Not pure Grenache, not a compulsory recipe containing all permitted grapes, and not white Châteauneuf-du-Pape. |
| Red Bandol | `mourvedre / bandol-red` | Representative Mourvèdre-led blend supported by Tempier and the Bandol body. Reuses the existing grape identity shared with Jumilla Monastrell. Large-cask maturation is distinguished from strong new-oak flavour. |
| Muscadet Sèvre et Maine sur lie | `melon-de-bourgogne / muscadet-sevre-maine` | Selected dry Melon white with fine-lees maturation. Muscadet is distinct from Muscat/Moscato, and the young reference does not stand in for every cru or long-matured example. |
| Salta / Calchaquí Torrontés | `torrontes-riojano / salta-torrontes` | Dry aromatic Riojano-style reference supported by Wines of Argentina and Colomé. The generic Torrontés name is not used to declare Riojano, Mendocino and Sanjuanino genetically interchangeable. |
| Dry Hunter Valley Sémillon | `semillon / hunter-semillon` | Young, early-picked, unoaked dry white, distinct from sweet Sauternes. One selective maturity entry explains possible bottle development without changing the young reference scores. |

Five region/style records do not mean five entirely new geographic wine areas: Salta overlaps existing Malbec coverage, Châteauneuf-du-Pape sits within the broader Southern Rhône area already represented, and each new record defines a more precise expression.

## Evidence and limits

Eleven reviewed primary references bring the source inventory to **66 reviewed / 58 background records pending claim-level metadata review**. All 141 profiles retain evidence limitations. Exact URLs, publishers, page/section locators, review dates and limits are exposed through the existing source drawer.

Blend display names and composition fields make the two red references explicit. Appellation and producer material support their selected methods; no producer recipe, cellaring range or service instruction becomes a universal regional rule. Tempier’s conservation range does not state a clear time origin, so the profile avoids copying its numbers. Broader claims about decades of cellaring are also not generalized.

Domaine du Colombier documents Melon B, lees maturation and a young-drinking reference. Its roughly three-year guidance is counted from harvest, not from purchase. InterLoire’s dry-Melon summary was available through publisher indexing while direct retrieval returned 403; the independently accessible producer page supports the selected expression. No invented vessel/maturity detail is added.

Colomé’s 2025 producer sheet is hosted by its importer, Folio. Its sugar analysis supports a dry example; fragrance does not imply sweetness. Wines of Argentina distinguishes the three Torrontés varieties. Colomé labels its grape only “Torrontés,” so the Riojano-style scope is curated regional context, not independent genetic verification of that bottle. The profile records that limit. No claim that the grape grows only in Argentina is repeated.

Wine Australia’s guide and Thomas Wines support the classic dry, early-picked Hunter style and its possible bottle evolution. Failed old Tyrrell’s links and inaccessible current pages are not used as profile evidence. The qualitative maturity entry illustrates citrus moving toward wax and toast in suitable bottles, with producer, vintage, closure and storage dependence. Toast/honey descriptors do not increase the oak or sweetness score, and no fixed multi-decade timetable is promised.

Practical pairing, service and aeration advice include modest editorial suggestions where sources are not specific. Soil and location fields stay limited to the supported setting; approximate locator dots are not appellation boundaries. Nearby herbs or rocks are not portrayed as flavour ingredients transferred into wine.

## Search, comparison and discovery

Exact appellation names resolve the selected expressions. White Châteauneuf-du-Pape, white/rosé Bandol, selected unrepresented Muscadet crus and other Torrontés varieties or sweet styles receive no-substitute notices. Muscadet and Melon queries do not turn into Muscat/Moscato matches. Generic Torrontés is labeled as the represented Riojano reference rather than a complete family catalog.

Monastrell/Mataró country coverage now honestly includes France and Spain under the same Mourvèdre identity. `Monastrell France` can find the actual Bandol blend; qualified Jumilla searches remain precise. This is a country-coverage change, not a new assertion about grape identity.

All five expressions use existing still-wine comparison semantics. Dry Hunter and sweet Sauternes share a grape but have incompatible Compare families; the same-grape learning route is explicitly a contrast and names the sweetness/production changes. The profile links directly to Sauternes for that distinction. The Hunter maturity section is optional enrichment, and other new profiles do not acquire boilerplate stages.

## Checks

`npm run validate` includes the existing suites plus `tests/regional-identity.mjs`: five profile routes and source/pairing/locator rendering; blend labels; appellation and unsupported-name precision; Muscadet/Muscat separation; honest Torrontés scope; expanded Monastrell country coverage; dry/sweet Sémillon discovery, related navigation and maturity; Explore/Compare search parity, comparison restoration and Gallery counts. Diff review verifies the old grape, region, source, locator and maturity entries are unchanged.

Deployed desktop Chrome checks cover the new profiles, search notices, comparison flows and Hunter bottle-evolution presentation. iPhone/iPad Safari and physical touch-device checks remain unverified.
