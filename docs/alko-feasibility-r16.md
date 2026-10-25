# R16 — Alko data feasibility gate

Date: 2026-10-25
Status: **Provisional NO-GO for pulling Alko data.** Any Alko data feed stays blocked; R17 (search links) is not affected. The gate can flip to GO only after Alko confirms access in writing (see "What would change the decision").

This is research, not legal advice.

## Decision

The planned mechanism (a scheduled GitHub Actions job pulling product, price and stock data from Alko's website into the Atlas) cannot be approved today, for three reasons:

1. **No permission found.** No Alko terms, licence, API or data-sharing programme covering this use were found. Silence is not permission.
2. **The only routes found for stock data work around bot protection.** Third-party tools that read store stock describe scraping product pages while evading Alko's bot protection (Incapsula). R16 rules this out ("do not scrape around restrictions"). A GitHub Actions runner is a datacenter IP address, which is the case those tools say gets blocked.
3. **Weekly sync cannot honestly support an availability claim.** See "Availability definition".

R15 (vintage weather) is unaffected and can proceed.

## Follow-up decision (2026-10-25)

Instead of pulling Alko data, R17 is now **Search at Alko Links**: plain links from profiles to Alko's own filtered search pages, using URL patterns supplied by Arttu from alko.fi (category path plus `grapeId`, `countryId`, `regionId`). No Alko data is stored, so the gate below does not block it. Old R17–R19 (bottle discovery, store selector, auto-publishing) are superseded. Link validity, especially for niche regions, is validated manually later. See R17 in `RELEASE_PLAN.md`.

## What was and was not verified

alko.fi could not be fetched from this environment (every request returned a client error). So **nothing below about Alko's own pages is first-hand**, and no prototype extraction was run. Everything about field names, stock display and bot protection comes from third-party projects, which can be out of date or wrong.

| Item | Evidence | Confidence |
| --- | --- | --- |
| Public Excel price list (`alkon-hinnasto-tekstitiedostona.xlsx`) with ~12,000 products | Alko MCP server README and notes; Tyynekaisa/alko-hinnasto README | Medium. Conflicts with the next row. |
| Old downloadable price list "no longer exists" | Apify Alko scraper page | Medium. Conflicts with the previous row. **Open: does the file still exist today?** |
| Price list columns include number, producer, bottle size, price, price per litre, type, country, vintage (Vuosikerta), alcohol %, energy | Tyynekaisa/alko-hinnasto README (may not match raw headers) | Low–medium |
| Grape and region fields exist in product data | Alko MCP notes (search matches them) | Low. Column names and quality unknown. |
| Online stock (`inStock`, `webshopStock`) from Alko's own product search API | Apify actor page | Low–medium. Undocumented endpoint, no stated licence. |
| Per-store stock shown on product pages as quantity ranges (e.g. "6–10"), read by scraping | Alko MCP notes | Low–medium. Ranges, not exact counts. |
| Alko uses Incapsula bot protection; tools evade it with headers, cookies and proxies | Alko MCP notes; Apify page (suggests Finnish residential proxy on 403) | Medium |
| Terms of use, licence, rate limits, retention and redistribution rules | **Not found.** No source states them. | None |
| Vintage and grapes via the Apify actor | Not provided by that actor | n/a |

## Required fields — status

| Field | Likely source | Status |
| --- | --- | --- |
| Product ID, product URL | Price list number; `alko.fi/tuotteet/{id}` pattern | Plausible, unverified |
| Name, EUR price | Price list | Plausible, unverified |
| Vintage | Price list `Vuosikerta` | Plausible; blank for NV and many products, unverified |
| Grape / blend, with shares | Unknown | **Unverified.** Shares probably absent, which blocks the R17 blend policy ("reject ambiguous grape shares"). |
| Country, region / appellation | Price list | Plausible; naming consistency unknown |
| Online orderability | Alko search API (secondhand) | Unverified, permission unknown |
| Store-level stock | Product page scraping (secondhand) | Unverified, permission unknown, ranges only |

## Availability definition (proposed)

A product listing alone is not availability. For the Atlas, a bottle may be called **available** only if all of these hold:

- **Online:** the source reports the product orderable online, with a check timestamp.
- **In store:** the source reports at least one unit at a named store (the lower bound of a range is enough), with a check timestamp. The Atlas never shows quantities.
- **Fresh:** the check is within a TTL set separately for stock and price.

**Cadence problem.** R17 plans a weekly reviewed PR. A merged snapshot is up to a week old plus review time, and stock can change daily. A static site cannot call Alko at view time. So with weekly sync the honest wording is **"last seen in stock on <date>"**, not "available", and store-level choices (R18) would need a much shorter refresh than R17 describes. Either R17 and R18 adopt the "last seen" wording, or stock refresh must run daily with its own validation. This should be decided before R17 is unblocked.

Suggested starting TTLs, to be tested against real data: price 7 days, online stock 48 hours, store stock 24 hours. Expired stock suppresses the offer even if a price remains.

## Legal flag: Finnish alcohol marketing

Wine is a mild alcoholic beverage under the Finnish Alcohol Act. A secondary source (EUCAM) describes Article 50 as restricting marketing of mild beverages, including bans on advertising aimed at minors, on games and contests, on consumer-generated content, and on advertising certain price promotions outside retail outlets. Whether a reference site that links to Alko products and shows prices counts as marketing is a legal question this research cannot answer. The exact provisions should be read on Finlex. Treat this as a second gate item: **get a Finnish legal opinion, or ask Valvira/Alko, before showing prices and purchase links publicly.** Avoid any promotional framing (discounts, "best deal") either way.

## Source adapter contract (draft)

The frontend must never read Alko's raw format. A source adapter outputs only this, validated before it reaches the site:

```json
{
  "schemaVersion": 1,
  "source": "alko",
  "fetchedAt": "ISO-8601 UTC",
  "complete": true,
  "products": [
    {
      "sourceId": "string",
      "url": "https://...",
      "name": "string",
      "vintage": 2022,
      "priceEur": 12.9,
      "priceCheckedAt": "ISO-8601 UTC",
      "country": "string",
      "regionRaw": "string",
      "grapesRaw": "string",
      "availability": {
        "online": { "orderable": true, "checkedAt": "ISO-8601 UTC" },
        "stores": [{ "storeId": "string", "inStock": true, "checkedAt": "ISO-8601 UTC" }]
      }
    }
  ]
}
```

Rules: `vintage` is separate from `sourceId`; raw region and grape strings are kept for review but never used for matching without a mapping table; `complete: false` snapshots are rejected; quantities are dropped at the adapter boundary.

## What would change the decision to GO

All of these, in writing:

1. Alko (data or partnerships contact) confirms a permitted route: an official feed, API or licence, or an explicit statement that the price list may be reused. Questions to ask: is the price list file still published; may it be reused and redistributed in a public site; is there any API for online and per-store stock; rate limits; retention and display limits; update cadence.
2. Access works from GitHub Actions without bot-protection evasion, proxies or spoofed headers.
3. A prototype run on the permitted source shows: stable schema, usable vintage, region and grape fields for the 20 R17 pilot profiles, and a defensible stock signal with timestamps.
4. The Finnish alcohol-marketing question above is answered.
5. R17/R18 wording is settled for the cadence problem ("last seen" vs daily refresh).

## Next steps

- Arttu: send Alko the questions in item 1. This cannot be done from the repository. Check from a normal browser whether the Excel price list is still linked on alko.fi, and what the site's terms of use say.
- Re-run the prototype once a permitted route exists, from a machine that can reach alko.fi.
- Continue with R15 meanwhile.

## Sources

- Alko MCP server (unofficial): https://glama.ai/mcp/servers/@markusl/alko-mcp/blob/ef5a587297773353d7af80833730ebc3067083b7/README.md and its CLAUDE.md notes
- Apify Alko scraper (unofficial): https://apify.com/studio-amba/alko-scraper
- Tyynekaisa/alko-hinnasto (unofficial): https://github.com/Tyynekaisa/alko-hinnasto
- EUCAM, Finland alcohol marketing regulation: https://eucam.info/regulations-on-alcohol-marketing/finland/
