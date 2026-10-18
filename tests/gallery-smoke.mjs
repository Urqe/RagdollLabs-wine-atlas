import assert from "node:assert/strict";
import { createApp } from "./harness.mjs";

const { window, document, settle, close } = await createApp();
await settle();
const hidden = id => document.getElementById(id).classList.contains("hidden");
const pairs = window.WineAtlas.allPairs();

// Landing and sidebar both offer the whole map.
const openers = document.querySelectorAll("[data-gallery-open]");
assert.equal(openers.length, 2, "landing link and sidebar button should both open the gallery");
assert.ok(document.querySelector("#welcomeView [data-gallery-open]"), "landing page must offer the whole map");

// Opening from the landing page shows every profile, grouped by country.
document.querySelector("#welcomeView [data-gallery-open]").click();
await settle();
assert.ok(hidden("welcomeView") && !hidden("appShell") && !hidden("galleryView"));
assert.ok(hidden("exploreView") && hidden("emptyView") && hidden("compareView"), "the gallery replaces the main view");
const cards = document.querySelectorAll("#galleryGrid .gallery-card");
assert.equal(cards.length, pairs.length, "every profile appears exactly once");
const countries = new Set(pairs.map(item => item.region.country));
assert.equal(document.querySelectorAll("#galleryGrid .gallery-country").length, countries.size);
assert.equal(document.querySelectorAll("#galleryJump .gallery-jump-link").length, countries.size, "jump list has one entry per country");
const headings = [...document.querySelectorAll("#galleryGrid .gallery-country h3")].map(h => h.textContent);
assert.deepEqual(headings, [...headings].sort((a, b) => a.localeCompare(b)), "countries are alphabetical");
assert.ok([...cards].every(card => card.querySelector(".wine-color-dot")), "every card carries a colour dot");

// A card opens its profile and closes the gallery.
const first = cards[0];
first.click();
await settle();
assert.ok(hidden("galleryView") && !hidden("exploreView"));
assert.equal(new URL(window.location.href).searchParams.get("grape"), first.dataset.grape);
assert.equal(new URL(window.location.href).searchParams.get("region"), first.dataset.region);

// Opening from Compare mode returns to Explore; switching mode hides the gallery.
document.getElementById("bCompare").click();
await settle();
document.querySelector(".gallery-sidebar-open").click();
await settle();
assert.ok(!hidden("galleryView") && hidden("compareView"));
assert.equal(document.getElementById("bExplore").getAttribute("aria-pressed"), "true");
document.getElementById("bCompare").click();
await settle();
assert.ok(hidden("galleryView") && !hidden("compareView"));

await close();
console.log(`OK: gallery smoke (${pairs.length} profiles across ${countries.size} countries)`);
