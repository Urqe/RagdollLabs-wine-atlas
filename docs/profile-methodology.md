# Modeled expressions, evidence and drinking advice (R3)

A profile is an editorial reference expression, not an average of everything a region makes and not a guarantee about a bottle. All represented profiles declare their family, colour, selected sweetness, production scope and composition status in `regions.json`. The visible expression line and the expandable style section expose those choices. Existing grape and region IDs are unchanged.

## Initial corrections

| Existing route | Selected expression | Change |
| --- | --- | --- |
| `chenin-blanc / vouvray` | Still demi-sec (off-dry) | Retains the existing sweetness score of 2; no longer conflates dry, sweet and sparkling expressions. |
| `furmint / tokaj` | Dry Tokaj Furmint | Removes variable-sweetness copy; a producer technical sheet documents a fresh, steel-fermented example. Oak is not ruled out across Tokaj. Links to the separate Aszú expression. |
| `rkatsiteli / kakheti` | Dry, white-vinified reference | Removes amber/tannin and extended-qvevri guidance from the white card. Links to the separately modeled amber profile, which links back. |
| Cabernet and Merlot / Bordeaux | Two representative grape-led blends | Explains the blend status without inventing percentages or requiring every Bordeaux to be blended. |
| Grenache / Southern Rhône | Representative Grenache-led red blend | Côtes du Rhône evidence supports the reference; the app does not apply one appellation’s rules to the whole Southern Rhône. |
| Macabeo / Cava | White Brut Cava blend containing Macabeo | Traditional method and the selected sugar category are explicit; no claim of 100% Macabeo. |

`style.composition.kind` distinguishes `grape-reference` (bottle composition unspecified), `varietal-reference` (a selected varietal model), and `representative-blend` (a modeled blend without a fixed recipe). A generic grape-led reference never establishes a bottle’s legal varietal percentage. Still profiles without reviewed vessel evidence describe only their modeled vinification scope; they do not acquire invented barrel or tank specifications.

## Scores and ageing

The eight scores are approximate editorial judgments, not measured chemistry or quality ratings. Alcohol and sweetness anchors make the scale understandable but do not establish exact ABV or residual sugar. Factual sources do not validate a sensory score. R3 preserves every existing score; it does not introduce differences merely to fill a comparison chart.

Identical rounded same-grape scores are allowed. The content audit reports them for editorial attention, while structural validation still rejects invalid metrics, nonfinite modifiers, missing expression metadata, contradictory sweetness categories and broken references.

Bordeaux now distinguishes everyday young-drinking bottles from selected structured cuvées and fine wines. Burgundy foregrounds the wine body’s approximately 2–4-year guidance for regional appellations; village/cru wines may differ. Long maturity sequences describe selected ageworthy wines, not every bottle sold under a broad regional name. Precise air exposure times remain editorial suggestions: taste first, and treat young structured wine differently from fragile mature wine.

Every profile has an `ageingBasis`: `vintage`, `release`, `bottling`, or `producer` when cask/bottle distinctions prevent a single clock. An interval from vintage means total age, not extra years after purchase. Existing nonpriority drinking windows have not all been independently verified: their `evidenceGaps` say so. Storage, producer, vintage, closure and bottle history can shorten any suggested window. Cool, stable, dark storage is assumed; a warm room is not equivalent to a cellar.

## Evidence contract

Reviewed `sources.json` records contain a publisher/authority, a specific URL, the relevant page section or PDF pages, access date and review date. The Asti consortium page could be read through indexed publisher text but direct fetching returned 403; its record says so. An independently accessible producer description corroborates interrupted fermentation. Producer examples support that example and an editorial choice; they do not establish regional prevalence.

`evidence` groups connect selected factual claims to reviewed source IDs at profile or region level. `evidenceGaps` records outstanding limitations. The Sources & methodology drawer shows claim groups first, then gaps, with legacy regional references collapsed separately. The method does not imply that every sentence on a cited website is endorsed or that each profile is fully verified.

At R3, 59 legacy reference records remained background leads pending a fresh claim-level audit, including three grape-alias references researched in R1. R5 batch A rechecks the UC Davis Zinfandel identity record; 58 background records remain. R3 does not revoke that earlier work; their richer bibliographic metadata still needs completing. The original book records do not identify the edition, chapter or pages actually used. Those details are explicitly missing; no current edition or page number is invented to make the reference look complete. See [evidence audit](evidence-audit.md) for the priority queue and exact remaining records.

## Beginner guide

The bubbles section distinguishes common bottle/tank second fermentation from the single interrupted fermentation of Moscato d’Asti. Rosé production includes direct pressing and short skin maceration. Section-level source IDs record the factual basis for these corrections; the guide also explains editorial scores and bottle-age/storage dependence.

## Validation

`npm run validate` runs syntax, data contracts, the advisory audit and all DOM/navigation/search suites. `profile-trust.mjs` verifies expression presentation, blend status, links, score/search alignment, evidence metadata, age scope and Compare consistency. `validation-contracts.py` uses isolated fixtures to show that duplicate scores pass and are reported advisorially while invalid metrics, missing metadata and broken evidence/related links fail. Desktop Chrome smoke checks follow deployment; iPhone/iPad Safari and physical touch-device checks remain unverified.
