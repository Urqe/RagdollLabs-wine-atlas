#!/usr/bin/env python3
"""Static integrity checks for RagDollLabs Wine Atlas.

The validator intentionally tests data contracts rather than tasting opinions:
JSON parsing, duplicate IDs, grape/source references, locator coverage, explicit
Why metadata, food-alias targets, winemaking metadata, maturity metadata,
glossary metadata, special wine-style metadata and required profile fields.
Keeping this dependency-free lets reviewers run it locally and keeps CI lightweight.
"""

from __future__ import annotations

import json
from urllib.parse import urlsplit
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
REQUIRED_PROFILE_FIELDS = {"notes", "serve", "decant", "glass", "ageing", "pairings", "expect"}
METRICS = {"body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"}
WINEMAKING_PREVALENCE = {"very common", "common", "sometimes", "rare"}
MATURITY_STAGES = ["Young", "Developing", "Mature"]
STYLE_FAMILIES = {"sparkling", "sweet", "fortified", "rose", "orange"}
STYLE_SWEETNESS = {"dry", "dry-to-off-dry", "off-dry", "sweet"}

SENSITIVE_LABEL_RULES = {
    "crimea": "Ukraine",
    "sevastopol": "Ukraine",
}


def load(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def valid_reference_url(value) -> bool:
    if not isinstance(value, str) or any(ord(c) < 32 or ord(c) == 127 for c in value):
        return False
    try:
        url = urlsplit(value)
        _ = url.port  # Reject malformed ports as the browser URL parser would.
        return url.scheme == "https" and bool(url.hostname) and not url.username and not url.password
    except ValueError:
        return False


def main() -> None:
    grapes = load(DATA / "grapes.json")
    sources = load(DATA / "sources.json")
    for source_id, source in sources.items():
        assert source.get("name") and valid_reference_url(source.get("url")), f"invalid HTTPS reference: {source_id}"
    locators = load(DATA / "locators.json")
    why_rules = load(DATA / "why-rules.json")
    food_aliases = load(DATA / "food-aliases.json")
    food_dishes = load(DATA / "food-dishes.json")
    winemaking = load(DATA / "winemaking.json")
    maturity = load(DATA / "maturity.json")
    glossary = load(DATA / "glossary.json")

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
        if "kind" in grape:
            assert grape["kind"] in {"grape", "blend"}, f"{grape_id}: invalid kind"
        for metric in METRICS:
            value = grape.get(metric)
            assert isinstance(value, (int, float)) and 0 <= value <= 5, f"{grape_id}: invalid {metric}"

    search_rules = load(DATA / "wine-search.json")["rules"]
    search_aliases = set()
    rule_ids = set()
    for rule in search_rules:
        assert rule["id"] not in rule_ids, "duplicate wine rule"
        rule_ids.add(rule["id"])
        assert rule["family"] in STYLE_FAMILIES and rule["label"] and rule["aliases"]
        for rid in rule.get("regions", []):
            assert rid in regions, f"wine search: unknown region {rid}"
            assert all(p.get("style", {}).get("family") == rule["family"] for p in regions[rid]["grapes"].values()), f"wine search: family mismatch {rid}"
        for alias in rule["aliases"]:
            import unicodedata
            normalized = "".join(c for c in unicodedata.normalize("NFD", alias.lower()) if not unicodedata.combining(c))
            assert normalized not in search_aliases, f"duplicate wine alias: {alias}"
            search_aliases.add(normalized)

    special_style_count = 0
    pairing_values: set[str] = set()
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
            prefix = f"{region_id}/{grape_id}"
            assert grape_id in grapes, f"{region_id}: unknown grape {grape_id}"
            missing = REQUIRED_PROFILE_FIELDS - profile.keys()
            assert not missing, f"{prefix}: missing {sorted(missing)}"
            pairings = profile.get("pairings")
            assert isinstance(pairings, list) and pairings, f"{prefix}: pairings must be a non-empty list"
            for pairing in pairings:
                assert isinstance(pairing, str) and pairing.strip(), f"{prefix}: invalid pairing"
                assert pairing == pairing.lower(), f"{prefix}: pairing label must be lowercase: {pairing}"
                pairing_values.add(pairing.casefold().strip())
            for metric, modifier in profile.get("mods", {}).items():
                assert metric in METRICS, f"{prefix}: unknown modifier {metric}"
                assert isinstance(modifier, (int, float)), f"{prefix}: non-numeric modifier {metric}"
            if "style" in profile:
                special_style_count += 1
                style = profile["style"]
                assert isinstance(style, dict), f"{prefix}: style must be an object"
                assert style.get("family") in STYLE_FAMILIES, f"{prefix}: invalid style family"
                assert style.get("sweetness") in STYLE_SWEETNESS, f"{prefix}: invalid style sweetness"
                assert style.get("color") in {"red", "white", "rose", "orange", "amber", "tawny", "white-gold"}, f"{prefix}: invalid style color"
                for field in ("color", "label", "method", "effect"):
                    assert isinstance(style.get(field), str) and style[field].strip(), f"{prefix}: invalid style {field}"

    import unicodedata
    def food_key(value):
        return " ".join("".join(c for c in unicodedata.normalize("NFD", value) if not unicodedata.combining(c)).casefold().split())
    normalized_targets = {food_key(k): {food_key(v) for v in targets} for k, targets in food_aliases.items()}
    for alias, targets in food_aliases.items():
        assert {food_key(v) for v in targets} == normalized_targets[food_key(alias)], f"conflicting normalized alias: {alias}"
    for label, dish in food_dishes["dishes"].items():
        assert label == label.lower(), f"curated dish must be lowercase: {label}"
        assert label.casefold() in pairing_values, f"unused curated dish: {label}"
        assert dish["guidance"] and dish["basis"] and dish["aliases"], f"incomplete dish: {label}"
        assert dish["source"] in food_dishes["sources"], f"unknown dish source: {label}"
        for alias in dish["aliases"]:
            assert food_key(label) in normalized_targets[food_key(alias)], f"unresolved dish alias: {alias}"
    for source in food_dishes["sources"].values():
        assert valid_reference_url(source.get("url")) and source["name"]
    import xml.etree.ElementTree as ET
    artwork = ET.parse(ROOT / "assets/vineyard-welcome.svg").getroot()
    ns = {"s": "http://www.w3.org/2000/svg"}
    assert artwork.find(".//s:g[@id='landing-ragdoll']", ns) is not None, "landing cat geometry missing"
    assert not artwork.findall(".//s:image", ns), "CSS background SVG must not depend on external images"

    assert isinstance(food_aliases, dict) and food_aliases, "food aliases must be a non-empty object"
    normalized_aliases: set[str] = set()
    for alias, targets in food_aliases.items():
        assert isinstance(alias, str) and alias.strip(), "food aliases: alias keys must be non-empty strings"
        normalized_alias = alias.casefold().strip()
        assert normalized_alias not in normalized_aliases, f"food aliases: duplicate alias {alias!r}"
        normalized_aliases.add(normalized_alias)
        assert isinstance(targets, list) and targets, f"food aliases/{alias}: targets must be a non-empty list"
        for target in targets:
            assert isinstance(target, str) and target.strip(), f"food aliases/{alias}: invalid target"
            assert target.casefold().strip() in pairing_values, f"food aliases/{alias}: target {target!r} is not used by any profile pairing"

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

    assert isinstance(glossary, dict) and glossary, "glossary data must be a non-empty object"
    aliases_seen: dict[str, str] = {}
    for glossary_id, entry in glossary.items():
        prefix = f"glossary/{glossary_id}"
        assert isinstance(entry, dict), f"{prefix}: entry must be an object"
        for field in ("term", "definition", "why"):
            assert isinstance(entry.get(field), str) and entry[field].strip(), f"{prefix}: invalid {field}"
        aliases = entry.get("aliases")
        assert isinstance(aliases, list) and aliases, f"{prefix}: aliases must be non-empty"
        if "inline" in entry:
            assert isinstance(entry["inline"], bool), f"{prefix}: inline must be boolean"
        source_ids = entry.get("sources")
        assert isinstance(source_ids, list) and source_ids, f"{prefix}: sources must be non-empty"
        for source_id in source_ids:
            assert source_id in sources, f"{prefix}: unknown source {source_id}"
        for alias in [entry["term"], *aliases]:
            assert isinstance(alias, str) and alias.strip(), f"{prefix}: invalid alias"
            normalized = alias.casefold().strip()
            previous = aliases_seen.get(normalized)
            assert previous in {None, glossary_id}, f"{prefix}: alias {alias!r} already belongs to {previous}"
            aliases_seen[normalized] = glossary_id

    extra_locators = set(locators) - set(regions)
    assert not extra_locators, f"locator entries without regions: {sorted(extra_locators)}"

    profile_count = sum(len(region["grapes"]) for region in regions.values())
    winemaking_count = sum(len(entry["choices"]) for grapes_ in winemaking.values() for entry in grapes_.values())
    maturity_count = sum(len(grapes_) for grapes_ in maturity.values())
    print(
        f"OK: {len(grapes)} grapes/bases, {len(regions)} regions, {profile_count} profiles, "
        f"{special_style_count} beyond-still styles, {len(food_aliases)} food aliases, "
        f"{winemaking_count} winemaking choices, {maturity_count} maturity profiles, "
        f"{len(glossary)} glossary terms"
    )


if __name__ == "__main__":
    main()
