# R15 vintage weather pilot

Status: three regional proxies, not full catalog coverage. Refreshed 2026-10-25. No Alko dependency, product, vintage or stock data.

## Source and permitted use

Cached daily values are from [Open-Meteo's Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api), explicitly requesting ERA5, not its changing “Best Match” blend. Open-Meteo's [terms](https://open-meteo.com/en/terms) allow free noncommercial use under CC BY 4.0 with attribution and limits; this project has no ads or subscription. Recheck terms if the project's use changes. ERA5 is reanalysis, not an estate weather station. Open-Meteo documents approximately 0.25° grid resolution and about five days of data delay. The underlying [Copernicus ERA5 dataset](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels) has its own attribution and documentation.

`python3 scripts/build_vintage_weather.py --refresh` is a deliberate maintainer operation, not a browser fetch. It requests daily 2 m mean/max temperature and precipitation for three city-area coordinates. The cache records requested and returned grid coordinates, elevation, model, dates, baseline, variables and license. Each request spans the supported period for one proxy; review the diff and anomalous years before publishing. A failed request must not overwrite a prior cache file for that region. Do not schedule automatic publication without review.

| Profile region | Requested proxy | Growing-season convention | Interpretation limit |
| --- | --- | --- | --- |
| Sancerre | 47.331, 2.840 (town area) | Apr–Sep of vintage year | Not every slope or parcel in the appellation |
| Marlborough | −41.513, 173.961 (Blenheim area) | Oct–Dec before vintage + Jan–Mar of vintage | Valleys and sea influence vary |
| Central Otago | −45.038, 169.196 (Cromwell area) | Oct–Dec before vintage + Jan–Mar of vintage | Altitude and valley differences are substantial |

These coordinates are representative *query points*, not vineyard locations or boundaries. A broad regional profile should only gain this panel where the proxy is judged useful; unsupported profiles show no panel. The 0.25° cell is especially coarse in complex terrain. The 2000–2020 baseline is the arithmetic mean of each proxy's 21 annual growing seasons, not a long climate normal or a quality ranking. 2000+ is computed per vintage. The refreshed snapshot includes 2025 Sancerre and 2026 Southern Hemisphere harvests; a season must end at least 60 days before the script includes it. That delay is an editorial review gate, not proof the reanalysis can never change. No provisional year is displayed. Recompute and review if upstream data are revised.

## Calculation and display

For each season, cache the mean of daily mean temperature, precipitation sum, count of daily maxima ≥30°C and sum of max(daily mean temperature −10°C, 0). The latter is an indicative growing-degree measure, not a grape-specific phenology model. Narrative temperature is “above/below” baseline only beyond ±0.7°C; rainfall only beyond ±20% or 25 mm, whichever is larger. Otherwise call it “near.” These thresholds are editorial language guards, not statistical significance or wine scores. Rain timing, frost, hail, disease, vine water access, site, grape, harvest decisions and cellar work are not modeled. We deliberately make no “better vintage” claim.

The reader-facing interpretation leads with a grape-specific tasting hypothesis: plausible ripeness, fruit character, texture and acidity shifts for Sauvignon Blanc or Pinot Noir. A near-average season normally starts from the represented regional style. When the mean is near average but days ≥30°C exceed the baseline by both eight days and 50%, it offers a qualified hot-spell hypothesis. The weather measurements follow in a collapsed disclosure. These rules never rewrite the profile’s expected notes, calculate a bottle score, or claim that a bottle will taste a certain way. Rainfall modifies the evidence context but is not converted into a flavour prediction because its timing and vineyard response are unknown.

The profile offers six recent years and an opt-in earlier-year field. The source and uncertainty are a second disclosure. Any missing/malformed file hides the entire optional panel; normal profiles continue. No pre-2000 bulk data. An older vintage could be researched individually in a future release, but current R17 Alko links contain no bottle vintage. A future bottle badge must point to the same regional/year cache while clearly saying this is not a bottle tasting review.

## Remaining R15 work

- Review more region boundaries and proxies in small batches; do not map a whole country or a large appellation to a point without a useful caveat.
- Consider growing-season timing per grape and location, rain distribution, frost and heat waves before adding stronger interpretation. The current summaries are deliberately restrained.
- Observe the panel with novices; inspect deployed browser layout, native print, iPhone/iPad Safari, keyboard, screen readers and enlarged text. The automated suite only checks data contracts and DOM behavior.
- Add a reviewed refresh PR workflow if ongoing updates are needed. The script already checks each hemisphere's completed season; it must not silently publish a new cache.
