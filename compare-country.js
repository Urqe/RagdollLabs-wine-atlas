/*
 * RagDollLabs Wine Atlas — compare-region country context
 * -------------------------------------------------------
 * Native <select> menus cannot reliably render a region name plus a separately
 * styled country line, especially on iOS/Safari. This progressive enhancement
 * keeps a hidden native select as the comparison state source used by app.js,
 * while presenting an accessible custom listbox with richer two-line labels.
 *
 * The hidden `.cr` selects deliberately remain the single values consumed by
 * renderCompare(); this file changes presentation, not comparison logic.
 */

(function enhanceCompareRegionSelectors() {
  const originalResetCompare = window.resetCompare;
  if (typeof originalResetCompare !== "function") return;

  function selectedRegionMarkup(regionId) {
    if (!regionId || !REGIONS[regionId]) {
      return '<span class="compare-select-name">— None —</span>';
    }
    const region = REGIONS[regionId];
    return `<span class="compare-select-name">${region.name}</span><span class="compare-select-country">${region.country}</span>`;
  }

  function closeMenu(control, returnFocus = false) {
    const trigger = control.querySelector(".compare-select-trigger");
    const menu = control.querySelector(".compare-select-menu");
    if (!trigger || !menu) return;
    menu.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
    if (returnFocus) trigger.focus();
  }

  function closeOtherMenus(except = null) {
    document.querySelectorAll(".compare-select").forEach(control => {
      if (control !== except) closeMenu(control, false);
    });
  }

  function openMenu(control) {
    const trigger = control.querySelector(".compare-select-trigger");
    const menu = control.querySelector(".compare-select-menu");
    if (!trigger || !menu) return;
    closeOtherMenus(control);
    menu.classList.remove("hidden");
    trigger.setAttribute("aria-expanded", "true");
    const selected = menu.querySelector('[aria-selected="true"]');
    const first = menu.querySelector(".compare-select-option");
    (selected || first)?.focus();
  }

  function updateControl(control, regionId) {
    const select = control.querySelector("select.cr");
    const trigger = control.querySelector(".compare-select-trigger");
    if (!select || !trigger) return;

    select.value = regionId;
    trigger.querySelector(".compare-select-value").innerHTML = selectedRegionMarkup(regionId);
    control.querySelectorAll(".compare-select-option").forEach(option => {
      option.setAttribute("aria-selected", String(option.dataset.value === regionId));
    });
  }

  function chooseOption(control, option) {
    const select = control.querySelector("select.cr");
    if (!select) return;
    updateControl(control, option.dataset.value || "");
    closeMenu(control, true);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function moveOptionFocus(option, direction) {
    const options = [...option.closest(".compare-select-menu").querySelectorAll(".compare-select-option")];
    const index = options.indexOf(option);
    if (index < 0) return;
    const next = (index + direction + options.length) % options.length;
    options[next].focus();
  }

  function buildCompareControl(index, regions) {
    const id = `compareRegion${index + 1}`;
    const listId = `${id}List`;
    const defaultRegionId = regions[index]?.[0] || "";
    const wrapper = document.createElement("div");
    wrapper.className = "compare-region-field";

    const nativeOptions = [
      '<option value="">— None —</option>',
      ...regions.map(([regionId, region]) => `<option value="${regionId}">${region.name} · ${region.country}</option>`)
    ].join("");

    const richOptions = [
      `<button type="button" class="compare-select-option" role="option" data-value="" aria-selected="${String(!defaultRegionId)}"><span class="compare-select-name">— None —</span></button>`,
      ...regions.map(([regionId, region]) => `<button type="button" class="compare-select-option" role="option" data-value="${regionId}" aria-selected="${String(regionId === defaultRegionId)}"><span class="compare-select-name">${region.name}</span><span class="compare-select-country">${region.country}</span></button>`)
    ].join("");

    wrapper.innerHTML = `
      <label id="${id}Label" for="${id}Button">Region ${index + 1}</label>
      <div class="compare-select">
        <select id="${id}" class="cr" hidden aria-hidden="true" tabindex="-1">${nativeOptions}</select>
        <button id="${id}Button" type="button" class="compare-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${id}Label ${id}Button" aria-controls="${listId}">
          <span class="compare-select-value">${selectedRegionMarkup(defaultRegionId)}</span>
          <span class="compare-select-chevron" aria-hidden="true">⌄</span>
        </button>
        <div id="${listId}" class="compare-select-menu hidden" role="listbox" aria-labelledby="${id}Label">${richOptions}</div>
      </div>`;

    const control = wrapper.querySelector(".compare-select");
    const select = control.querySelector("select.cr");
    const trigger = control.querySelector(".compare-select-trigger");
    select.value = defaultRegionId;
    select.addEventListener("change", renderCompare);

    trigger.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(control, false); else openMenu(control);
    });
    trigger.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu(control);
      }
    });

    control.querySelectorAll(".compare-select-option").forEach(option => {
      option.addEventListener("click", () => chooseOption(control, option));
      option.addEventListener("keydown", event => {
        if (event.key === "ArrowDown") { event.preventDefault(); moveOptionFocus(option, 1); }
        if (event.key === "ArrowUp") { event.preventDefault(); moveOptionFocus(option, -1); }
        if (event.key === "Home") { event.preventDefault(); option.closest(".compare-select-menu").querySelector(".compare-select-option")?.focus(); }
        if (event.key === "End") { event.preventDefault(); [...option.closest(".compare-select-menu").querySelectorAll(".compare-select-option")].at(-1)?.focus(); }
        if (["Enter", " "].includes(event.key)) { event.preventDefault(); chooseOption(control, option); }
        if (event.key === "Escape") { event.preventDefault(); closeMenu(control, true); }
      });
    });

    return wrapper;
  }

  /*
   * app.js rebuilds comparison controls whenever the grape changes. Replacing
   * only resetCompare() preserves that lifecycle and lets renderCompare() keep
   * reading the same `.cr` values it always has.
   */
  window.resetCompare = function resetCompareWithCountryContext() {
    const grapeId = $("cg").value;
    const regions = relevantRegions(grapeId);
    $("compareRegionControls").innerHTML = "";

    if (regions.length < 2) {
      $("compareHint").textContent = "More regional expressions coming soon.";
      renderCompare();
      return;
    }

    $("compareHint").textContent = "Choose two or three regional expressions to compare.";
    for (let index = 0; index < 3; index += 1) {
      $("compareRegionControls").appendChild(buildCompareControl(index, regions));
    }
    renderCompare();
  };

  document.addEventListener("click", event => {
    if (!event.target.closest(".compare-select")) closeOtherMenus();
  });
})();
