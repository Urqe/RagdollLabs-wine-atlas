# Honest Discovery (R4)

Recommendations are curated learning routes. A broad comparison family answers “can these teach me something side by side?”, not “are they close alternatives?”. The Compare model and existing profile IDs, metrics and comparison compatibility remain unchanged.

## Close modeled styles

A close recommendation must pass every gate:

1. Same comparison compatibility, selected colour, sweetness category, production class and qualitative bubble style. Missing non-still production/bubble metadata cannot establish a close match.
2. Sweetness scores differ by at most 0.5 point. Body, acidity, tannin and alcohol differ by at most 1.5 points each.
3. Weighted root-mean-square distance is at most 0.8 point on the existing 0–5 editorial scale.

| Trait | Weight |
| --- | --- |
| Body, acidity, tannin | 1.5 each |
| Sweetness | 2 |
| Alcohol, fruit | 1 each |
| Oak, earth | 0.75 each |

The RMS threshold is an editorial cutoff, not a scientifically validated probability of liking a wine. It keeps the average weighted difference below about one score point, with stricter sweetness and core-structure guards. Structural traits carry more weight than oak/earth judgments. A low overall distance cannot hide a big core-trait difference. Existing rounded scores are approximate, so a recommendation never guarantees equivalence across producers or vintages. Aromas and exact vessel choices are not inferred from a short method description.

`style.productionClass` and `style.effervescence` explicitly classify the 26 non-still expressions through R5 batch B. These tags summarize the already modeled methods: bottle second fermentation, tank second fermentation, single interrupted tank fermentation, noble rot versus late harvest, protected versus oxidative/fortified-Muscat maturation, rosé extraction approaches and extended white-grape skin contact. The existing Prosecco reference describes gentle bubbles, so it retains `gentle` alongside Moscato; the app does not silently redefine it as spumante. `gentle` versus `sparkling` is qualitative effervescence, not measured pressure or a newly asserted legal category. Still profiles use only their declared red/white vinification scope; their recommendation reasons explicitly say that vessel choices are not matched. Shared skin-contact or cask classes also do not assert identical vessels, duration or every cellar choice.

## Route selection

At most three distinct routes are selected, in order:

- A same-grape reference, preferring a close modeled style, then a broadly comparable expression. A different family, colour, production method or a distance beyond the cutoff becomes **Same grape, different expression · Contrast**. Blend references retain their composition disclosures; the shared grape key does not promise two monovarietal bottles.
- One close modeled style with a different grape/reference.
- One close route with a different grape/reference and country, from a region explicitly tagged Discovery or Emerging region. The user-facing label is **Discover another region**. Indigenous-grape status supplies neither eligibility nor a ranking bonus; it says nothing about whether a wine is unusual to this reader.

When fewer than two routes exist, one broadly compatible alternative may be offered as **Explore a contrast**. There is no loop to fill three cards. Ties use canonical grape/region keys, so input order cannot change the result. Every card has a `similar` or `contrast` relationship, and a coverage sentence states how many close routes are actually shown. With no useful alternatives, the section says so instead of fabricating a recommendation.

Reasons name shared selected style and production scope, then useful shared traits: full/light body, bright acidity, firm tannin, fruit-forward or savoury character. Incidental matches on zero oak or zero tannin never form the reason. Material style differences are explicitly named; otherwise score differences of at least one point can qualify the similarity. The numeric arrows always run from the open profile to the recommended profile.

## Corrected examples

| Open profile | Route | Explanation |
| --- | --- | --- |
| Moscato d’Asti | Prosecco | Contrast: sweet → dry-to-off-dry and one interrupted fermentation → tank second fermentation. Both existing references describe gentle bubbles. Cava instead differs in both bottle second fermentation and the modeled sparkling bubble style. |
| Moscato d’Asti | Constantia Muscat | Same-grape contrast: a different family, concentration method, colour and bubble style. |
| Pinot Noir blanc de noirs (Crémant de Bourgogne) | Pinot Noir sparkling rosé (Crémant d’Alsace) | Same-grape contrast: white vinification versus rosé skin contact; neither the shared grape nor bottle method conceals the colour difference. |
| Ruby/LBV Port reference | Tawny Port | Same-reference contrast: colour and protected versus oxidative maturation differ. |
| Napa Cabernet | A qualifying full-bodied dry red | Close modeled style: shared full body and firm tannin, with producer/vessel uncertainty retained. |

Compare continues to accept educational contrasts within its broad compatibility rules. Its production context names sweetness, colour, method and bubble-style differences relative to slot 1 even when the scores are close. If no numeric difference reaches the 0.5-point display threshold, that is stated explicitly; the app does not infer identical styles.

## Validation and limitations

`tests/honest-discovery.mjs` tests the examples, threshold boundaries, the core-trait cap, unknown-method exclusion, absent/single-alternative catalogs, deterministic ordering, indigenous-flag independence, and invariants across all represented profiles. It checks both explanation text and the Explore/Compare presentations. Validation rejects production tags outside a style family and inconsistent method/bubble combinations.

`npm run validate` includes all existing search, navigation, loading-failure and content suites. Desktop Chrome smoke checks verify deployed contrast labels, coverage, navigation and comparison context. iPhone/iPad Safari and physical touch-device checks remain unverified. No new regions, score changes or claim-level wine research are introduced by R4; the R3 evidence backlog remains applicable.

R5 batch A adds an explicit `dried-grape-red` class for the selected dry Amarone expression. It remains broadly comparable with still reds but cannot become a close fresh-grape Valpolicella substitute solely through numeric distance.

R5 batch B retains broad fortified Compare compatibility for explicit dry/sweet and colour contrasts, preserving prior shared comparisons. New flor, raisined-fortified and heated-oxidative production classes prevent misleading close-style routes. See [batch B](classic-families-batch-b.md).
