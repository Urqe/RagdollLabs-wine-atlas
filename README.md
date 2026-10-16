# RagdollLabs Wine Atlas

A static, data-driven wine reference app for exploring how grape variety, region and climate shape a wine's typical style.

Live site: https://urqe.github.io/RagdollLabs-wine-atlas/

## Features

- Explore grape + region combinations
- Sensory profile for body, acidity, tannin, sweetness, alcohol, fruit, oak and earthiness
- Categorized flavor notes
- Serving temperature, decanting, glassware and food-pairing guidance
- Regional comparison mode
- Discovery regions beyond the usual classics, including Mexico, Bulgaria, Ukraine and Russia
- Responsive layout for desktop, tablet and mobile
- Accessibility basics including explicit labels, focus states and ARIA toggle state

## Architecture

The project is deliberately split by responsibility:

```text
/
├── index.html
├── styles.css
├── app.js
├── data/
│   ├── grapes.json
│   ├── regions-classics-west.json
│   ├── regions-classics-expanded.json
│   └── regions-discovery.json
└── README.md
```

- `index.html` contains semantic page structure only.
- `styles.css` owns presentation and responsive behavior.
- `app.js` owns loading, guarded lookups, state and rendering logic.
- `data/*.json` contains the wine knowledge.

A rendered profile is calculated as:

**grape baseline + regional modifiers / overrides**

The JavaScript and CSS are commented for future reviewers, especially around data loading, compare-state behavior and accessibility decisions.

## Running locally

Because the app loads JSON with `fetch()`, run a small local web server rather than opening `index.html` directly with `file://`.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

The app uses relative paths and is designed for a project Pages URL.

In GitHub:

```text
Settings → Pages → Deploy from branch → main → / (root)
```

## Data conventions

- Sensory metrics use a 0–5 scale.
- Region entries contain only grape combinations intended to be plausible for that region.
- Flavor notes are grouped into Fruit, Floral, Spice, Earth / savory, Oak / ageing, and Mineral / herbal.
- Grapes with fewer than two regional expressions remain available in Explore mode; Compare mode displays **“More regional expressions coming soon.”** instead of presenting a meaningless comparison.

## Compare-state safety

Changing the grape in Compare mode rebuilds the region selectors from scratch. This prevents a region ID from the previous grape from surviving into an invalid grape/region pair. `combinedProfile()` also guards all lookups as a second line of defense.

## Disclaimer

> Wine profiles in this project describe typical regional and varietal characteristics. Individual wines may differ substantially depending on vintage, producer, vineyard, climate and winemaking choices.
