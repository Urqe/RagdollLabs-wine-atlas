/*
 * RagDollLabs Wine Atlas — whole-map gallery
 * ------------------------------------------
 * A browse-everything view: every grape-region profile grouped by country,
 * with a wine-colour dot and the one-line "what to expect" note. Reached from
 * the landing page and the sidebar. A country jump list keeps the long page
 * usable. Pure progressive enhancement over the public WineAtlas API.
 */
(function initGallery() {
  let built = false;

  function countryAnchor(country) {
    return `gallery-${country.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}`;
  }

  function buildCard(item) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-card";
    card.dataset.grape = item.grapeId;
    card.dataset.region = item.regionId;

    const head = document.createElement("span");
    head.className = "gallery-card-head";
    const dot = document.createElement("span");
    dot.className = `wine-color-dot ${WineModel.color(item)}`;
    dot.setAttribute("aria-hidden", "true");
    const title = document.createElement("strong");
    title.textContent = item.grape.name;
    head.append(dot, title);

    const region = document.createElement("span");
    region.className = "gallery-card-region";
    region.textContent = item.region.name;

    const note = document.createElement("span");
    note.className = "gallery-card-note";
    note.textContent = item.regional.expect || "";

    card.append(head, region, note);
    card.addEventListener("click", () => WineAtlas.selectProfile(item.grapeId, item.regionId, true));
    return card;
  }

  function buildGallery() {
    const container = document.getElementById("galleryGrid");
    const jump = document.getElementById("galleryJump");
    if (!container || built) return;

    const byCountry = new Map();
    for (const item of WineAtlas.allPairs()) {
      const country = item.region.country;
      if (!byCountry.has(country)) byCountry.set(country, []);
      byCountry.get(country).push(item);
    }
    const countries = [...byCountry.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    container.replaceChildren();
    jump?.replaceChildren();
    for (const [country, items] of countries) {
      items.sort((a, b) => a.region.name.localeCompare(b.region.name) || a.grape.name.localeCompare(b.grape.name));
      const anchor = countryAnchor(country);

      const section = document.createElement("section");
      section.className = "gallery-country";
      section.id = anchor;
      section.setAttribute("aria-labelledby", `${anchor}-heading`);
      const heading = document.createElement("h3");
      heading.id = `${anchor}-heading`;
      heading.tabIndex = -1;
      heading.textContent = country;
      const grid = document.createElement("div");
      grid.className = "gallery-region-grid";
      items.forEach(item => grid.append(buildCard(item)));
      section.append(heading, grid);
      container.append(section);

      if (jump) {
        const link = document.createElement("button");
        link.type = "button";
        link.className = "gallery-jump-link";
        link.textContent = `${country} (${items.length})`;
        link.addEventListener("click", () => {
          heading.scrollIntoView({ block: "start" });
          heading.focus({ preventScroll: true });
        });
        jump.append(link);
      }
    }
    built = true;
  }

  function showGallery() {
    if (window.WineNavigation && !WineNavigation.rendering) return WineNavigation.go({ view: "gallery" });
    const gallery = document.getElementById("galleryView");
    const shell = document.getElementById("appShell");
    if (!gallery || !shell) return;
    // Switch to Explore first: its mode-changed handlers redraw the main area,
    // and the gallery must replace that view afterwards, not the other way round.
    if (document.getElementById("bExplore")?.getAttribute("aria-pressed") !== "true") WineAtlas.setMode("explore");
    buildGallery();
    document.getElementById("welcomeView")?.classList.add("hidden");
    shell.classList.remove("hidden");
    for (const id of ["emptyView", "exploreView", "compareView"]) document.getElementById(id)?.classList.add("hidden");
    gallery.classList.remove("hidden");
    const status = document.getElementById("liveStatus");
    if (status) status.textContent = "The whole map. Every profile in the atlas, grouped by country.";
    gallery.scrollIntoView?.({ block: "start" });
  }

  function hideGallery() {
    document.getElementById("galleryView")?.classList.add("hidden");
  }

  document.addEventListener("wineatlas:profile-selected", hideGallery);
  document.addEventListener("wineatlas:mode-changed", hideGallery);
  document.addEventListener("wineatlas:selection-needed", hideGallery);
  document.addEventListener("wineatlas:history-home", hideGallery);
  document.addEventListener("wineatlas:ready", () => {
    document.querySelectorAll("[data-gallery-open]").forEach(button =>
      button.addEventListener("click", showGallery));
  });

  window.WineGallery = { show: showGallery, hide: hideGallery };
})();
