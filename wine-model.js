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
  const color = item => item.regional?.style?.color || item.grape.color;
  const compatibilityKey = item => {
    const family = item.regional?.style?.family || "still";
    return family === "still" ? `still:${item.grape.color}` : family;
  };
  const compatible = (a, b) => Boolean(a && b && compatibilityKey(a) === compatibilityKey(b));
  return Object.freeze({ metrics, normalize, color, compatibilityKey, compatible });
})();
