#!/usr/bin/env python3
"""Static integrity checks for RagDollLabs Wine Atlas.

The validator intentionally tests data contracts rather than tasting opinions:
JSON parsing, duplicate IDs, grape/source references, locator coverage, explicit
Why metadata, winemaking metadata, maturity metadata and required profile fields.
Keeping this dependency-free lets reviewers run it locally and keeps CI lightweight.
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
WINEMAKING_PREVALENCE = {"very common", "common", "sometimes", "rare"}
MATURITY_STAGES = ["Young", "Developing", "Mature"]

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
    winemaking = load(DATA / "winemaking.json")
    maturity = load(DATA / "maturity.json")

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
                assert region["country"] == expected_country, f"{region_id}: {keyword} must be labeled {expected_country}"

        for source_id in region.get("sources", []):
            assert source_id in sources, f"{region_id}: unknown source {source_id}"
        for grape_id, profile in region["grapes"].items():
            assert grape_id in grapes, f"{region_id}: unknown grape {grape_id}"
            missing = REQUIRED_PROFILE_FIELDS - profile.keys()
            assert not missing, f"{region_id}/{grape_id}: missing {sorted(missing)}"
            for metric, modifier in profile.get("mods", {}).items():
                assert metric in METRICS, f"{region_id}/{grape_id}: unknown modifier {metric}"
                assert isinstance(modifier, (int, float)), f"{region_id}/{grape_id}: non-numeric modifier {metric}"

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
                    assert grape_id in regions[region_id]["grapes"], f"why-rules/{region_id}/{index}: grape {grape_id} is not a profile in this region"
            if "cause" in rule:
                assert isinstance(rule["cause"], str) and rule["cause"].strip(), f"why-rules/{region_id}/{index}: invalid cause"
            if "effect" in rule:
                assert isinstance(rule["effect"], str) and rule["effect"].strip(), f"why-rules/{region_id}/{index}: invalid effect"

    assert isinstance(winemaking, dict), "winemaking data must be an object"
    for region_id, grape_entries in winemaking.items():
        assert region_id in regions, f"winemaking: unknown region {region_id}"
        assert isinstance(grape_entries, dict) and grape_entries, f"winemaking/{region_id}: entries must be an object"
        for grape_id, entry in grape_entries.items():
            assert grape_id in regions[region_id]["grapes"], f"winemaking/{region_id}: unknown profile grape {grape_id}"
            assert isinstance(entry, dict), f"winemaking/{region_id}/{grape_id}: entry must be an object"
            choices = entry.get("choices")
            assert isinstance(choices, list) and choices, f"winemaking/{region_id}/{grape_id}: choices must be non-empty"
            for source_id in entry.get("sources", []):
                assert source_id in sources, f"winemaking/{region_id}/{grape_id}: unknown source {source_id}"
            for index, choice in enumerate(choices):
                prefix = f"winemaking/{region_id}/{grape_id}/{index}"
                assert isinstance(choice, dict), f"{prefix}: choice must be an object"
                assert isinstance(choice.get("vessel"), str) and choice["vessel"].strip(), f"{prefix}: invalid vessel"
                assert choice.get("prevalence") in WINEMAKING_PREVALENCE, f"{prefix}: invalid prevalence"
                assert isinstance(choice.get("effect"), str) and choice["effect"].strip(), f"{prefix}: invalid effect"
                if "context" in choice:
                    assert isinstance(choice["context"], str) and choice["context"].strip(), f"{prefix}: invalid context"

    assert isinstance(maturity, dict), "maturity data must be an object"
    for region_id, grape_entries in maturity.items():
        assert region_id in regions, f"maturity: unknown region {region_id}"
        assert isinstance(grape_entries, dict) and grape_entries, f"maturity/{region_id}: entries must be an object"
        for grape_id, entry in grape_entries.items():
            prefix = f"maturity/{region_id}/{grape_id}"
            assert grape_id in regions[region_id]["grapes"], f"{prefix}: unknown profile grape"
            assert isinstance(entry.get("summary"), str) and entry["summary"].strip(), f"{prefix}: invalid summary"
            assert isinstance(entry.get("vintage"), str) and entry["vintage"].strip(), f"{prefix}: invalid vintage note"
            stages = entry.get("stages")
            assert isinstance(stages, list) and len(stages) == 3, f"{prefix}: stages must contain Young, Developing and Mature"
            assert [stage.get("label") for stage in stages] == MATURITY_STAGES, f"{prefix}: invalid stage order"
            for stage in stages:
                assert isinstance(stage.get("effect"), str) and stage["effect"].strip(), f"{prefix}: invalid {stage.get('label')} effect"
            sources_for_entry = entry.get("sources")
            assert isinstance(sources_for_entry, list) and sources_for_entry, f"{prefix}: sources must be non-empty"
            for source_id in sources_for_entry:
                assert source_id in sources, f"{prefix}: unknown source {source_id}"

    extra_locators = set(locators) - set(regions)
    assert not extra_locators, f"locator entries without regions: {sorted(extra_locators)}"

    profile_count = sum(len(region["grapes"]) for region in regions.values())
    winemaking_count = sum(len(entry["choices"]) for grapes_ in winemaking.values() for entry in grapes_.values())
    maturity_count = sum(len(grapes_) for grapes_ in maturity.values())
    print(f"OK: {len(grapes)} grapes, {len(regions)} regions, {profile_count} grape-region profiles, {winemaking_count} winemaking choices, {maturity_count} maturity profiles")


if __name__ == "__main__":
    main()
