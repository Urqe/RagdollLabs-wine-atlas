/*
 * RagDollLabs Wine Atlas — contextual learning layer
 * -------------------------------------------------
 * Advanced wine terms can be defined in place without turning profile prose into
 * permanent glossary clutter. Inline terms open the same native <dialog> used by
 * the full glossary browser in the sidebar.
 *
 * The dialog is opened with showModal() on supported browsers. That is deliberate:
 * the platform provides modal focus containment, an inert background and Escape
 * cancellation, so we do not maintain a second custom focus-trap implementation.
 * The fallback `open` attribute exists only for environments without showModal().
 *
 * Glossary JSON is optional enrichment and fails soft. A failed fetch is logged
 * and definitions stay unavailable for that page session; reload is the retry.
 */

let learningRequest = 0;
let learningInvoker = null;
let glossaryPromise = null;
let glossaryData = {};
let glossaryAliases = [];

const learningText = value => typeof value === "string" && Boolean(value.trim());
const learningRecord = value => value && typeof value === "object" && !Array.isArray(value);
function validGlossaryEntry(entry) {
  return learningRecord(entry) && ["term", "definition", "why"].every(field => learningText(entry[field])) &&
    Array.isArray(entry.aliases) && entry.aliases.every(learningText) &&
    (entry.examples === undefined || Array.isArray(entry.examples) && entry.examples.every(example =>
      learningRecord(example) && ["title", "text", "source"].every(field => learningText(example[field])))) &&
    (entry.inline === undefined || typeof entry.inline === "boolean");
}

// A successful JSON request can still contain an obsolete/malformed shape.
// Omit unusable enrichment instead of rejecting the journey's loading promise.
function normalizeTasteGuide(value) {
  if (!learningRecord(value) || !learningText(value.title) || !learningText(value.intro) || !Array.isArray(value.sections)) return null;
  const seen = new Set();
  const sections = [];
  for (const section of value.sections) {
    if (!learningRecord(section) || !learningText(section.id) || seen.has(section.id) || !learningText(section.heading) ||
        !Array.isArray(section.body) || !section.body.length || !section.body.every(learningText)) continue;
    seen.add(section.id);
    const examples = Array.isArray(section.examples) ? section.examples.filter(example => learningRecord(example) &&
      ["grape", "region", "label"].every(field => learningText(example[field]))) : [];
    sections.push({ ...section, examples });
  }
  return sections.length ? { ...value, sections } : null;
}

function loadGlossary() {
  if (!glossaryPromise) {
    glossaryPromise = WineData.json("./data/glossary.json", { optional: true }).then(data => {
      glossaryData = learningRecord(data) ? Object.fromEntries(Object.entries(data).filter(([, entry]) => validGlossaryEntry(entry))) : {};
      glossaryAliases = buildAliasIndex(glossaryData);
      return glossaryData;
    });
  }
  return glossaryPromise;
}

