# R7 — Canada: Frozen on the Vine

Implemented 2026-10-21. The Niagara first batch adds three still sweet expressions, Canada and a Vidal Blanc baseline: **150 profiles, 118 region/style records, 60 grape/blend baselines and 23 countries**. Existing grape/profile records and scores are preserved. Later US candidates, Okanagan icewine and German/Austrian Eiswein remain open; no additional release is implied complete.

| Expression | Canonical route | Selected reference |
| --- | --- | --- |
| Vidal Blanc Icewine | `vidal-blanc / niagara-icewine` | Inniskillin Pearl 2023, 100% Vidal Blanc; tropical/stone fruit and acidity. The producer does not specify an oak regime, so none is invented. |
| Riesling Icewine | `riesling / niagara-icewine` | Inniskillin 2022, 100% Riesling; citrus/melon and vivid acidity. Distinct from the dry and off-dry references already represented. |
| Cabernet Franc Icewine | `cabernet-franc / niagara-icewine` | Inniskillin 2022, 100% Cabernet Franc; red colour from pressing, without skin contact during fermentation; cool fermentation and stainless-steel holding. |

The expression-specific region key avoids using the single grape/region slot for both dry Niagara wine and icewine. One new region/style record represents three profiles, not three separate geographic areas. Canada is the country value; Ontario remains visible regional context. Approximate locator coordinates do not represent legal boundaries.

## Evidence and factual scope

Eight new reviewed primary references bring the inventory to **86 reviewed / 58 background records awaiting claim-level review**. Every profile retains explicit evidence limitations. Exact URLs, publishers, locators, review dates and limits appear in `data/sources.json` and profile source drawers.

UC Davis Foundation Plant Services identifies Vidal Blanc as a white interspecific hybrid of French origin, from Ugni blanc × Seibel 4986 (Rayon d’Or), with Vidal 256 as a synonym. It is not presented as indigenous Canadian vinifera. The baseline is an editorial reference; the regional modifiers describe the selected sweet icewine rather than declaring all Vidal wine sweet.

CFIA’s current Canadian Standards of Identity, Volume 8 defines natural freezing on the vine and provincial determination for production in Canada. The old standalone federal Icewine Regulations, SOR/2014-10, were repealed in 2019 and are not cited as current law. Ontario authority and Wine Country Ontario material support the Ontario-specific harvest/pressing context at or below −8°C and average juice of at least 35° Brix. Brix is a juice measurement, not finished residual sugar, ABV or an atlas score. Ontario thresholds are not assumed to apply unchanged in BC.

Frozen grapes are pressed while frozen: much of the water remains as ice, concentrating the extracted juice. Fermentation retains substantial natural sugar. Natural freezing is distinct from mechanical freezing, ordinary late harvest, noble rot and fortification. Botrytis is not described as a required icewine process, nor is spirit addition. Lake and escarpment influences explain growing conditions without promising a successful winter harvest every year.

The three Inniskillin producer references are hosted by its importer, Maisons Marques & Domaines. Their selected technical sections document Niagara origin, varietal composition and sweet wines at 9.5% ABV. Rounded alcohol scores therefore use the shared 1.5 anchor; acidity and sweetness remain editorial sensory judgments. The Cabernet Franc page includes a third-party review passage also shown on the Riesling page; that passage, critic ratings and review drinking windows are excluded from the evidence. Vineyard-by-vineyard soil, missing oak regimes and universal cellaring durations are not inferred.

Service temperatures, small pours and some pairings are modest editorial starting points. Producer dessert examples and cheese context support the learning routes. Further bottle development depends on grape, producer, vintage, closure and cool stable storage; no maturity stages or decades-long improvement guarantee are added.

## Search and learning integration

Icewine / ice wine / ice-wine / vin de glace use the new `natural-freeze` production class. Canada, Canadian, Ontario, Niagara and Vidal names find the represented profiles in both Explore and Compare. Dry, fortified and noble-rot queries do not substitute them. Unrepresented sparkling icewine, BC/Okanagan and Eiswein get explicit notices.

Broad Compare permits sweet-family contrasts across production methods and colours. Close-style discovery requires matching production context and colour, preventing a numeric match from substituting noble-rot wine for icewine. Cabernet Franc is red in profile, Compare, search and Gallery; it does not inherit the dry still-red compatibility of its grape. Related links explicitly contrast dry Riesling and dry Cabernet Franc.

A contextual Icewine glossary entry and taste-guide section explain concentration, retained sugar, acidity, Ontario-specific thresholds, red appearance and pairing/ageing context. Three guide examples navigate directly to the profiles. Existing UI mechanisms handle Canada, source rendering, locator and Gallery without a separate country-specific flow.

## Validation

`npm run validate` checks syntax/data/content and all regression suites. New `tests/canadian-icewine.mjs` checks country/grape/profile counts; exact names and unavailable styles; route/focus, metrics, sources, pairing and locator rendering; red appearance and low tannin; dry/sweet compatibility; production-class exclusion even with identical scores; Explore/Compare parity; three-way comparison and URL restoration; inline glossary and Canada Gallery navigation. Existing data-record preservation is checked in diff review.

Deployed desktop Chrome smoke checks cover searches, profile/learning presentation, Compare and Gallery. iPhone/iPad Safari and physical touch checks remain unverified.
