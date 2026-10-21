# R6 — America Beyond California

Implemented 2026-10-21. The first batch adds six profiles across five AVAs: **147 profiles, 117 region/style records, 59 grape/blend baselines and 22 countries**. USA now has 13 profiles. Existing California and Willamette entries remain unchanged. Later R6 candidates remain open; **R7 Canadian icewine is next**.

| Expression | Canonical route | Selected reference and scope |
| --- | --- | --- |
| Red Mountain Cabernet Sauvignon-led blend | `cabernet-sauvignon / red-mountain` | Hedges 2023, 85% Cabernet Sauvignon with other red grapes. Warm Washington AVA; the selected estate example does not define a compulsory blend or universal ageing potential. |
| Walla Walla Valley Syrah | `syrah / walla-walla` | L’Ecole 2023 Seven Hills estate, 100% Syrah. The AVA spans Washington and Oregon; diverse soils and sites are not reduced to the Oregon-only Rocks District. |
| Dry Finger Lakes Riesling | `riesling / finger-lakes-dry` | Dr. Konstantin Frank 2024, Keuka/Seneca estate sites, stainless steel, no malolactic fermentation. Explicitly dry, not a stand-in for every regional Riesling sweetness. |
| Monticello Cabernet Franc-led blend | `cabernet-franc / monticello` | King Family 2024, 95% Cabernet Franc / 3% Malbec / 2% Merlot. Concrete and French puncheons; selected vineyard origin is Monticello, not inferred from a winery address. |
| Monticello Viognier-led blend | `viognier / monticello` | King Family 2023, 84% Viognier / 16% Chardonnay. Mixed steel, used French oak, acacia and concrete; partial malolactic fermentation. |
| Dry Old Mission Peninsula Riesling | `riesling / old-mission-dry` | Chateau Grand Traverse explicitly dry example, stainless steel and lees maturation. Michigan peninsula setting does not imply all regional wines are dry. |

## Evidence and limitations

Twelve reviewed primary references bring the inventory to **78 reviewed / 58 background**. Exact links, dates, claim groups and limitations are in `data/sources.json` and each profile's source drawer. All 147 profiles retain explicit evidence gaps.

The TTB register and current boundary descriptions establish canonical AVA scope: [Red Mountain §9.167](https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-9/subpart-C/section-9.167), [Walla Walla §9.91](https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-9/subpart-C/section-9.91), [Finger Lakes §9.34](https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-9/subpart-C/section-9.34), [Monticello §9.48](https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-9/subpart-C/section-9.48) and [Old Mission Peninsula §9.114](https://www.ecfr.gov/current/title-27/chapter-I/subchapter-A/part-9/subpart-C/section-9.114). Approximate locator dots are not legal boundary polygons. Virginia Wine's Central Virginia tourism region is broader than Monticello; it is not used to redefine the AVA.

Regional bodies support geography and grape relevance; producer sheets support the selected wines' fruit origin, composition and methods. Neither a winery address nor a famous subregion supplies missing vineyard provenance. Walla Walla state searches describe the cross-state AVA, not a claim that every bottle uses grapes from both states.

King Family's trade link labels Viognier 2024, but the actual downloaded sheet is 2023. The app cites the sheet's vintage and records the mismatch. That sheet lacks residual-sugar analysis; dry is the selected editorial style, with the analytical gap exposed. Dr. Frank explicitly names a dry style without a numerical residual-sugar analysis in the selected sheet. Chateau Grand Traverse's page says vintage 2024 while listing an October 2023 harvest, and its sugar figure has no unit; the app uses the clear dry-style description and does not invent a vintage or convert the number.

Producer-specific long-cellaring claims are not generalized. Service, aeration and pairings remain modest editorial suggestions where direct evidence is incomplete. Soils provide growing context without claiming literal rock flavours transfer into wine. No new maturity timelines are invented.

## Search, comparison and discovery

AVA and state searches use structured region constraints, including both states for Walla Walla. Oregon still finds existing Willamette Pinot Noir, California retains all six previous profiles, and USA remains the country value. Monticello returns both represented grapes; per-grape Why explanations keep red extraction out of the Viognier profile. Blend display labels and composition are visible in Explore and Compare.

The two new Rieslings are dry and unoaked. Their rounded metric scores are identical because the evidence does not justify manufactured half-point contrasts. Compare explicitly explains when no metric difference reaches its display threshold. Their regional copy still explains lake/peninsula context and selected cellar choices. The off-dry Mosel reference is a broad Compare contrast, not a close dry-style substitute.

Sweet, semi-dry and icewine searches do not substitute the dry profiles. The Rocks District is not separately represented and gets an explicit unavailable-expression notice. Existing still-red and still-white compatibility and stricter discovery semantics are reused.

## Validation

`npm run validate` runs syntax/data checks, the advisory content audit and all regression suites, including `tests/america-regions.mjs`. New coverage checks all six routes, source/pairing/locator rendering, exact AVA and state queries, unavailable styles, blend display, scoped Monticello text, dry Riesling comparison, Explore/Compare parity, URL restoration and Gallery totals. Diff review checks preservation of existing data records and scores.

Deployed desktop Chrome smoke checks cover search, profile presentation, comparison and Gallery. iPhone/iPad Safari and physical touch checks remain unverified.