function buildAliasIndex(data) {
  const seen = new Set();
  const aliases = [];
  for (const [id, entry] of Object.entries(data || {})) {
    if (entry.inline === false) continue;
    for (const alias of [entry.term, ...(entry.aliases || [])]) {
      const normalized = String(alias).trim().toLocaleLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      aliases.push({ id, alias: String(alias).trim(), normalized });
    }
  }
  return aliases.sort((a, b) => b.alias.length - a.alias.length);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function glossaryRegex() {
  if (!glossaryAliases.length) return null;
  const alternatives = glossaryAliases.map(item => escapeRegExp(item.alias)).join("|");
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${alternatives})(?=$|[^\\p{L}\\p{N}])`, "giu");
}

function glossaryIdForAlias(alias) {
  const normalized = String(alias).toLocaleLowerCase();
  return glossaryAliases.find(item => item.normalized === normalized)?.id || null;
}

function shouldSkipGlossaryNode(node) {
  const parent = node.parentElement;
  if (!parent || !node.nodeValue?.trim()) return true;
  return Boolean(parent.closest("button, a, script, style, input, select, textarea, .glossary-dialog, .glossary-term, [aria-hidden='true']"));
}

function annotateRoot(root, regex) {
  if (!root || !regex) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return shouldSkipGlossaryNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const text = node.nodeValue;
    regex.lastIndex = 0;
    let cursor = 0;
    let match;
    let changed = false;
    const fragment = document.createDocumentFragment();

    while ((match = regex.exec(text))) {
      const prefix = match[1] || "";
      const term = match[2];
      const id = glossaryIdForAlias(term);
      if (!id) continue;
      changed = true;
      const start = match.index;
      fragment.append(document.createTextNode(text.slice(cursor, start)));
      if (prefix) fragment.append(document.createTextNode(prefix));

      const button = document.createElement("button");
      button.type = "button";
      button.className = "glossary-term";
      button.dataset.glossaryId = id;
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-label", `Define ${term}`);
      button.textContent = term;
      fragment.appendChild(button);
      cursor = regex.lastIndex;
    }

    if (!changed) continue;
    fragment.append(document.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
}

async function annotateContext() {
  await loadGlossary();
  const regex = glossaryRegex();
  if (!regex) return;
  ["expect", "climate", "identity", "why", "specialStyle", "winemaking", "notes", "maturity"]
    .map(id => document.getElementById(id))
    .forEach(root => annotateRoot(root, regex));
}

function dialogElement() {
  return document.getElementById("glossaryDialog");
}

function beginLearningRequest(trigger) {
  if (!dialogElement()?.open) learningInvoker = trigger instanceof Element ? trigger : trigger?.currentTarget instanceof Element ? trigger.currentTarget : document.activeElement;
  return ++learningRequest;
}

function restoreLearningFocus() {
  if (dialogElement()?.open) return;
  const target = learningInvoker;
  learningInvoker = null;
  if (target?.isConnected && !target.closest('.hidden, [hidden]')) target.focus({ preventScroll: true });
}

function cancelLearning() {
  ++learningRequest;
  learningInvoker = null;
  const dialog = dialogElement();
  if (!dialog?.open) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

function openDialog() {
  const dialog = dialogElement();
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  document.getElementById("glossaryClose")?.focus();
}

function closeDialog() {
  ++learningRequest;
  const dialog = dialogElement();
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else { dialog.removeAttribute("open"); restoreLearningFocus(); }
}

function glossaryEntryCard(entry, compact = false) {
  const article = document.createElement("article");
  article.className = compact ? "glossary-entry glossary-entry-focused" : "glossary-entry";
  const heading = document.createElement("h3");
  heading.textContent = entry.term;
  const definition = document.createElement("p");
  definition.textContent = entry.definition;
  const why = document.createElement("p");
  why.className = "glossary-why";
  const strong = document.createElement("strong");
  strong.textContent = "Why it matters: ";
  why.append(strong, document.createTextNode(entry.why));
  article.append(heading, definition, why);
  if (entry.examples?.length) {
    const examples = WineDOM.element("div", null, "glossary-examples");
    examples.append(WineDOM.element("h4", "Why these vineyards matter"));
    for (const example of entry.examples) {
      const item = WineDOM.element("div");
      item.append(WineDOM.element("strong", example.title), WineDOM.element("p", example.text));
      examples.append(item);
    }
    article.append(examples);
  }
  const sourceIds = [...new Set([...(entry.sources || []), ...(entry.examples || []).map(example => example.source)])];
  const sources = sourceIds.map(id => WineAtlas.getSource(id)).filter(Boolean);
  if (sources.length) {
    const details = WineDOM.element("details");
    details.append(WineDOM.element("summary", "Sources"));
    const list = WineDOM.element("ul", null, "source-list");
    for (const source of sources) {
      const item = WineDOM.element("li");
      item.append(WineDOM.referenceLink(source));
      list.append(item);
    }
    details.append(list);
    article.append(details);
  }
  return article;
}

async function showGlossaryEntry(id, trigger) {
  const request = beginLearningRequest(trigger);
  await loadGlossary();
  if (request !== learningRequest) return;
  const entry = glossaryData[id];
  if (!entry) return;
  const title = document.getElementById("glossaryDialogTitle");
  const intro = document.getElementById("glossaryIntro");
  const content = document.getElementById("glossaryContent");
  if (!title || !intro || !content) return;
  title.textContent = entry.term;
  intro.textContent = "A quick definition in the context of wine.";
  content.replaceChildren(glossaryEntryCard(entry, true));

  const browse = document.createElement("button");
  browse.type = "button";
  browse.className = "glossary-browse-all";
  browse.textContent = "Browse the full glossary";
  browse.addEventListener("click", showFullGlossary, { once: true });
  content.appendChild(browse);
  openDialog();
}

async function showFullGlossary(trigger) {
  const request = beginLearningRequest(trigger);
  await loadGlossary();
  if (request !== learningRequest) return;
  const title = document.getElementById("glossaryDialogTitle");
  const intro = document.getElementById("glossaryIntro");
  const content = document.getElementById("glossaryContent");
  if (!title || !intro || !content) return;
  title.textContent = "Wine glossary";
  intro.textContent = "Short explanations for technical terms that appear across Wine Atlas.";
  const entries = Object.values(glossaryData).sort((a, b) => a.term.localeCompare(b.term));
  content.replaceChildren(...entries.map(entry => glossaryEntryCard(entry)));
  if (!entries.length) content.append(WineDOM.element("p", "The glossary could not be loaded. Reload the page to try again."));
  openDialog();
}

/*
 * "How wine gets its taste" reuses the glossary dialog. Its example buttons open
 * the referenced profile through the same guarded WineAtlas.selectProfile() path
 * as every other selection, so an outdated reference simply does nothing.
 */
let tasteBasicsPromise = null;

function loadTasteBasics() {
  if (!tasteBasicsPromise) tasteBasicsPromise = WineData.json("./data/taste-basics.json", { optional: true }).then(normalizeTasteGuide);
  return tasteBasicsPromise;
}

function tasteSectionCard(section) {
  const article = document.createElement("article");
  article.className = "glossary-entry taste-section";
  article.dataset.sectionId = section.id;
  const heading = document.createElement("h3");
  heading.textContent = section.heading;
  article.append(heading, ...(section.body || []).map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  }));
  const examples = (section.examples || []).filter(example => WineAtlas.combinedProfile(example.grape, example.region));
  if (examples.length) {
    const list = document.createElement("div");
    list.className = "taste-examples";
    for (const example of examples) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "taste-example";
      button.textContent = example.label;
      button.addEventListener("click", () => {
        closeDialog();
        WineAtlas.selectProfile(example.grape, example.region, true);
      });
      list.append(button);
    }
    article.append(list);
  }
  return article;
}

async function showTasteBasics(event) {
  const sectionId = event?.section || event?.currentTarget?.dataset?.tasteSection;
  const request = beginLearningRequest(event?.currentTarget);
  const data = await loadTasteBasics();
  if (request !== learningRequest) return;
  const title = document.getElementById("glossaryDialogTitle");
  const intro = document.getElementById("glossaryIntro");
  const content = document.getElementById("glossaryContent");
  if (!title || !intro || !content) return;
  if (!data?.sections) {
    title.textContent = "Taste guide unavailable";
    intro.textContent = "The detailed guide could not be loaded.";
    content.replaceChildren(WineDOM.element("p", "You can continue the lesson or reload the page to try the guide again."));
    openDialog();
    return;
  }
  title.textContent = data.title;
  intro.textContent = data.intro;
  content.replaceChildren(...data.sections.map(tasteSectionCard));
  const flights = document.createElement("a");
  flights.href = "?view=flights";
  flights.className = "flight-link";
  flights.textContent = "Try a guided tasting flight";
  flights.addEventListener("click", event => {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeDialog();
    WineNavigation.go({ view: "flights" });
  });
  content.prepend(flights);
  const glossary = document.createElement("button");
  glossary.type = "button";
  glossary.className = "glossary-browse-all";
  glossary.textContent = "Browse the wine glossary";
  glossary.addEventListener("click", showFullGlossary, { once: true });
  content.append(glossary);
  openDialog();
  content.scrollTop = 0;
  const target = sectionId && [...content.querySelectorAll(".taste-section")].find(node => node.dataset.sectionId === sectionId);
  if (target) {
    target.classList.add("glossary-entry-focused");
    target.scrollIntoView?.({ block: "start" });
  }
}

function wireLearningLayer() {
  document.getElementById("glossaryOpen")?.addEventListener("click", showFullGlossary);
  document.querySelectorAll("[data-taste-basics]").forEach(button => button.addEventListener("click", showTasteBasics));
  document.getElementById("glossaryClose")?.addEventListener("click", closeDialog);
  dialogElement()?.addEventListener("close", restoreLearningFocus);
  dialogElement()?.addEventListener("cancel", event => { event.preventDefault(); closeDialog(); });
  dialogElement()?.addEventListener("click", event => {
    if (event.target === dialogElement()) closeDialog();
  });
  document.getElementById("exploreView")?.addEventListener("click", event => {
    const button = event.target.closest?.(".glossary-term");
    if (button) void showGlossaryEntry(button.dataset.glossaryId, button);
  });
}

document.addEventListener("wineatlas:ready", () => {
  wireLearningLayer();
  void loadGlossary();
  void annotateContext();
});

document.addEventListener("wineatlas:profile-selected", () => {
  void annotateContext();
});

document.addEventListener("wineatlas:winemaking-rendered", () => {
  void annotateContext();
});

document.addEventListener("wineatlas:special-style-rendered", () => {
  void annotateContext();
});

document.addEventListener("wineatlas:maturity-rendered", () => {
  void annotateContext();
});


// Explicit entry points let the journey share the existing dialogs and definitions.
window.WineLearning = Object.freeze({
  cancel: cancelLearning,
  showGlossary: showFullGlossary,
  showEntry: showGlossaryEntry,
  showGuide: (section, trigger) => showTasteBasics({ currentTarget: trigger, section })
});
