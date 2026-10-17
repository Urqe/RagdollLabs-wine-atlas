import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGION_FILES = sorted((ROOT / "data").glob("regions-*.json"))
with open(ROOT / "data" / "grapes.json", encoding="utf-8") as f:
    grapes = json.load(f)

aliases = {}
for grape_id, grape in grapes.items():
    aliases[grape_id] = [part.strip().lower() for part in grape["name"].split("/") if part.strip()]

CAUTION = re.compile(r"garrigue|surrounding herbs|scrub|soil|slate|limestone|granite|marl|galestro|tuffeau|llicorella|chernozem|volcanic")

for path in REGION_FILES:
    with open(path, encoding="utf-8") as f:
        regions = json.load(f)
    for region_id, region in regions.items():
        why = region.get("why") or []
        for index, item in enumerate(why):
            text = f"{item.get('cause','')} {item.get('effect','')}".lower()
            mentioned = []
            for grape_id, names in aliases.items():
                if any(name in text for name in names):
                    mentioned.append(grape_id)
            if mentioned:
                print(f"SCOPE\t{path.name}\t{region_id}\t{index}\t{','.join(mentioned)}\t{item.get('cause','')} -> {item.get('effect','')}")
            if CAUTION.search(item.get("cause", "").lower()):
                print(f"CAUTION\t{path.name}\t{region_id}\t{index}\t{item.get('cause','')} -> {item.get('effect','')}")
