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

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REGION_FILES = [
    DATA / "regions-classics-west.json",
    DATA / "regions-classics-expanded.json",
    DATA / "regions-discovery.json",
    DATA / "regions-discovery-expanded.json",
    DATA / "regions-styles.json",
]
GENERIC_PAIRINGS = {"cheese", "vegetables", "salads", "meat", "dessert", "spicy food", "spiced dishes"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    regions = {}
    for path in REGION_FILES:
        regions.update(load(path))

    maturity = load(DATA / "maturity.json")
    winemaking = load(DATA / "winemaking.json")
    expect_to_profiles: dict[str, list[str]] = defaultdict(list)
    warnings: list[str] = []
    profile_count = 0
    generic_pairing_hits = Counter()

    for region_id, region in regions.items():
        for grape_id, profile in region.get("grapes", {}).items():
            profile_count += 1
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
