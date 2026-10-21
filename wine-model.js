/* Shared wine semantics. These definitions have no DOM or loading dependency. */
window.WineModel = (() => {
  const metrics = [
    { key: "body", label: "Body", high: "Fuller-bodied", low: "Leaner body", advancedHigh: "fuller-bodied", advancedLow: "leaner" },
    { key: "acidity", label: "Acidity", high: "Higher acidity", low: "Softer acidity", advancedHigh: "higher in acidity", advancedLow: "softer in acidity" },
    { key: "tannin", label: "Tannin", high: "More tannic", low: "Smoother tannin", advancedHigh: "more tannic", advancedLow: "smoother in tannin" },
    { key: "sweetness", label: "Sweetness", advancedHigh: "sweeter", advancedLow: "drier" },
    { key: "alcohol", label: "Alcohol", advancedHigh: "higher in alcohol", advancedLow: "lighter in alcohol" },
    { key: "fruit", label: "Fruit", high: "More fruit-forward", low: "More restrained fruit", advancedHigh: "more fruit-forward", advancedLow: "more restrained in fruit" },
    { key: "oak", label: "Oak", high: "More oak-driven", low: "Less oak influence", advancedHigh: "more oak-influenced", advancedLow: "less oak-influenced" },
    { key: "earth", label: "Earth", high: "More earthy and savoury", low: "Cleaner and less earthy", advancedHigh: "more earthy and savoury", advancedLow: "cleaner and less earthy" }
  ].map(Object.freeze);
  Object.freeze(metrics);
  const normalize = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
  const colorLabels = Object.freeze({ red: "Red", white: "White", rose: "Rosé", orange: "Orange / amber", amber: "Amber", tawny: "Tawny", brown: "Brown / mahogany", "white-gold": "White / gold" });
  const colorLabel = value => colorLabels[value] || value;
  const ageingAdvice = item => {
    const basis = { vintage: "vintage year", release: "release", bottling: "bottling", producer: "producer-specific cask/bottle guidance" }[item.regional.ageingBasis];
    return `${item.regional.ageing}${basis ? ` Time basis: ${basis}.` : ""}`;
  };
  const profileName = item => item.regional?.displayName || item.grape.name;
  const expressionSummary = item => [item.regional.style?.label, item.regional.style?.composition?.text].filter(Boolean).join(" · ");
  const color = item => item.regional?.style?.color || item.grape.color;
  const compatibilityKey = item => {
    const family = item.regional?.style?.family || "still";
    return family === "still" ? `still:${item.grape.color}` : family;
  };
  // Discovery is stricter than broad comparison compatibility. These classes
  // describe the selected reference, not legal categories or measured pressure.
  const productionLabels = Object.freeze({
    "dried-grape-red": "red vinification from dried grapes (appassimento)",
    "still-red": "still red vinification", "still-white": "still white vinification",
    "traditional-bottle": "second fermentation in bottle with lees ageing",
    "tank-second": "second fermentation in tank", "single-partial-tank": "one interrupted tank fermentation",
    botrytised: "noble-rot concentration", "late-harvest": "late-harvest concentration",
    "fortified-flor": "fortification with biological ageing under flor",
    "fortified-raisined": "sun-dried grapes, fortification and oxidative ageing",
    "fortified-heated-oxidative": "fortification with warm oxidative cask maturation (canteiro)",
    "fortified-protected": "fortification with relatively protected maturation",
    "fortified-oxidative": "fortification with oxidative cask ageing",
    "fortified-muscat-cask": "fortified Muscat with cask maturation",
    "rose-direct-or-short": "direct pressing or brief rosé maceration",
    "rose-extracted": "more extracted rosé vinification", "rose-bled": "bled-must rosé vinification",
    "skin-maceration": "extended white-grape skin contact"
  });
  const discoveryContext = item => {
    const style = item.regional.style || {};
    const family = style.family || "still";
    return { family, color: color(item), sweetness: style.sweetness,
      production: style.productionClass || (family === "still" ? `still-${color(item)}` : null),
      bubbles: style.effervescence || (family === "still" ? "none" : null) };
  };
  const productionLabel = value => productionLabels[value] || "production not specified";
  const bubbleLabel = value => ({ none: "no bubbles", gentle: "gentle bubbles", sparkling: "sparkling bubbles" }[value] || "bubble style not specified");
  const styleDifferences = (a, b) => {
    const x = discoveryContext(a), y = discoveryContext(b), differences = [];
    if (x.sweetness !== y.sweetness) differences.push(`Sweetness: ${x.sweetness || "unspecified"} → ${y.sweetness || "unspecified"}`);
    if (x.color !== y.color) differences.push(`Colour: ${colorLabel(x.color)} → ${colorLabel(y.color)}${x.family === "sparkling" && y.family === "sparkling" ? "; white vinification versus rosé skin contact" : ""}`);
    if (x.family !== y.family) differences.push(`Family: ${x.family} → ${y.family}`);
    if (!x.production || !y.production || x.production !== y.production) differences.push(`Production: ${productionLabel(x.production)} → ${productionLabel(y.production)}`);
    if (!x.bubbles || !y.bubbles || x.bubbles !== y.bubbles) differences.push(`Bubbles: ${bubbleLabel(x.bubbles)} → ${bubbleLabel(y.bubbles)}`);
    return differences;
  };
  const compatible = (a, b) => Boolean(a && b && compatibilityKey(a) === compatibilityKey(b));
  return Object.freeze({ metrics, normalize, color, colorLabel, ageingAdvice, expressionSummary, profileName, compatibilityKey, compatible, discoveryContext, productionLabel, bubbleLabel, styleDifferences });
})();
