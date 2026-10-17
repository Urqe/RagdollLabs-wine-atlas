#!/usr/bin/env python3
"""Static integrity checks for RagDollLabs Wine Atlas.

The validator intentionally tests data contracts rather than tasting opinions:
JSON parsing, duplicate IDs, grape/source references, locator coverage, explicit
Why metadata and required profile fields. Keeping this dependency-free lets
reviewers run it locally and keeps CI lightweight.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REGION_FILES = [
    DATA / "regions-classics-west.json",
    DATA / "regions-classics-expanded.json",
    DATA / "regions-discovery.json",
    DATA / "regions-discovery-expanded.json",
]
REQUIRED_PROFILE_FIELDS = {"notes", "serve", "decant", "glass", "ageing", "pairings", "expect"}
METRICS = {"body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"}

# Politically sensitive labels follow the official position of the Finnish Government.
# These guards make the documented policy executable so a future data addition cannot
# accidentally label Crimea or Sevastopol as Russian territory.
SENSITIVE_LABEL_RULES = {
    "crimea": "Ukraine",
    "sevastopol": "Ukraine",
}


def load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    grapes = load(DATA / "grapes.json")
    sources = load(DATA / "sources.json")
    locators = load(DATA / "locators.json")
    why_rules = load(DATA / "why-rules.json")

    regions: dict[str, dict] = {}
    for path in REGION_FILES:
        group = load(path)
        for region_id, region in group.items():
            assert region_id not in regions, f"duplicate region id: {region_id}"
            regions[region_id] = region

    assert regions, "no regions loaded"
    assert grapes, "no grapes loaded"

    for grape_id, grape in grapes.items():
        assert grape.get("color") in {"red", "white"}, f"{grape_id}: missing/invalid color"
        assert isinstance(grape.get("indigenous"), bool), f"{grape_id}: indigenous must be boolean"
        for metric in METRICS:
            value = grape.get(metric)
            assert isinstance(value, (int, float)) and 0 <= value <= 5, f"{grape_id}: invalid {metric}"

    for region_id, region in regions.items():
        assert region_id in locators, f"{region_id}: missing locator"
        assert region.get("name") and region.get("country") and region.get("climate"), f"{region_id}: incomplete identity"
        assert region.get("grapes"), f"{region_id}: no grape profiles"

        searchable_name = f"{region_id} {region.get('name', '')}".lower()
        for keyword, expected_country in SENSITIVE_LABEL_RULES.items():
            if keyword in searchable_name:
                assert region["country"] == expected_country, (
                    f"{region_id}: {keyword} must be labeled {expected_country} "
                    "under the Wine Atlas geopolitical labeling policy"
                )

        for source_id in region.get("sources", []):
            assert source_id in sources, f"{region_id}: unknown source {source_id}"
        for grape_id, profile in region["grapes"].items():
            assert grape_id in grapes, f"{region_id}: unknown grape {grape_id}"
            missing = REQUIRED_PROFILE_FIELDS - profile.keys()
            assert not missing, f"{region_id}/{grape_id}: missing {sorted(missing)}"
            for metric, modifier in profile.get("mods", {}).items():
                assert metric in METRICS, f"{region_id}/{grape_id}: unknown modifier {metric}"
                assert isinstance(modifier, (int, float)), f"{region_id}/{grape_id}: non-numeric modifier {metric}"

    # Why rules are explicit editorial metadata: optional grape scopes and carefully
    # rewritten effects. Validate references so a typo cannot silently hide content.
    for region_id, rules in why_rules.items():
        assert region_id in regions, f"why-rules: unknown region {region_id}"
        why_items = regions[region_id].get("why") or []
        assert isinstance(rules, dict), f"why-rules/{region_id}: rules must be an object"
        for raw_index, rule in rules.items():
            assert str(raw_index).isdigit(), f"why-rules/{region_id}: invalid index {raw_index}"
            index = int(raw_index)
            assert 0 <= index < len(why_items), f"why-rules/{region_id}: index {index} out of range"
            assert isinstance(rule, dict), f"why-rules/{region_id}/{index}: rule must be an object"
            if "grapes" in rule:
                scoped = rule["grapes"]
                assert isinstance(scoped, list) and scoped, f"why-rules/{region_id}/{index}: grapes must be a non-empty list"
                for grape_id in scoped:
                    assert grape_id in regions[region_id]["grapes"], (
                        f"why-rules/{region_id}/{index}: grape {grape_id} is not a profile in this region"
                    )
            if "cause" in rule:
                assert isinstance(rule["cause"], str) and rule["cause"].strip(), f"why-rules/{region_id}/{index}: invalid cause"
            if "effect" in rule:
                assert isinstance(rule["effect"], str) and rule["effect"].strip(), f"why-rules/{region_id}/{index}: invalid effect"

    extra_locators = set(locators) - set(regions)
    assert not extra_locators, f"locator entries without regions: {sorted(extra_locators)}"

    profile_count = sum(len(region["grapes"]) for region in regions.values())
    print(f"OK: {len(grapes)} grapes, {len(regions)} regions, {profile_count} grape-region profiles")


if __name__ == "__main__":
    main()
