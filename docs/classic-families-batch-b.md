# R5 batch B — Missing classic families

Implemented 2026-10-21. Five selected profiles add five region/style records and three grape baselines. The catalog now has **131 profiles, 102 region/style entries, 53 grape/blend baselines and 22 countries**. The three Jerez entries share a reference point and represent different styles, not three geographic appellations. Existing routes and scores are preserved.

| Selected expression | Canonical route | Scope and evidence |
| --- | --- | --- |
| Dry Fino Sherry | `palomino / jerez-fino` | Complete fermentation, fortification and biological ageing under flor; pale, dry and savoury. Consejo Regulador production/service guidance supports the reference. Drink for freshness rather than promising bottle improvement. |
| Dry Oloroso Sherry | `palomino / jerez-oloroso` | Complete fermentation followed by fortification and oxidative cask ageing without flor. Amber colour and full texture do not imply sweetness. Not a Cream reference. |
| Sweet Pedro Ximénez Sherry | `pedro-ximenez / jerez-px` | Sun-dried grapes, interrupted fermentation and oxidative maturation. This models the Sherry expression, not every wine made from the grape or a guarantee of vineyard origin. |
| Medium-sweet Boal Madeira | `boal / madeira-boal` | Boal (Bual) with a selected warm oxidative canteiro maturation context. IVBAM explains method, grape/style and service; H&H Boal 10 anos supports a practical rich, fresh example. No exact producer heating schedule or 100% varietal composition is inferred. |
| Dry still Alvarinho, Vinho Verde DOC | `albarino / vinho-verde-alvarinho` | Monção e Melgaço, steel fermentation and fine lees, based on Soalheiro Clássico 2025. Uses the existing Albariño identity and verified Alvarinho alias. This is not a model of all Vinho Verde colours, sweetness levels or bubbles. |

## Semantics and presentation

Fortified comparison compatibility remains deliberately broad for learning. Dry Fino, dry amber Oloroso, sweet brown PX, Madeira and the existing Port/Muscat profiles can be compared together. Compare now explicitly explains that dry and sweet fortified wines are contrasts; its existing production context displays sweetness, actual wine colour and production differences relative to slot 1. Existing shared fortified comparisons remain valid.

Discovery is stricter. New production classes distinguish biological flor ageing, raisined-grape fortified wine and warm oxidative Madeira maturation. Fino/Oloroso are explicitly contrasting same-grape routes. Sweetness, colour and production prevent them from becoming close substitutes for sweet Port or Muscat. Even sweet Boal and Tawny retain different production classes. PX has a readable **Brown / mahogany** colour label; it is not classified as red wine because of its appearance or white wine because of its grape skin.

The atlas's coarse sweetness categories group medium-sweet Boal under `sweet`, with that limitation stated in the expectation and evidence gaps. Its label and editorial score distinguish it from very sweet PX. This does not treat Madeira's traditional dry/sweet designations as interchangeable with still-wine sugar categories.

Regional display names reach Explore, Gallery, search, Compare and discovery using the existing shared name mechanism. `Alvarinho Portugal` now finds a represented Portuguese expression, while Spain and Uruguay remain available under the same grape identity. Approximate locator dots identify reference places, not legal boundaries.

## Search coverage

Sherry/Jerez searches return the three represented Sherry expressions. Dry Sherry returns Fino/Oloroso; sweet Sherry returns PX. Madeira resolves the selected Boal; Vinho Verde resolves the selected dry still Alvarinho. Longer unsupported-style queries have explicit no-substitute notices for Manzanilla, Amontillado, Palo Cortado, Cream/sweetened Oloroso, other selected Madeira names and Loureiro/red/rosé/sparkling Vinho Verde. These notices describe catalog limits, not whether the wines exist. Qualified queries use the same structured semantics in Explore and Compare.

Flor, solera and canteiro receive sourced glossary entries. A beginner-guide section explains why fortification need not retain sweetness and links the contrasting expressions. Optional vessel/maturity sections remain selective; no unsupported numeric cellaring promises are added.

## Evidence and limits

Twelve additional reviewed primary references bring source status to **43 reviewed / 58 background records pending claim-level review**. Access/review dates, precise locators and limitations are stored in the source records and exposed in the source drawer. All 131 profiles retain evidence gaps.

The H&H product page and its linked multilingual technical sheet report different sugar analyses (90.4 versus 97 g/L). The atlas does not display a universal chemical analysis. IVBAM's detailed canteiro section specifies casks despite a mistranslated introductory English phrase about bottles; the detailed method is used. Its broad numerical sweetness wording on the service page is not used as a sugar range. Initial Blandy's retrieval and an old Soalheiro PDF failed; those unavailable pages are not used as references. The current linked Soalheiro 2025 sheet was retrieved directly.

Service and pairing advice combine primary examples with modest editorial guidance. Exact opening life, decanting needs and storage depend on the bottle and producer. Cask/age indications do not become extra waiting periods after purchase. No literal transfer of soil flavour or unsupported fixed blend is asserted.

## Validation

`npm run validate` covers all existing suites plus `classic-families.mjs`: five deep links; sources, gaps, locators and pairings; exact/unsupported search and Explore/Compare parity; display names; related navigation and flor glossary; all fortified contrasts; new colour/production semantics; preserved Port comparisons and restored shared URLs. Validator fixtures reject unknown colours, wrong-family production and inconsistent bubbles. The Aromatic mood regression now inspects the active canonical grape rather than parsing a display name, so regional names do not create a false test failure.

Desktop Chrome deployment checks cover the new profiles, search notices, related navigation and comparison context. iPhone/iPad Safari and physical touch-device checks remain unverified.
