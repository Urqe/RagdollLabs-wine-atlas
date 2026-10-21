# R5 batch C — Broader everyday coverage

Implemented 2026-10-21. Five profiles add five region/style records and four grape baselines. Coverage is now **136 profiles, 107 region/style records, 57 grape/blend baselines and 22 countries**. Existing profile records, scores and canonical routes are unchanged.

| Selected expression | Canonical route | Scope |
| --- | --- | --- |
| Montepulciano d’Abruzzo DOC | `montepulciano / montepulciano-abruzzo` | Dry, fruit-led red with steel fermentation/maturation, supported by Masciarelli Linea Classica. Not a universal oak recipe or a Riserva reference. |
| Sicilia DOC Nero d’Avola, Menfi | `nero-davola / sicilia-nero-davola` | Dry, steel-matured red supported by Planeta La Segreta Nero d’Avola 2024; the Menfi/Dispensa setting is deliberately narrower than all Sicily. |
| Jumilla DOP Monastrell | `mourvedre / jumilla` | Young dry fruit-led expression following Luzón Colección Monastrell. Monastrell/Mourvèdre/Mataró use one grape identity; only the represented Spanish region is promised. |
| Bierzo DO Mencía | `mencia / bierzo` | Young dry steel-fermented reference supported by Luna Beberide 2024. No one soil, altitude or extraction recipe is assigned to all Bierzo. |
| Young white Rioja Viura | `macabeo / rioja-blanco` | Dry, fresh steel-fermented white following CVNE Monopole 2025. Uses existing Macabeo/Viura identity and keeps a separate region/style record from red Rioja. Not Monopole Clásico or an aged white Rioja reference. |

## Names, search and coverage

Monastrell and Mataró are evidence-backed aliases for the new stable `mourvedre` identity. The Jumilla profile displays **Monastrell (Mourvèdre)**; search notices show actual country coverage. This also leaves a single identity ready for a later Bandol expression without claiming France is already represented. No indigenous/rarity badge is invented for these new baselines.

White Rioja displays **Viura (Macabeo)** while keeping the existing `macabeo` route shared with Cava. `Viura` can find both; `dry Viura` can also find the existing dry Cava, whereas `white Rioja` and `Rioja blanco` select the still white reference. `sparkling Viura` remains Cava. A new exact Rioja rule excludes Ribera del Duero, whose prose comparison previously made it an incidental result. Generic Rioja now finds its represented red and white profiles; qualifiers remain shared between Explore and Compare.

Montepulciano the grape is distinguished from the Tuscan town/appellations: Vino Nobile and Rosso di Montepulciano have explicit unavailable notices rather than being replaced with Abruzzo’s grape. Cerasuolo d’Abruzzo, Cerasuolo di Vittoria, the unrepresented Abruzzo Riserva, sweet Jumilla and selected aged-white-Rioja queries likewise explain the relevant catalog gap. Broad Sicily/Abruzzo searches resolve the represented expressions, with labels stating that scope.

## Evidence and practical guidance

Twelve reviewed primary references bring the source inventory to **55 reviewed / 58 background records pending claim-level review**. All 136 profiles retain explicit evidence gaps. The app exposes URLs, publishers, section/page locators, review dates and limitations. Scores remain approximate editorial style judgments; existing scores were not adjusted to manufacture differences.

Important limits recorded during research:

- Jumilla crosses northern Murcia and southeastern Albacete in Castilla-La Mancha. Country stays Spain; the setting explains both areas.
- Luna Beberide’s PDF filename contains 2025, but the actual sheet describes 2024. Its own altitude ranges differ, so the profile does not present one exact range. Sensory wording about a slightly sweet finish does not establish a chemical sugar category. The modeled dry reference and scores are explicitly editorial.
- Planeta’s current 2024 technical sheet documents steel maturation. Cocoa and coffee-like notes are not treated as evidence of oak. Its limited further-ageing suggestion does not become a universal promise for Nero d’Avola.
- CVNE’s young Monopole is kept distinct from Monopole Clásico. Brief pre-press contact does not make the selected white an orange wine. Rioja’s own body confirms both young and wood-aged Viura styles exist.
- Service, food pairings and gentle aeration include practical editorial suggestions. Where no precise drinking window is supplied, the app does not invent one. Locator dots are approximate reference points, not legal appellation boundaries.

Optional vessel/maturity sections and the glossary are not padded: these profiles are understandable with existing explanations and their sourced production fields. White Rioja has its own identity/Why text, so the red record’s barrel-ageing claims do not appear on it.

## Comparison, discovery and checks

All five profiles use existing still-wine semantics. The four reds support educational still-red comparisons; white Rioja compares with still whites. Cava and white Rioja share a grape identity but differ in family and production: discovery labels that route as a contrast, and Compare does not combine them under still-white compatibility. Existing sparkling and fortified rules remain intact.

`npm run validate` includes the full existing suite plus `tests/everyday-coverage.mjs`: all five routes, source/gap/locator/pairing rendering, exact/absent searches, alias/country honesty, Explore/Compare parity, display names, Cava-versus-still semantics, Compare restoration and Gallery coverage. Tests also guard the incidental-Ribera search regression. Diff review confirms all original profile data is unchanged.

Deployed desktop Chrome checks cover new profiles, search notices, Compare and Gallery. iPhone/iPad Safari and physical touch-device checks remain unverified.
