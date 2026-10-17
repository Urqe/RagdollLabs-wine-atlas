# Content quality audit — smart discovery release

This audit treats Wine Atlas as a curated reference, not a completeness contest. Optional depth stays intentionally sparse when the material would otherwise become generic filler.

## What was reviewed

- recommendation quality and whether Similar Wines can cross into a misleading production/style context
- maturity coverage on wines where bottle evolution is genuinely educational
- winemaking coverage and whether more entries would add insight or merely repeat the profile's existing production-method metadata
- duplicated or unusually short profile expectations
- duplicate and overly generic food-pairing labels
- source-backed special-style context already present for sparkling, sweet, fortified, rosé and orange/amber wines

## Changes made

- Similar Wines is replaced by intent-based Smart Discovery. Recommendations are chosen within a meaningful style context and explain whether they represent the same grape in another place, a similar structure/style, or a more adventurous next step.
- Curated maturity guidance expands from 8 to 12 profiles with Brunello di Montalcino, Mosel Riesling, Blanc de Blancs Champagne and Sauternes.
- Winemaking coverage remains deliberately sparse. The audit did not add generic vessel notes merely to raise a coverage percentage; special-style profiles already explain defining production methods where appropriate.
- `scripts/content_audit.py` now provides an advisory editorial pass for repeated/short expectation copy, duplicate pairings, generic pairing labels and optional-layer coverage. It reports rather than failing CI for subjective editorial choices.

## Editorial policy going forward

1. Prefer a missing optional section to boilerplate.
2. Add maturity only when bottle evolution is a meaningful part of understanding the wine.
3. Add winemaking choices only when alternative approaches materially change the regional expression.
4. Keep recommendations style-aware before optimizing purely for numerical similarity.
5. Treat generic pairing labels as a review queue, not an automatic error: sometimes `cheese` or `vegetables` is intentionally broad, but more specific wording is preferred when defensible.
6. Source factual production and ageing claims through the existing source registry; avoid false precision on exact drinking windows.
