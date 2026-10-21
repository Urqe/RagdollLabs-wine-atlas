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
import math
from datetime import date
import re
import unicodedata
from urllib.parse import urlsplit
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
REGION_FILE = DATA / "regions.json"
REQUIRED_PROFILE_FIELDS = {"notes", "serve", "decant", "glass", "ageing", "pairings", "expect"}
METRICS = {"body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"}
WINEMAKING_PREVALENCE = {"very common", "common", "sometimes", "rare"}
MATURITY_STAGES = ["Young", "Developing", "Mature"]
STYLE_FAMILIES = {"still", "sparkling", "sweet", "fortified", "rose", "orange"}
PLACEHOLDER_NOTES = {"spice", "flowers", "herbs", "fruit", "earth"}
PRODUCTION_CLASSES = {
    "sparkling": {"traditional-bottle", "tank-second", "single-partial-tank"},
    "sweet": {"botrytised", "late-harvest", "natural-freeze"},
    "fortified": {"fortified-protected", "fortified-oxidative", "fortified-muscat-cask", "fortified-flor", "fortified-raisined", "fortified-heated-oxidative"},
    "rose": {"rose-direct-or-short", "rose-extracted", "rose-bled"},
    "orange": {"skin-maceration"},
}
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
        assert source.get("reviewStatus") in {"reviewed", "background-only"}, f"{source_id}: invalid review status"
        if source["reviewStatus"] == "reviewed":
            for field in ("publisher", "locator", "accessedOn", "reviewedOn"):
                assert isinstance(source.get(field), str) and source[field].strip(), f"{source_id}: missing {field}"
            for field in ("accessedOn", "reviewedOn"):
                date.fromisoformat(source[field])
        else:
            assert source.get("reviewNote"), f"{source_id}: background reference needs a limitation note"
    locators = load(DATA / "locators.json")
    food_aliases = load(DATA / "food-aliases.json")
    food_dishes = load(DATA / "food-dishes.json")
    winemaking = load(DATA / "winemaking.json")
    maturity = load(DATA / "maturity.json")
    glossary = load(DATA / "glossary.json")

    regions: dict[str, dict] = load(REGION_FILE)

    assert regions, "no regions loaded"
    assert grapes, "no grapes loaded"

    for grape_id, grape in grapes.items():
        assert grape.get("color") in {"red", "white"}, f"{grape_id}: missing/invalid color"
        assert isinstance(grape.get("indigenous"), bool), f"{grape_id}: indigenous must be boolean"
        if grape["indigenous"]:
            origin = grape.get("origin")
            assert isinstance(origin, list) and origin and all(isinstance(c, str) and c for c in origin), f"{grape_id}: indigenous grapes need an origin country list"
        if "aromatic" in grape:
            assert isinstance(grape["aromatic"], bool), f"{grape_id}: aromatic must be boolean"
        if "kind" in grape:
            assert grape["kind"] in {"grape", "blend"}, f"{grape_id}: invalid kind"
        for metric in METRICS:
            value = grape.get(metric)
            assert type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 5, f"{grape_id}: invalid {metric}"

    def search_key(value):
        value = "".join(c for c in unicodedata.normalize("NFD", value.lower()) if not unicodedata.combining(c))
        return " ".join(re.sub(r"[^\w\s]|_", " ", value).split())

    search_rules = load(DATA / "wine-search.json")["rules"]
    search_aliases = set()
    rule_ids = set()
    for rule in search_rules:
        assert rule["id"] not in rule_ids, "duplicate wine rule"
        rule_ids.add(rule["id"])
        assert rule["label"] and rule["aliases"]
        assert any(rule.get(field) for field in ("family", "regions", "grapeIds", "colors", "sweetness", "unavailable", "productionClasses")), "wine search: missing constraint"
        if "family" in rule:
            assert rule["family"] in STYLE_FAMILIES | {"still"}, "wine search: invalid family"
        for field, allowed in [("colors", {"red", "white", "rose", "orange", "amber", "tawny", "brown", "white-gold"}),
                               ("sweetness", STYLE_SWEETNESS), ("grapeIds", set(grapes)),
                               ("productionClasses", {"still-red", "still-white", "dried-grape-red"}.union(*PRODUCTION_CLASSES.values()))]:
            if field in rule:
                assert isinstance(rule[field], list) and rule[field] and set(rule[field]) <= allowed, f"wine search: invalid {field}"
        if "unavailable" in rule:
            assert rule["unavailable"] is True and isinstance(rule.get("coverageNote"), str) and rule["coverageNote"].strip(), "wine search: unavailable expression needs an explicit coverage note"
        for rid in rule.get("regions", []):
            assert rid in regions, f"wine search: unknown region {rid}"
            if "family" in rule:
                assert all(p.get("style", {}).get("family", "still") == rule["family"] for p in regions[rid]["grapes"].values()), f"wine search: family mismatch {rid}"
        for alias in rule["aliases"]:
            assert isinstance(alias, str) and search_key(alias), "wine search: empty alias"
            normalized = search_key(alias)
            assert normalized not in search_aliases, f"duplicate wine alias: {alias}"
            search_aliases.add(normalized)

    # Grape synonyms resolve an identity; they do not create regional coverage.
    canonical_names = {search_key(name): gid for gid, grape in grapes.items() for name in grape["name"].split("/")}
    for grape_id, grape in grapes.items():
        if "aliases" not in grape:
            continue
        assert isinstance(grape["aliases"], list) and grape["aliases"], f"{grape_id}: invalid aliases"
        assert grape.get("aliasSources") and all(source in sources for source in grape["aliasSources"]), f"{grape_id}: missing alias evidence"
        for alias in grape["aliases"]:
            assert isinstance(alias, str) and search_key(alias), f"{grape_id}: empty alias"
            normalized = search_key(alias)
            assert normalized not in search_aliases and normalized not in canonical_names, f"{grape_id}: conflicting alias {alias}"
            search_aliases.add(normalized)

    def validate_evidence(groups, prefix):
        assert isinstance(groups, list), f"{prefix}: evidence must be a list"
        for group in groups:
            assert isinstance(group, dict) and isinstance(group.get("claim"), str) and group["claim"].strip(), f"{prefix}: missing claim group"
            refs = group.get("sources")
            assert isinstance(refs, list) and refs, f"{prefix}: missing evidence references"
            for sid in refs:
                assert sid in sources, f"{prefix}: unknown evidence source {sid}"
                assert sources[sid]["reviewStatus"] == "reviewed", f"{prefix}: claim evidence must use a reviewed reference: {sid}"

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

        validate_evidence(region.get("evidence", []), region_id)
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
                assert type(modifier) in (int, float) and math.isfinite(modifier), f"{prefix}: non-numeric modifier {metric}"
            assert profile.get("ageingBasis") in {"vintage", "release", "bottling", "producer"}, f"{prefix}: invalid ageing time basis"
            validate_evidence(profile.get("evidence", []), prefix)
            gaps = profile.get("evidenceGaps")
            assert isinstance(gaps, list) and all(isinstance(gap, str) and gap.strip() for gap in gaps), f"{prefix}: invalid evidence gaps"
            assert gaps or profile.get("evidence"), f"{prefix}: evidence or an explicit review gap is required"
            for related in profile.get("related", []):
                assert related.get("grape") in regions.get(related.get("region"), {}).get("grapes", {}), f"{prefix}: unknown related expression"
                assert isinstance(related.get("label"), str) and related["label"].strip(), f"{prefix}: missing related label"
            if "displayName" in profile:
                assert isinstance(profile["displayName"], str) and profile["displayName"].strip(), f"{prefix}: invalid display name"
            assert "style" in profile, f"{prefix}: explicit modeled expression required"
            if "style" in profile:
                style = profile["style"]
                assert isinstance(style, dict), f"{prefix}: style must be an object"
                special_style_count += style.get("family") != "still"
                assert style.get("family") in STYLE_FAMILIES, f"{prefix}: invalid style family"
                if style["family"] != "still":
                    production = style.get("productionClass")
                    assert production in PRODUCTION_CLASSES[style["family"]], f"{prefix}: invalid discovery production class"
                    bubbles = style.get("effervescence")
                    allowed_bubbles = {"gentle"} if production == "single-partial-tank" else {"gentle", "sparkling"} if production == "tank-second" else {"sparkling"} if style["family"] == "sparkling" else {"none"}
                    assert bubbles in allowed_bubbles, f"{prefix}: inconsistent discovery bubble style"
                else:
                    allowed_production = {f"still-{style['color']}"} | ({"dried-grape-red"} if style["color"] == "red" else set())
                    assert style.get("productionClass", f"still-{style['color']}") in allowed_production, f"{prefix}: invalid still production class"
                    assert style.get("effervescence", "none") == "none", f"{prefix}: still wine cannot have bubbles"
                assert style.get("sweetness") in STYLE_SWEETNESS, f"{prefix}: invalid style sweetness"
                assert style.get("color") in {"red", "white", "rose", "orange", "amber", "tawny", "brown", "white-gold"}, f"{prefix}: invalid style color"
                for field in ("color", "label", "method"):
                    assert isinstance(style.get(field), str) and style[field].strip(), f"{prefix}: invalid style {field}"

                if "effect" in style:
                    assert isinstance(style["effect"], str) and style["effect"].strip(), f"{prefix}: invalid style effect"
                composition = style.get("composition")
                assert isinstance(composition, dict) and composition.get("kind") in {"grape-reference", "varietal-reference", "representative-blend"}, f"{prefix}: invalid blend status"
                assert isinstance(composition.get("text"), str) and composition["text"].strip(), f"{prefix}: missing composition label"
                sweetness = max(0, min(5, grapes[grape_id]["sweetness"] + profile.get("mods", {}).get("sweetness", 0)))
                assert style["sweetness"] != "dry" or sweetness <= 1, f"{prefix}: dry label contradicts sweetness score"
                assert style["sweetness"] != "sweet" or sweetness >= 3, f"{prefix}: sweet label contradicts sweetness score"
                assert style["sweetness"] != "off-dry" or 1 < sweetness < 3, f"{prefix}: off-dry label contradicts sweetness score"

    # Placeholder notes are a structural error; identical rounded scores are
    # legitimate editorial outcomes and are reported only by content_audit.py.
    for region_id, region in regions.items():
        for grape_id, profile in region["grapes"].items():
            for category, notes in profile["notes"].items():
                for note in notes:
                    assert note.casefold() not in PLACEHOLDER_NOTES, f"{region_id}/{grape_id}: placeholder note {note!r} in {category}"

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

    for region_id, region in regions.items():
        why_items = region.get("why") or []
        assert isinstance(why_items, list), f"{region_id}: why must be a list"
        for index, item in enumerate(why_items):
            prefix = f"{region_id}/why/{index}"
            for field in ("cause", "effect"):
                assert isinstance(item.get(field), str) and item[field].strip(), f"{prefix}: invalid {field}"
            if "grapes" in item:
                scoped = item["grapes"]
                assert isinstance(scoped, list) and scoped, f"{prefix}: grapes must be a non-empty list"
                for grape_id in scoped:
                    assert grape_id in region["grapes"], f"{prefix}: grape {grape_id} is not a profile in this region"

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

    taste = load(DATA / "taste-basics.json")
    assert taste.get("title") and taste.get("intro") and taste.get("sections"), "taste basics: missing title, intro or sections"
    section_ids = set()
    for section in taste["sections"]:
        prefix = f"taste-basics/{section.get('id')}"
        assert section.get("id") and section["id"] not in section_ids, f"{prefix}: missing or duplicate id"
        section_ids.add(section["id"])
        assert section.get("heading") and section.get("body"), f"{prefix}: missing heading or body"
        for example in section.get("examples", []):
            assert example.get("label"), f"{prefix}: example needs a label"
            assert example.get("grape") in regions.get(example.get("region"), {}).get("grapes", {}), f"{prefix}: unknown profile {example.get('region')}/{example.get('grape')}"
        for sid in section.get("sources", []):
            assert sid in sources, f"{prefix}: unknown guide source {sid}"
    for source_id in taste.get("sources", []):
        assert source_id in sources, f"taste basics: unknown source {source_id}"

    flights = load(DATA / "tasting-flights.json")
    assert isinstance(flights, list) and flights, "tasting flights: expected non-empty list"
    flight_ids = set()
    for flight in flights:
        assert isinstance(flight, dict), "tasting flights: expected object"
        fid = flight.get("id")
        assert isinstance(fid, str) and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fid), "tasting flights: invalid id"
        assert fid not in flight_ids, f"tasting flights: duplicate id {fid}"
        flight_ids.add(fid)
        for field in ("title", "question", "intro", "selection", "serving", "limitation"):
            assert isinstance(flight.get(field), str) and flight[field].strip(), f"flight/{fid}: missing {field}"
        prompts = flight.get("observations")
        assert isinstance(prompts, list) and 2 <= len(prompts) <= 3, f"flight/{fid}: expected 2–3 observations"
        assert all(isinstance(text, str) and text.strip() for text in prompts), f"flight/{fid}: invalid observation"
        wines = flight.get("wines")
        assert isinstance(wines, list) and 2 <= len(wines) <= 3, f"flight/{fid}: expected 2–3 wines"
        keys = set()
        compatibility = set()
        for wine in wines:
            assert isinstance(wine, dict), f"flight/{fid}: invalid wine reference"
            gid, rid = wine.get("grape"), wine.get("region")
            assert isinstance(gid, str) and isinstance(rid, str), f"flight/{fid}: invalid profile identifiers"
            assert gid in regions.get(rid, {}).get("grapes", {}), f"flight/{fid}: unknown profile {gid}/{rid}"
            assert (gid, rid) not in keys, f"flight/{fid}: duplicate wine"
            keys.add((gid, rid))
            style = regions[rid]["grapes"][gid]["style"]
            family = style["family"]
            compatibility.add((family, grapes[gid]["color"] if family == "still" else None))
        assert len(compatibility) == 1, f"flight/{fid}: incompatible comparison family/colour"

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
