#!/usr/bin/env python3
"""Advisory editorial audit for RagDollLabs Wine Atlas.

Unlike validate.py, this does not judge tasting opinions or block releases for
editorial preferences. It surfaces patterns worth reviewing: repeated summaries,
very short profile copy, duplicate pairings, generic pairing labels and sparse
coverage of optional learning layers.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REGION_FILE = DATA / "regions.json"
GENERIC_PAIRINGS = {"cheese", "vegetables", "salads", "meat", "dessert", "spicy food", "spiced dishes"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    regions = load(REGION_FILE)
    grapes = load(DATA / "grapes.json")
    sources = load(DATA / "sources.json")
    by_grape = defaultdict(list)
    metrics = sorted({"body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"})

    maturity = load(DATA / "maturity.json")
    winemaking = load(DATA / "winemaking.json")
    expect_to_profiles: dict[str, list[str]] = defaultdict(list)
    warnings: list[str] = []
    profile_count = 0
    generic_pairing_hits = Counter()

    for region_id, region in regions.items():
        for grape_id, profile in region.get("grapes", {}).items():
            profile_count += 1
            scores = tuple(max(0, min(5, grapes[grape_id][metric] + profile.get("mods", {}).get(metric, 0))) for metric in metrics)
            by_grape[(grape_id, scores)].append(region_id)
            key = f"{region_id}/{grape_id}"
            expect = " ".join(profile.get("expect", "").split())
            if expect:
                expect_to_profiles[expect.casefold()].append(key)
                if len(expect) < 55:
                    warnings.append(f"short expect copy: {key}")

            pairings = [" ".join(item.split()).casefold() for item in profile.get("pairings", [])]
            if len(pairings) != len(set(pairings)):
                warnings.append(f"duplicate pairing within profile: {key}")
            for pairing in pairings:
                if pairing in GENERIC_PAIRINGS:
                    generic_pairing_hits[pairing] += 1

    for profiles in expect_to_profiles.values():
        if len(profiles) > 1:
            warnings.append(f"repeated expect copy: {', '.join(profiles)}")

    for (grape_id, _), region_ids in by_grape.items():
        if len(region_ids) > 1:
            warnings.append(f"identical rounded scores (allowed; review context, do not invent differences): {grape_id}: {', '.join(region_ids)}")
    background = [sid for sid, source in sources.items() if source.get("reviewStatus") != "reviewed"]
    roots = [sid for sid in background if urlsplit(sources[sid]["url"]).path.rstrip("/") in {"", "/en", "/En"}]
    print(f"Evidence audit: {len(sources) - len(background)} reviewed references; {len(background)} background references pending claim-level review ({len(roots)} root/locale-root URLs)")
    print(f"Profiles with explicitly tracked evidence gaps: {sum(bool(p.get('evidenceGaps')) for r in regions.values() for p in r['grapes'].values())}")

    maturity_count = sum(len(entries) for entries in maturity.values())
    winemaking_count = sum(len(entries) for entries in winemaking.values())

    print(f"Content audit: {profile_count} profiles")
    print(f"Curated maturity coverage: {maturity_count}/{profile_count}")
    print(f"Curated winemaking coverage: {winemaking_count}/{profile_count}")
    if generic_pairing_hits:
        print("Generic pairing labels still in use (review opportunistically):")
        for label, count in generic_pairing_hits.most_common():
            print(f"  - {label}: {count}")
    if warnings:
        print("Editorial review queue:")
        for warning in warnings:
            print(f"  - {warning}")
    else:
        print("Editorial review queue: no structural copy issues found")
    print("OK: advisory content audit completed")


if __name__ == "__main__":
    main()
