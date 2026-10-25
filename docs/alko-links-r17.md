# R17 — Search at Alko, checked batches

Checked 2026-10-25 in Alko's public Finnish search UI, using a browser. The 12 generated links showed the expected category, grape and region or country chips, with plausible results at check time:

| Atlas profile | Alko filters | Scope |
| --- | --- | --- |
| Burgundy Pinot Noir | red, Bourgogne, Pinot Noir | Alko's broad Bourgogne region |
| Burgundy Chardonnay | white, Bourgogne, Chardonnay | Alko's broad Bourgogne region |
| Sancerre Sauvignon Blanc | white, France, Sauvignon Blanc | Country wide; Sancerre is **not** filtered |
| Marlborough Sauvignon Blanc | white, New Zealand, Sauvignon Blanc | Country wide; Marlborough is **not** filtered |
| Central Otago Pinot Noir | red, New Zealand, Pinot Noir | Country wide; Central Otago is **not** filtered |
| Bordeaux Cabernet Sauvignon | red, Bordeaux, Cabernet Sauvignon | Alko's broad Bordeaux region; grape filter does not prove a Cabernet-led blend |
| Bordeaux Merlot | red, Bordeaux, Merlot | Alko's broad Bordeaux region; grape filter does not prove a Merlot-led blend |
| Mendoza Malbec | red, Mendoza, Malbec | Alko's Mendoza region |
| Rioja Tempranillo | red, Rioja, Tempranillo | Alko's Rioja region |
| Napa Cabernet Sauvignon | red, USA, Cabernet Sauvignon | Country wide; Napa is **not** filtered |
| Napa Merlot | red, USA, Merlot | Country wide; Napa is **not** filtered |
| Barossa Syrah / Shiraz | red, Australia, Shiraz | Country wide; Barossa is **not** filtered; Alko's grape name is Shiraz |

The country fallback is explicit next to each link. Alko's country/region search does not necessarily map to an Atlas appellation or the proportions of a blend. Results can change; this check says the filters worked on the check date, not that a specific wine will remain listed. The config records the date for each profile and region policy. Unknown profiles, changed style contracts or malformed/missing optional config show no link. There is no live Alko request from Wine Atlas or its tests, and no Alko catalog copy in the repository.

Alko's [digital-service terms](https://www.alko.fi/fi/kayttoehdot), dated 2026-02-04, were read on 2026-10-25. They restrict reuse of Alko's text and images for commercial purposes and do not expressly address ordinary outbound links. We reuse neither text nor images. Finland's [Alcohol Act, section 50](https://www.finlex.fi/fi/lainsaadanto/2017/1102), restricts alcohol marketing. The UI stays neutral: no bottle recommendations, prices, discounts or stock claims. This is an editorial product decision, not a legal opinion or a blanket clearance for future retailer features.

Before extending the batch, use Alko's public UI to open each complete URL and check the selected filter chips. Do not infer a region slug from an Atlas region name. Record `checkedOn` and choose `verified`, `country-fallback`, or no mapping. Recheck links on later releases and when a break is reported. Browser/device layout checks remain open for Safari and touch screens.
