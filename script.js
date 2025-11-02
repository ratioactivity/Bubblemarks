document.addEventListener("DOMContentLoaded", () => {
  console.log("Bubblemarks initializing...");
  initializeBubblemarks();
  console.log("✅ script validated");
});

const STORAGE_KEY = "bubblemarks.bookmarks.v1";
const DEFAULT_SOURCE = "bookmarks.json";

function initializeBubblemarks() {
  try {
    bootstrapBubblemarks();
    setupCategories();
    setupBookmarks();
    renderBookmarks("All");
    console.log("Bubblemarks loaded successfully");
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

let bookmarks = [];

function setupBookmarks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        bookmarks = parsed;
        setBookmarks(bookmarks, { persist: false });
        renderBookmarks("All");
        return;
      }
    }
  } catch (error) {
    console.error("Error loading bookmarks from localStorage:", error);
  }

  fetch("bookmarks.json")
    .then((res) => res.json())
    .then((data) => {
      if (bookmarks.length) {
        return;
      }
      bookmarks = Array.isArray(data) ? data : [];
      setBookmarks(bookmarks);
      renderBookmarks("All");
    })
    .catch((err) => console.error("Error loading bookmarks:", err));
}

function setupCategories() {
  const categoriesContainer = document.getElementById("categories");
  if (categoriesContainer) {
    categoryBar = categoriesContainer;
  }

  const buttons = document.querySelectorAll(".controls__tabs button");
  if (!buttons.length) {
    console.warn("No category buttons found.");
    return;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const category = e.target.dataset.category || "All";
      renderBookmarks(category);
    });
  });
}

function renderBookmarks(category) {
  const container = document.getElementById("bookmarks");
  if (!container) {
    console.error("No #bookmarks container found.");
    return;
  }

  container.innerHTML = "";

  const requestedCategory =
    typeof category === "string" && category.trim() ? category : "All";
  const normalizedKey = normalizeCategoryKey(requestedCategory) || "all";

  const filtered = bookmarks.filter((bookmark) => {
    const bookmarkKey = resolveAllowedCategoryKey(
      bookmark.category || DEFAULT_CATEGORY_LABEL
    );
    return normalizedKey === "all" || bookmarkKey === normalizedKey;
  });

  const templateReady = template?.content?.firstElementChild;

  if (!templateReady) {
    filtered.forEach((bookmark) => {
      const card = document.createElement("div");
      card.className = "bookmark-card";
      card.innerHTML = `
        <img src="${bookmark.image}" alt="${bookmark.name}">
        <div class="card-body">
          <div class="card-title">${bookmark.name}</div>
          <div class="card-category">${bookmark.category}</div>
        </div>`;

      const openBookmark = () => {
        if (bookmark.url) {
          window.open(bookmark.url, "_blank", "noopener,noreferrer");
        }
      };

      card.tabIndex = 0;
      card.addEventListener("click", openBookmark);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBookmark();
        }
      });

      container.appendChild(card);
    });

    console.log(
      `Rendered ${filtered.length} bookmarks for category ${requestedCategory}`
    );
    return;
  }

  activeCategory = normalizedKey;

  if (typeof setActiveCategory === "function" && categoryBar) {
    setActiveCategory(normalizedKey);
  } else {
    renderBookmarkCollection(filtered);
  }

  console.log(
    `Rendered ${filtered.length} bookmarks for category ${requestedCategory}`
  );
}

// DATA SAFETY RULES
// 1. Never overwrite bookmarks.json.
// 2. Never reset or merge localStorage data automatically.
// 3. No defaults, samples, or preloaded datasets.
// 4. Use only data from bookmarks.json or existing localStorage.
// ABSOLUTE RULES FOR CODEX
// 1. Do not modify bookmarks.json at runtime.
// 2. Do not reset localStorage without explicit user click.
// 3. Never auto-overwrite saved user data with defaults.
// 4. You are forbidden to "helpfully" merge or clean old data.
// 5. Your only job is to PATCH functions as requested.
const FALLBACK_PALETTES = [
  { background: "#ffe9f6", accent: "#ff80c8", shadow: "#ffc3e4" },
  { background: "#e7f1ff", accent: "#92a9ff", shadow: "#cdd8ff" },
  { background: "#fff5e5", accent: "#ffba6b", shadow: "#ffe3ba" },
  { background: "#e8fff6", accent: "#6ad6a6", shadow: "#c2f7da" },
];
const CATEGORY_STORAGE_KEY = "bubblemarks.categories.v1";
const DEFAULT_CATEGORY_LABEL = "Unsorted";
const DEFAULT_CATEGORY_SLUG = "unsorted";
const CATEGORY_ALIAS_MAP = new Map([
  ["shop", "shopping"],
  ["story", "stories"],
  ["google", "tools"],
]);

const DEFAULT_CATEGORY_SETTINGS = [
  { key: "ai", label: "AI", color: "#ff80c8" },
  { key: "av", label: "AV", color: "#92a9ff" },
  { key: "games", label: "Games", color: "#b592ff" },
  { key: "shopping", label: "Shopping", color: "#ffc778" },
  { key: "stories", label: "Stories", color: "#ff9ed4" },
  { key: "tools", label: "Tools", color: "#6ad6a6" },
  { key: "work", label: "Work", color: "#ff9dbb" },
  { key: DEFAULT_CATEGORY_SLUG, label: DEFAULT_CATEGORY_LABEL, color: "#ffb0d9" },
];

const CATEGORY_LABEL_LOOKUP = new Map(
  DEFAULT_CATEGORY_SETTINGS.map((entry) => [entry.key, entry.label])
);

const ALLOWED_CATEGORY_KEYS = new Set(
  DEFAULT_CATEGORY_SETTINGS.map((entry) => entry.key)
);
const PREFERENCES_STORAGE_KEY = "bubblemarks.preferences.v1";

const DEFAULT_AXOLOTL_IMAGE = (() => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="240" height="140" viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="body" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop stop-color="#ffb9dc" offset="0%"/>
      <stop stop-color="#ffdff1" offset="100%"/>
    </linearGradient>
    <radialGradient id="belly" cx="50%" cy="45%" r="60%">
      <stop stop-color="#fff6fb" offset="0%"/>
      <stop stop-color="#ffd0ec" stop-opacity="0.85" offset="100%"/>
    </radialGradient>
  </defs>
  <g fill="none" stroke="#ff89c9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 42c10-6 18-10 26-10"/>
    <path d="M212 42c-10-6-18-10-26-10"/>
    <path d="M30 70c9 4 18 6 26 4"/>
    <path d="M210 70c-9 4-18 6-26 4"/>
  </g>
  <g>
    <path d="M60 40c-20 12-32 32-26 52s26 34 70 36c28 1 40-2 56-2 46 0 72-16 74-38s-14-46-40-58c-28-14-84-14-134 10z" fill="url(#body)" stroke="#ff89c9" stroke-width="3"/>
    <ellipse cx="118" cy="78" rx="46" ry="32" fill="url(#belly)"/>
    <g fill="#ff8fb5">
      <circle cx="88" cy="72" r="8"/>
      <circle cx="148" cy="72" r="8"/>
    </g>
    <path d="M102 94c8 10 20 10 28 0" stroke="#ff89c9" stroke-width="4" stroke-linecap="round"/>
    <g stroke="#ff89c9" stroke-width="4" stroke-linecap="round">
      <path d="M90 52c-6-12-18-18-32-18"/>
      <path d="M146 52c6-12 18-18 32-18"/>
    </g>
    <g stroke="#ffb0d9" stroke-width="4" stroke-linecap="round">
      <path d="M82 48c-8-10-20-14-34-12"/>
      <path d="M154 48c8-10 20-14 34-12"/>
    </g>
  </g>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

const prefersReducedMotion = (() => {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return {
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  };
})();
const AXOLOTL_MANIFEST_URL = "assets/axolotl/manifest.json";
const AXOLOTL_FRAME_EXTENSIONS = [
  "png",
  "webp",
  "gif",
  "PNG",
  "WEBP",
  "GIF",
];
const AXOLOTL_FRAME_PATTERNS = [
  (index, extension) =>
    `assets/axolotl/frame-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/frame${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/frame_${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/frame_${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/axolotl-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/axolotl${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/axolotl_${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/axolotl_${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/swim-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/swim${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/swim_${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/swim_${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/idle-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/idle${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/idle_${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/idle_${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/frame-(${String(index).padStart(2, "0")}).${extension}`,
  (index, extension) => `assets/axolotl/frame-(${index}).${extension}`,
  (index, extension) =>
    `assets/axolotl/frame (${String(index).padStart(2, "0")}).${extension}`,
  (index, extension) => `assets/axolotl/frame (${index}).${extension}`,
];
const AXOLOTL_SINGLE_ASSETS = [
  "assets/axolotl/axolotl.gif",
  "assets/axolotl/axolotl.png",
  "assets/axolotl/axolotl.webp",
  "assets/axolotl/swim.gif",
  "assets/axolotl/swim.png",
  "assets/axolotl/swim.webp",
  "assets/axolotl/idle.gif",
  "assets/axolotl/idle.png",
  "assets/axolotl/idle.webp",
  "assets/axolotl/floating.gif",
  "assets/axolotl/floating.png",
  "assets/axolotl/floating.webp",
  "assets/axolotl/resting.gif",
  "assets/axolotl/resting.png",
  "assets/axolotl/resting.webp",
  "assets/axolotl/swimming.gif",
  "assets/axolotl/swimming.png",
  "assets/axolotl/swimming.webp",
];
const AXOLOTL_FRAME_LIMIT = 90;
const AXOLOTL_STATE_NAMES = [
  "resting",
  "getup",
  "floating",
  "swimmode",
  "swimming",
];
const CARD_SIZE_OPTIONS = ["cozy", "comfy", "roomy"];
const AXOLOTL_STATE_FRAME_PATTERNS = [
  (state, index, extension) =>
    `assets/axolotl/${state}-${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}_${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}-${index}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}_${index}.${extension}`,
  (state, index, extension) => `assets/axolotl/${state}${index}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}-${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}_${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}-${index}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}_${index}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}${index}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${index}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/frame-${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/frame_${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/frame${String(index).padStart(2, "0")}.${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}-(${String(index).padStart(2, "0")}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state}-(${index}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state} (${String(index).padStart(2, "0")}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}/${state} (${index}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}-(${String(index).padStart(2, "0")}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state}-(${index}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state} (${String(index).padStart(2, "0")}).${extension}`,
  (state, index, extension) =>
    `assets/axolotl/${state} (${index}).${extension}`,
];

const imageProbeCache = new Map();

let activeCategory = "all";
let searchTerm = "";
let categorySettings = loadCategorySettings();
let categoryInfo = new Map();
let preferences = loadPreferences();
let axolotlInitialized = false;
let axolotlController = { enable: () => {}, disable: () => {} };
let axolotlInitPromise = null;

let grid;
let emptyState;
let keyboardContainer;
let categoryBar;
let searchInput;
let clearSearchBtn;
let datalist;
let importBtn;
let exportBtn;
let restoreBtn;
let importInput;
let template;
let addBookmarkBtn;
let bookmarkModal;
let bookmarkForm;
let bookmarkNameInput;
let bookmarkUrlInput;
let bookmarkImageInput;
let bookmarkCategorySelect;
let axolotlLayer;
let axolotlPath;
let axolotlSprite;
let axolotlFigure;
let axolotlFrameDisplay;
let heroHeading;
let settingsBtn;
let settingsModal;
let settingsForm;
let settingsDialog;
let toggleHeadingInput;
let toggleAxolotlInput;
let cardSizeInput;
let customizeCategoriesBtn;
let categoryModal;
let categoryForm;
let categorySettingsList;
let addCategoryBtn;
let categoryItemTemplate;
let paginationContainer;
let paginationPrevBtn;
let paginationNextBtn;
let lastRenderedCollection = [];
let isNotionMode = false;
let currentPage = 1;
let notionRowsPerPage = 3;
let notionRowsSelect;
const MIN_NOTION_SCALE = 0.6;
// Enforce correct Notion sizing and pagination
const NOTION_MAX_HEIGHT = 850; // Notion embed height cap
const NOTION_MAX_WIDTH = 1050; // Notion embed width cap
const NOTION_SAFE_PADDING = 24;
let notionResizeObserver;
let notionScaleFrame = null;
let notionObservedShell = null;
const getControlPanels = () =>
  Array.from(document.querySelectorAll("[data-controls-panel]"));

function replaceChildrenSafe(target, nodes) {
  if (!target) {
    return;
  }

  const list = Array.isArray(nodes)
    ? nodes.filter(Boolean)
    : Array.from(nodes || []).filter(Boolean);

  if (typeof target.replaceChildren === "function") {
    target.replaceChildren(...list);
  } else {
    target.innerHTML = "";
    list.forEach((node) => target.appendChild(node));
  }
}

function bootstrapBubblemarks() {
  grid = document.getElementById("bookmarks") || grid;
  emptyState = document.getElementById("empty-state") || emptyState;
  keyboardContainer = document.getElementById("keyboard") || keyboardContainer;
  categoryBar = document.getElementById("categories") || categoryBar;
  searchInput = document.getElementById("search") || searchInput;
  clearSearchBtn = document.getElementById("clear-search") || clearSearchBtn;
  datalist = document.getElementById("bookmark-suggestions") || datalist;
  importBtn = document.getElementById("import-btn") || importBtn;
  exportBtn = document.getElementById("export-btn") || exportBtn;
  restoreBtn = document.getElementById("restore-btn") || restoreBtn;
  importInput = document.getElementById("import-input") || importInput;
  template = document.getElementById("bookmark-card-template") || template;
  addBookmarkBtn = document.getElementById("add-bookmark") || addBookmarkBtn;
  bookmarkModal = document.getElementById("bookmark-modal") || bookmarkModal;
  bookmarkForm = document.getElementById("bookmark-form") || bookmarkForm;
  bookmarkNameInput = document.getElementById("bookmark-name") || bookmarkNameInput;
  bookmarkUrlInput = document.getElementById("bookmark-url") || bookmarkUrlInput;
  bookmarkImageInput = document.getElementById("bookmark-image") || bookmarkImageInput;
  bookmarkCategorySelect = document.getElementById("bookmark-category") || bookmarkCategorySelect;
  axolotlLayer = document.querySelector(".axolotl-layer") || axolotlLayer;
  axolotlPath = document.getElementById("axolotl-path") || axolotlPath;
  axolotlSprite = document.getElementById("axolotl-sprite") || axolotlSprite;
  axolotlFigure = document.getElementById("axolotl-figure") || axolotlFigure;
  if (axolotlFigure && !axolotlFrameDisplay) {
    axolotlFrameDisplay = createAxolotlFrameDisplay(axolotlFigure);
  }
  heroHeading = document.getElementById("app-heading") || heroHeading;
  settingsBtn = document.getElementById("settings-btn") || settingsBtn;
  settingsModal = document.getElementById("settings-modal") || settingsModal;
  settingsForm = document.getElementById("settings-form") || settingsForm;
  settingsDialog = document.querySelector(".settings-modal__dialog") || settingsDialog;
  toggleHeadingInput = document.getElementById("toggle-heading") || toggleHeadingInput;
  toggleAxolotlInput = document.getElementById("toggle-axolotl") || toggleAxolotlInput;
  cardSizeInput = document.getElementById("card-size") || cardSizeInput;
  customizeCategoriesBtn = document.getElementById("customize-categories") || customizeCategoriesBtn;
  categoryModal = document.getElementById("category-modal") || categoryModal;
  categoryForm = document.getElementById("category-form") || categoryForm;
  categorySettingsList = document.getElementById("category-settings-list") || categorySettingsList;
  addCategoryBtn = document.getElementById("add-category") || addCategoryBtn;
  categoryItemTemplate = document.getElementById("category-item-template") || categoryItemTemplate;

  if (!grid) console.error("Missing #bookmarks element in DOM");
  if (!keyboardContainer) console.error("Missing #keyboard element in DOM");

  ensurePaginationControls();

  preferences = loadPreferences();
  applyPreferences({ syncInputs: false, lazyAxolotl: true });

  setupSearch();
  setupDataTools();
  setupCategoryCustomization();
  setupBookmarkCreation();

  applyPreferences({ lazyAxolotl: true });

  if (preferences.showAxolotl !== false) {
    ensureAxolotlInitialized();
  } else if (axolotlLayer) {
    axolotlLayer.hidden = true;
  }

  setupControlTabs();
  setupKeyboard();
  setupSettingsMenu();
}


async function hydrateData() {
  try {
    // Try to load existing localStorage data first
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setBookmarks(sanitizeBookmarks(parsed));
      console.log("Loaded bookmarks from localStorage");
      return;
    }

    // If no localStorage data, load from bookmarks.json
    const response = await fetch("bookmarks.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load bookmarks.json");

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid bookmarks.json format");

    setBookmarks(sanitizeBookmarks(data));

    // Save the fetched version for next time
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("Loaded bookmarks from bookmarks.json");
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    renderBookmarkCollection([]); // Do not inject defaults
  }
}

function setupControlTabs() {
  const buttons = Array.from(document.querySelectorAll("[data-controls-tab]"));
  const panels = getControlPanels();

  if (!buttons.length || !panels.length) return;

  const activateControlTab = (name, focus = false) => {
    panels.forEach((panel) => {
      const isActive = panel.dataset.controlsPanel === name;
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    buttons.forEach((button) => {
      const isActive = button.dataset.controlsTab === name;
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.setAttribute("tabindex", isActive ? "0" : "-1");
      button.classList.toggle("controls__tab--active", isActive);

      if (isActive && focus) {
        button.focus();
      }
    });

    if (name === "keyboard") {
      const searchInput = document.getElementById("search");
      if (searchInput) {
        window.requestAnimationFrame(() => {
          searchInput.focus();
        });
      }
    }
  };

  const focusTabAtIndex = (index) => {
    const button = buttons[index];
    if (!button) return;
    activateControlTab(button.dataset.controlsTab, true);
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      activateControlTab(button.dataset.controlsTab);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + direction + buttons.length) % buttons.length;
        focusTabAtIndex(nextIndex);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusTabAtIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusTabAtIndex(buttons.length - 1);
      }
    });
  });

  const defaultTab = buttons.find((button) => button.dataset.controlsTab === "bookmarks");
  const initial = defaultTab || buttons[0];
  if (initial) {
    activateControlTab(initial.dataset.controlsTab);
  }
}

function bindStaticCategoryButtons() {
  const buttons = Array.from(
    document.querySelectorAll(".controls__tabs button[data-category]")
  );

  if (!buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const target = event.currentTarget;
      const rawCategory = target.dataset.category || "All";
      renderBookmarks(rawCategory);
    });
  });
}

function findAllowedCategoryKeyByLabel(label) {
  if (typeof label !== "string") {
    return "";
  }

  const trimmed = label.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  const match = categorySettings.find((entry) => {
    const candidate = entry?.label ? String(entry.label).trim().toLowerCase() : "";
    return candidate === trimmed;
  });

  if (match && ALLOWED_CATEGORY_KEYS.has(match.key)) {
    return match.key;
  }

  return "";
}

function resolveAllowedCategoryKey(value) {
  if (typeof value !== "string") {
    return DEFAULT_CATEGORY_SLUG;
  }

  const normalized = normalizeCategoryKey(value);
  if (!normalized) {
    return DEFAULT_CATEGORY_SLUG;
  }

  const alias = CATEGORY_ALIAS_MAP.get(normalized);
  const candidate = alias || normalized;
  if (ALLOWED_CATEGORY_KEYS.has(candidate)) {
    return candidate;
  }

  const fromLabel = findAllowedCategoryKeyByLabel(value);
  if (fromLabel) {
    return fromLabel;
  }

  return DEFAULT_CATEGORY_SLUG;
}

function coerceCategoryLabel(value) {
  const key = resolveAllowedCategoryKey(value);
  return CATEGORY_LABEL_LOOKUP.get(key) || DEFAULT_CATEGORY_LABEL;
}

function sanitizeBookmarks(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => ({
      name: String(entry.name ?? "Untitled").trim(),
      url: String(entry.url ?? "").trim(),
      category: coerceCategoryLabel(entry.category),
      image: entry.image ? String(entry.image).trim() : "",
    }))
    .filter((entry) => entry.name && entry.url);
}

function getDefaultCategorySettings() {
  return DEFAULT_CATEGORY_SETTINGS.map((entry) => ({
    key: entry.key,
    label: entry.label,
    color: entry.color,
    isExtra: entry.isExtra ?? false,
  }));
}

function mergeCategorySettingsWithDefaults(current) {
  const defaults = getDefaultCategorySettings();
  const normalizedCurrent = Array.isArray(current)
    ? current
        .map((entry) => normalizeCategorySetting(entry))
        .filter(Boolean)
    : [];

  const currentMap = new Map(normalizedCurrent.map((entry) => [entry.key, entry]));
  const defaultKeys = new Set(defaults.map((entry) => entry.key));
  const merged = defaults.map((entry) => {
    const existing = currentMap.get(entry.key);
    if (!existing) {
      return { ...entry };
    }

    const existingLabel = typeof existing.label === "string" ? existing.label.trim() : "";

    return {
      key: entry.key,
      label: existingLabel || entry.label,
      color: ensureHexColor(existing.color) || entry.color,
      isExtra: false,
    };
  });

  normalizedCurrent.forEach((entry) => {
    if (!defaultKeys.has(entry.key)) {
      const existingLabel = typeof entry.label === "string" ? entry.label.trim() : "";

      merged.push({
        key: entry.key,
        label: existingLabel || prettifyCategoryKey(entry.key),
        color: ensureHexColor(entry.color) || pickCategoryColor(entry.key),
        isExtra: Boolean(entry.isExtra),
      });
    }
  });

  return merged;
}

function loadCategorySettings() {
  const defaults = getDefaultCategorySettings();

  if (typeof localStorage === "undefined") {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const deduped = [];
    const seen = new Set();

    parsed.forEach((entry) => {
      const normalized = normalizeCategorySetting(entry);
      if (!normalized || seen.has(normalized.key)) {
        return;
      }
      seen.add(normalized.key);
      deduped.push(normalized);
    });

    if (!deduped.length) {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const merged = mergeCategorySettingsWithDefaults(deduped);
    if (typeof localStorage !== "undefined") {
      const stored = JSON.stringify(deduped);
      const desired = JSON.stringify(merged);
      if (stored !== desired) {
        localStorage.setItem(CATEGORY_STORAGE_KEY, desired);
      }
    }

    return merged;
  } catch (error) {
    console.warn("Unable to load category settings", error);
    return defaults;
  }
}

function saveCategorySettings() {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categorySettings));
  } catch (error) {
    console.warn("Unable to save category preferences", error);
  }
}

function resetCategorySettingsToDefaults() {
  categorySettings = getDefaultCategorySettings();
  saveCategorySettings();
  updateCategoryBar();
  applyFilters();

  if (categoryModal && !categoryModal.hidden) {
    renderCategorySettingsEditor();
  }
}

function normalizeCardSize(value) {
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (CARD_SIZE_OPTIONS.includes(trimmed)) {
      return trimmed;
    }
  }
  return "comfy";
}

function cardSizeToIndex(size) {
  const index = CARD_SIZE_OPTIONS.indexOf(size);
  return index >= 0 ? index : CARD_SIZE_OPTIONS.indexOf("comfy");
}

function indexToCardSize(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "comfy";
  }
  return CARD_SIZE_OPTIONS[numeric] || "comfy";
}

function getDefaultPreferences() {
  return {
    showHeading: true,
    showAxolotl: true,
    cardSize: "comfy",
  };
}

function normalizePreferences(value) {
  const defaults = getDefaultPreferences();
  if (!value || typeof value !== "object") {
    return { ...defaults };
  }

  return {
    showHeading: value.showHeading !== false,
    showAxolotl: value.showAxolotl !== false,
    cardSize: normalizeCardSize(value.cardSize),
  };
}

function loadPreferences() {
  if (typeof localStorage === "undefined") {
    return getDefaultPreferences();
  }

  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return getDefaultPreferences();
    }
    const parsed = JSON.parse(raw);
    return normalizePreferences(parsed);
  } catch (error) {
    console.warn("Unable to load preferences", error);
    return getDefaultPreferences();
  }
}

function savePreferences() {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn("Unable to save preferences", error);
  }
}

function normalizeCategorySetting(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const key = resolveAllowedCategoryKey(entry.key);
  if (!ALLOWED_CATEGORY_KEYS.has(key)) {
    return null;
  }

  const label = typeof entry.label === "string" ? entry.label.trim() : "";
  const color = ensureHexColor(entry.color);

  return { key, label, color, isExtra: false };
}

function ensureHexColor(value) {
  if (typeof value !== "string") {
    return "";
  }

  let trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    trimmed = `#${trimmed.slice(1).split("").map((char) => char + char).join("")}`;
  }

  if (/^[0-9a-f]{6}$/i.test(trimmed)) {
    trimmed = `#${trimmed}`;
  }

  if (!/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return "";
  }

  return trimmed.toLowerCase();
}

function normalizeCategoryKey(name) {
  if (typeof name !== "string") {
    return "";
  }

  const base = name.trim().toLowerCase();
  if (!base) {
    return "";
  }

  const slug = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || DEFAULT_CATEGORY_SLUG;
}

function prettifyCategoryKey(key) {
  if (!key) {
    return DEFAULT_CATEGORY_LABEL;
  }

  return key
    .split(/[-_]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ") || DEFAULT_CATEGORY_LABEL;
}

function findCategorySetting(key) {
  return categorySettings.find((setting) => setting.key === key) || null;
}

function getCategoryLabel(key, fallback = DEFAULT_CATEGORY_LABEL) {
  const setting = findCategorySetting(key);
  if (setting && setting.label) {
    return setting.label;
  }
  const info = categoryInfo.get(key);
  if (info?.originalLabel) {
    return info.originalLabel;
  }
  if (fallback) {
    return fallback;
  }
  return prettifyCategoryKey(key);
}

function getCategoryColor(key) {
  const setting = findCategorySetting(key);
  const color = ensureHexColor(setting?.color);
  if (color) {
    return color;
  }
  return pickCategoryColor(key);
}

function pickCategoryColor(seed) {
  const palette = pickFallbackPalette(seed || "category");
  return palette.accent || "#ff99da";
}

function generateCategoryKey(label, existingKeys) {
  const existing = new Set(existingKeys ?? []);
  existing.add("all");
  let base = normalizeCategoryKey(label);
  if (!base) {
    base = "category";
  }

  let candidate = base;
  let counter = 2;
  while (!candidate || existing.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  existing.add(candidate);
  return candidate;
}

function collectCategoryInfo() {
  const info = new Map();

  bookmarks.forEach((bookmark) => {
    const raw = bookmark.category || DEFAULT_CATEGORY_LABEL;
    const key = resolveAllowedCategoryKey(raw);
    const label = coerceCategoryLabel(raw);
    if (!info.has(key)) {
      info.set(key, {
        key,
        originalLabel: label,
      });
    }
  });

  if (!info.has(DEFAULT_CATEGORY_SLUG)) {
    info.set(DEFAULT_CATEGORY_SLUG, {
      key: DEFAULT_CATEGORY_SLUG,
      originalLabel: DEFAULT_CATEGORY_LABEL,
    });
  }

  return info;
}

function computeCategoryDescriptors() {
  const info = collectCategoryInfo();
  categoryInfo = info;

  const sanitized = [];
  const seenKeys = new Set();
  let mutated = false;

  categorySettings.forEach((entry) => {
    const normalized = normalizeCategorySetting(entry);
    if (!normalized || seenKeys.has(normalized.key)) {
      mutated = true;
      return;
    }
    seenKeys.add(normalized.key);
    sanitized.push({ ...normalized });
  });

  const descriptors = [];
  const used = new Set();

  sanitized.forEach((entry) => {
    const details = info.get(entry.key);
    const color = ensureHexColor(entry.color) || pickCategoryColor(entry.key);
    const label = entry.label || details?.originalLabel || prettifyCategoryKey(entry.key);
    const isExtra = entry.isExtra || !details;
    descriptors.push({
      key: entry.key,
      label,
      color,
      isExtra,
      originalLabel: details?.originalLabel || null,
    });

    if (entry.label !== label || entry.color !== color || entry.isExtra !== isExtra) {
      entry.label = label;
      entry.color = color;
      entry.isExtra = isExtra;
      mutated = true;
    }

    used.add(entry.key);
  });

  info.forEach((details, key) => {
    if (used.has(key)) {
      return;
    }
    const color = pickCategoryColor(key);
    descriptors.push({
      key,
      label: details.originalLabel,
      color,
      isExtra: false,
      originalLabel: details.originalLabel,
    });
    sanitized.push({ key, label: details.originalLabel, color, isExtra: false });
    mutated = true;
  });

  categorySettings = sanitized;

  if (mutated) {
    saveCategorySettings();
  }

  return descriptors;
}

function applyCategoryStylesToPill(pill, color) {
  const base = parseHexColor(color) || parseHexColor(pickCategoryColor(pill.dataset.category));
  if (!base) {
    return;
  }
  const soft = toRgba(mixWithWhite(base, 0.75), 0.45);
  const border = toRgba(mixWithWhite(base, 0.55), 0.7);
  const strongStart = toRgba(mixWithWhite(base, 0.1), 0.95);
  const strongEnd = toRgba(mixWithWhite(base, 0.4), 0.95);
  const shadow = toRgba(mixWithBlack(base, 0.35), 0.35);
  const shadowStrong = toRgba(mixWithBlack(base, 0.2), 0.45);
  const contrast = getContrastColor(rgbToHex(mixWithWhite(base, 0.15)));
  const quiet = toRgba(mixWithBlack(base, 0.5), 0.72);

  pill.style.setProperty("--category-color-soft", soft);
  pill.style.setProperty("--category-color-border", border);
  pill.style.setProperty(
    "--category-color-strong",
    `linear-gradient(135deg, ${strongStart}, ${strongEnd})`
  );
  pill.style.setProperty("--category-color-contrast", contrast);
  pill.style.setProperty("--category-color-shadow", shadow);
  pill.style.setProperty("--category-color-shadow-strong", shadowStrong);
  pill.style.setProperty("--category-color-text", quiet);
}

function applyCategoryStylesToBadge(element, color) {
  const base = parseHexColor(color);
  if (!base) {
    return;
  }
  const background = toRgba(mixWithWhite(base, 0.35), 0.88);
  const border = toRgba(mixWithWhite(base, 0.18), 0.94);
  const textColor = getContrastColor(rgbToHex(mixWithWhite(base, 0.05)));

  element.style.setProperty("--category-chip-bg", background);
  element.style.setProperty("--category-chip-border", border);
  element.style.setProperty("--category-chip-text", textColor);
}

function mixWithWhite(rgb, amount) {
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * amount),
    g: Math.round(rgb.g + (255 - rgb.g) * amount),
    b: Math.round(rgb.b + (255 - rgb.b) * amount),
  };
}

function mixWithBlack(rgb, amount) {
  return {
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  };
}

function toRgba(rgb, alpha = 1) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(Math.max(alpha, 0), 1)})`;
}

function parseHexColor(hex) {
  if (typeof hex !== "string") {
    return null;
  }
  const normalized = ensureHexColor(hex);
  if (!normalized) {
    return null;
  }
  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(rgb) {
  const clamp = (channel) => Math.min(255, Math.max(0, Math.round(channel)));
  return `#${clamp(rgb.r).toString(16).padStart(2, "0")}${clamp(rgb.g)
    .toString(16)
    .padStart(2, "0")}${clamp(rgb.b).toString(16).padStart(2, "0")}`;
}

function getContrastColor(hex) {
  const rgb = parseHexColor(hex);
  if (!rgb) {
    return "#2b1f33";
  }
  const luminance =
    0.2126 * srgbComponent(rgb.r) + 0.7152 * srgbComponent(rgb.g) + 0.0722 * srgbComponent(rgb.b);
  return luminance > 0.6 ? "#2b1f33" : "#ffffff";
}

function srgbComponent(value) {
  const channel = value / 255;
  if (channel <= 0.03928) {
    return channel / 12.92;
  }
  return ((channel + 0.055) / 1.055) ** 2.4;
}

function setupBookmarkCreation() {
  if (!addBookmarkBtn || !bookmarkModal || !bookmarkForm) {
    return;
  }

  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const getFocusableElements = () =>
    Array.from(bookmarkModal.querySelectorAll(focusableSelector)).filter((element) => {
      if (element.hasAttribute("hidden")) return false;
      if (element.getAttribute("aria-hidden") === "true") return false;
      if (element.tabIndex < 0) return false;
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") {
        return false;
      }
      return true;
    });

  const closeBookmarkModal = ({ restoreFocus = true } = {}) => {
    bookmarkModal.hidden = true;
    document.body.classList.remove("modal-open");
    bookmarkForm.reset();
    if (restoreFocus) {
      window.setTimeout(() => {
        addBookmarkBtn?.focus();
      }, 20);
    }
  };

  const openBookmarkModal = () => {
    bookmarkForm.reset();
    const preferredKey = activeCategory !== "all" ? activeCategory : bookmarkCategorySelect?.value;
    renderBookmarkCategoryOptions(preferredKey);
    bookmarkModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      bookmarkNameInput?.focus({ preventScroll: true });
    }, 20);
  };

  addBookmarkBtn.addEventListener("click", () => {
    openBookmarkModal();
  });

  bookmarkModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.dataset && target.dataset.bookmarkDismiss === "true") {
      closeBookmarkModal();
    }
  });

  bookmarkModal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeBookmarkModal();
      return;
    }

    if (event.key === "Tab") {
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first || !bookmarkModal.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  bookmarkForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(bookmarkForm);
    const nameValue = String(formData.get("name") ?? "").trim();
    const urlValue = String(formData.get("url") ?? "").trim();
    const imageValue = String(formData.get("image") ?? "").trim();
    const categoryKey = normalizeCategoryKey(String(formData.get("category") ?? DEFAULT_CATEGORY_SLUG));

    const categoryLabel = getCategoryLabel(
      categoryKey,
      prettifyCategoryKey(categoryKey || DEFAULT_CATEGORY_SLUG)
    );

    const sanitized = sanitizeBookmarks([
      {
        name: nameValue,
        url: urlValue,
        category: categoryLabel,
        image: imageValue,
      },
    ]);

    if (!sanitized.length) {
      alert("Please add a name and link so we can save your bookmark.");
      return;
    }

    const [bookmark] = sanitized;
    const nextCategoryKey = categoryKey || DEFAULT_CATEGORY_SLUG;
    setBookmarks([bookmark, ...bookmarks], { persist: true });
    setActiveCategory(nextCategoryKey);
    closeBookmarkModal({ restoreFocus: false });
    window.requestAnimationFrame(() => {
      const firstCard = grid?.querySelector(".card");
      if (firstCard) {
        firstCard.focus();
      }
    });
  });
}

function setupCategoryCustomization() {
  if (!customizeCategoriesBtn || !categoryModal || !categoryForm || !categorySettingsList) {
    return;
  }

  customizeCategoriesBtn.addEventListener("click", () => {
    openCategoryModal();
  });

  categoryModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.dataset && target.dataset.modalDismiss === "true") {
      closeCategoryModal();
    }
  });

  categoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleCategoryFormSubmit();
  });

  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      addNewCategoryRow();
    });
  }

  categorySettingsList.addEventListener("click", handleCategoryListClick);
  document.addEventListener("keydown", handleCategoryModalKeydown);
}

function openCategoryModal() {
  renderCategorySettingsEditor();
  categoryModal.hidden = false;
  document.body.classList.add("modal-open");
  const firstInput = categorySettingsList.querySelector('input[name="label"]');
  if (firstInput) {
    window.setTimeout(() => firstInput.focus(), 20);
  }
}

function closeCategoryModal() {
  categoryModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function handleCategoryModalKeydown(event) {
  if (event.key === "Escape" && !categoryModal.hidden) {
    event.preventDefault();
    closeCategoryModal();
  }
}

  function renderCategorySettingsEditor() {
    if (!categorySettingsList) {
      return;
    }
    const descriptors = computeCategoryDescriptors();
    const rows = descriptors.map((descriptor) => createCategorySettingRow(descriptor));
    replaceChildrenSafe(categorySettingsList, rows);
  }

function createCategorySettingRow(descriptor) {
  const node = categoryItemTemplate?.content?.firstElementChild
    ? categoryItemTemplate.content.firstElementChild.cloneNode(true)
    : document.createElement("div");

  if (!node.classList.contains("category-setting")) {
    node.className = "category-setting";
    node.innerHTML =
      '<div class="category-setting__inputs">\n        <label class="category-setting__label">\n          <span>Name</span>\n          <input type="text" name="label" required />\n        </label>\n        <label class="category-setting__color">\n          <span>Color</span>\n          <input type="color" name="color" value="#ff80c8" />\n        </label>\n      </div>\n      <div class="category-setting__actions">\n        <button type="button" class="category-setting__move" data-direction="up" aria-label="Move up">▲</button>\n        <button type="button" class="category-setting__move" data-direction="down" aria-label="Move down">▼</button>\n        <button type="button" class="category-setting__remove" aria-label="Remove category">Remove</button>\n      </div>';
  }

  node.dataset.categoryKey = descriptor.key || "";

  const labelInput = node.querySelector('input[name="label"]');
  const colorInput = node.querySelector('input[name="color"]');
  const removeBtn = node.querySelector(".category-setting__remove");

  if (labelInput) {
    labelInput.value = descriptor.label || "";
    labelInput.placeholder = descriptor.originalLabel || descriptor.label || "Category";
  }

  if (colorInput) {
    colorInput.value = ensureHexColor(descriptor.color) || pickCategoryColor(descriptor.key || "custom");
  }

  if (descriptor.isExtra) {
    node.dataset.extra = "true";
    if (removeBtn) {
      removeBtn.disabled = false;
      removeBtn.removeAttribute("aria-hidden");
      removeBtn.tabIndex = 0;
      removeBtn.style.display = "";
    }
  } else {
    node.dataset.fixed = "true";
    if (removeBtn) {
      removeBtn.disabled = true;
      removeBtn.setAttribute("aria-hidden", "true");
      removeBtn.tabIndex = -1;
      removeBtn.style.display = "none";
    }
  }

  return node;
}

function handleCategoryListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const setting = target.closest(".category-setting");
  if (!setting) {
    return;
  }

  if (target.classList.contains("category-setting__remove")) {
    if (setting.dataset.extra === "true") {
      setting.remove();
    }
    return;
  }

  if (target.classList.contains("category-setting__move")) {
    const direction = target.dataset.direction;
    if (direction === "up" && setting.previousElementSibling) {
      categorySettingsList.insertBefore(setting, setting.previousElementSibling);
    } else if (direction === "down" && setting.nextElementSibling) {
      categorySettingsList.insertBefore(setting.nextElementSibling, setting);
    }
  }
}

function addNewCategoryRow() {
  const descriptor = {
    key: "",
    label: "",
    color: pickCategoryColor(`custom-${Date.now()}`),
    isExtra: true,
    originalLabel: "",
  };

  const node = createCategorySettingRow(descriptor);
  node.dataset.new = "true";
  categorySettingsList.appendChild(node);

  const labelInput = node.querySelector('input[name="label"]');
  if (labelInput) {
    window.setTimeout(() => {
      labelInput.focus();
      labelInput.select();
    }, 20);
  }
}

function handleCategoryFormSubmit() {
  const rows = Array.from(categorySettingsList.querySelectorAll(".category-setting"));
  if (!rows.length) {
    categorySettings = [];
    saveCategorySettings();
    updateCategoryBar();
    applyFilters();
    closeCategoryModal();
    return;
  }

  const nextSettings = [];
  const existingKeys = new Set();

  rows.forEach((row, index) => {
    const labelInput = row.querySelector('input[name="label"]');
    const colorInput = row.querySelector('input[name="color"]');
    const isExtra = row.dataset.extra === "true";
    const labelValue = labelInput?.value.trim() || `Category ${index + 1}`;
    let key = row.dataset.categoryKey;

    if (!key || isExtra) {
      key = generateCategoryKey(labelValue, existingKeys);
      row.dataset.categoryKey = key;
    }

    existingKeys.add(key);
    const color = ensureHexColor(colorInput?.value) || pickCategoryColor(key);

    nextSettings.push({
      key,
      label: labelValue,
      color,
      isExtra,
    });
  });

  categorySettings = nextSettings;
  saveCategorySettings();
  updateCategoryBar();
  applyFilters();
  closeCategoryModal();
}

function setBookmarks(next, { persist } = { persist: true }) {
  bookmarks = sanitizeBookmarks(next);
  categoryInfo = collectCategoryInfo();
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.warn("Unable to save bookmarks", error);
    }
  }
  updateCategoryBar();
  updateSuggestions();
  if (searchTerm.trim() || activeCategory !== "all") {
    applyFilters();
  } else {
    renderBookmarkCollection(bookmarks);
  }
}

function setupSearch() {
  if (!searchInput || !clearSearchBtn || !datalist) {
    console.error("Search UI is missing required elements");
    return;
  }

  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    applyFilters();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchTerm = "";
    searchInput.value = "";
    applyFilters();
    searchInput.focus();
  });
}

function applyPreferences({ syncInputs = true, lazyAxolotl = false } = {}) {
  const showHeading = preferences.showHeading !== false;
  const showAxolotl = preferences.showAxolotl !== false;
  const cardSize = normalizeCardSize(preferences.cardSize);

  preferences.cardSize = cardSize;

  if (heroHeading) {
    heroHeading.hidden = !showHeading;
  }

  if (syncInputs) {
    if (toggleHeadingInput) {
      toggleHeadingInput.checked = showHeading;
    }
    if (toggleAxolotlInput) {
      toggleAxolotlInput.checked = showAxolotl;
    }
    if (cardSizeInput) {
      cardSizeInput.value = String(cardSizeToIndex(cardSize));
    }
  }

  if (axolotlLayer) {
    axolotlLayer.hidden = !showAxolotl;
  }

  if (document.body) {
    document.body.setAttribute("data-card-size", cardSize);
  }

  if (showAxolotl) {
    if (!lazyAxolotl) {
      ensureAxolotlInitialized();
    }
  } else {
    axolotlController?.disable?.();
  }

  if (isNotionMode && lastRenderedCollection.length) {
    renderBookmarkCollection(lastRenderedCollection, { maintainPage: true });
  }
}

function ensureAxolotlInitialized() {
  if (preferences.showAxolotl === false) {
    axolotlController?.disable?.();
    return;
  }

  if (axolotlInitialized) {
    axolotlController?.enable?.();
    return;
  }

  return initAxolotlMascot();
}

function setupKeyboard() {
  const container = keyboardContainer || document.getElementById("keyboard");
  if (!container) {
    console.error("Cannot set up on-screen keyboard without #keyboard element");
    return;
  }

  const buttons = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];

  container.innerHTML = "";

  function playKeySound(keyLabel) {
    const upper = keyLabel.toUpperCase();
    const file =
      /^[A-Z]$/.test(upper) ? `sounds/${upper}.mp3` : "sounds/allothers.mp3";
    const audio = new Audio(file);
    audio.volume = 0.3; // soft, subtle click
    audio.currentTime = 0;
    audio.play().catch(() => {}); // prevent errors if user hasn’t interacted yet
  }

  buttons.forEach((char) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key-btn";
    button.textContent = char;
    button.setAttribute("aria-label", `Type ${char}`);
    button.addEventListener("click", () => {
      const search = searchInput || document.getElementById("search");
      if (!search) return;
      search.value += char;
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.focus({ preventScroll: true });
      playKeySound(char);
    });
    container.appendChild(button);
  });
}

function ensureNotionToggleHost() {
  const existing = document.getElementById("settings");
  if (existing) {
    return existing;
  }

  if (!settingsForm) {
    return null;
  }

  const displaySection = settingsForm.querySelector(".settings-section");
  if (!displaySection) {
    return null;
  }

  const host = document.createElement("div");
  host.id = "settings";
  host.className = "settings-extra";
  displaySection.appendChild(host);
  return host;
}

function setupNotionMode() {
  const host = ensureNotionToggleHost();
  if (!host) {
    return;
  }

  host.querySelectorAll(".notion-controls").forEach((node) => node.remove());

  const wrapper = document.createElement("div");
  wrapper.className = "notion-controls";

  const notionToggle = document.createElement("button");
  notionToggle.type = "button";
  notionToggle.textContent = "Notion Mode";
  notionToggle.classList.add("notion-toggle", "soft-btn", "soft-btn--ghost");
  notionToggle.setAttribute("aria-pressed", "false");

  notionToggle.addEventListener("click", () => {
    const nextState = !isNotionMode;
    isNotionMode = nextState;
    notionToggle.setAttribute("aria-pressed", nextState ? "true" : "false");
    if (notionRowsSelect) {
      notionRowsSelect.disabled = !nextState;
    }
    currentPage = 1;
    if (nextState) {
      enableNotionMode();
    } else {
      disableNotionMode();
      hidePaginationControls();
    }
    const target = lastRenderedCollection.length ? lastRenderedCollection : bookmarks;
    renderBookmarkCollection(target);
  });

  const rowsLabel = document.createElement("label");
  rowsLabel.className = "notion-rows";

  const rowsText = document.createElement("span");
  rowsText.textContent = "Rows per page";

  notionRowsSelect = document.createElement("select");
  notionRowsSelect.className = "notion-rows__select";
  [2, 3].forEach((count) => {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = String(count);
    notionRowsSelect.appendChild(option);
  });
  notionRowsSelect.value = String(notionRowsPerPage);
  notionRowsSelect.disabled = !isNotionMode;
  notionRowsSelect.addEventListener("change", (event) => {
    const value = parseInt(event.target.value, 10);
    notionRowsPerPage = Number.isFinite(value) && value > 0 ? value : notionRowsPerPage;
    currentPage = 1;
    if (isNotionMode) {
      renderBookmarkCollection(lastRenderedCollection);
    }
  });

  rowsLabel.append(rowsText, notionRowsSelect);

  if (document.body.classList.contains("notion-mode")) {
    isNotionMode = true;
    notionToggle.setAttribute("aria-pressed", "true");
    notionRowsSelect.disabled = false;
    enableNotionMode();
  }

  wrapper.append(notionToggle, rowsLabel);
  host.appendChild(wrapper);
}

function getAppShell() {
  return document.querySelector(".app-shell");
}

function enableNotionMode() {
  document.documentElement.classList.add("notion-mode");
  document.body.classList.add("notion-mode");
}

function disableNotionMode() {
  document.documentElement.classList.remove("notion-mode");
  document.body.classList.remove("notion-mode");
  const shell = getAppShell();
  if (shell) {
    shell.style.removeProperty("width");
    shell.style.removeProperty("height");
    shell.style.removeProperty("margin");
    shell.style.removeProperty("overflow");
    shell.style.removeProperty("max-width");
    shell.style.removeProperty("max-height");
    shell.style.removeProperty("transform");
    shell.style.removeProperty("transform-origin");
  }
}

function setupSettingsMenu() {
  if (typeof window === "undefined" || !settingsBtn || !settingsModal) {
    return;
  }

  settingsBtn.setAttribute("aria-expanded", "false");

  const focusableSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const getFocusableElements = () =>
    Array.from(settingsModal.querySelectorAll(focusableSelector)).filter((element) => {
      if (element.hasAttribute("hidden")) return false;
      if (element.getAttribute("aria-hidden") === "true") return false;
      if (element.tabIndex < 0) return false;
      const style = window.getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") {
        return false;
      }
      return true;
    });

  const openSettings = () => {
    applyPreferences({ lazyAxolotl: true });
    settingsModal.hidden = false;
    settingsBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length) {
        focusable[0].focus();
      } else if (settingsDialog) {
        settingsDialog.focus({ preventScroll: true });
      }
    }, 20);
  };

  const closeSettings = () => {
    settingsModal.hidden = true;
    settingsBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      settingsBtn.focus();
    }, 20);
  };

  settingsBtn.addEventListener("click", () => {
    if (settingsModal.hidden) {
      openSettings();
    } else {
      closeSettings();
    }
  });

  settingsModal.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.dataset && target.dataset.settingsDismiss === "true") {
      closeSettings();
    }
  });

  settingsModal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSettings();
      return;
    }

    if (event.key === "Tab") {
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first || !settingsModal.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  if (settingsForm) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  }

  if (toggleHeadingInput) {
    toggleHeadingInput.addEventListener("change", (event) => {
      preferences.showHeading = event.target.checked;
      savePreferences();
      applyPreferences({ syncInputs: false });
    });
  }

  if (toggleAxolotlInput) {
    toggleAxolotlInput.addEventListener("change", (event) => {
      preferences.showAxolotl = event.target.checked;
      savePreferences();
      applyPreferences({ syncInputs: false });
    });
  }

  if (cardSizeInput) {
    cardSizeInput.addEventListener("input", (event) => {
      const nextSize = indexToCardSize(event.target.value);
      preferences.cardSize = nextSize;
      savePreferences();
      applyPreferences({ syncInputs: false });
    });
  }

  setupNotionMode();
}

function handleVirtualKey(key) {
  const cursorPosition = searchInput.selectionStart ?? searchInput.value.length;
  const value = searchInput.value;

  switch (key) {
    case "backspace": {
      const nextValue = value.slice(0, Math.max(cursorPosition - 1, 0)) + value.slice(cursorPosition);
      updateSearchValue(nextValue, Math.max(cursorPosition - 1, 0));
      break;
    }
    case "clear": {
      updateSearchValue("", 0);
      break;
    }
    case "space": {
      const nextValue = value.slice(0, cursorPosition) + " " + value.slice(cursorPosition);
      updateSearchValue(nextValue, cursorPosition + 1);
      break;
    }
    default: {
      const nextValue = value.slice(0, cursorPosition) + key + value.slice(cursorPosition);
      updateSearchValue(nextValue, cursorPosition + key.length);
    }
  }
}

function updateSearchValue(nextValue, caretPosition) {
  searchInput.value = nextValue;
  searchTerm = nextValue;
  requestAnimationFrame(() => {
    searchInput.setSelectionRange(caretPosition, caretPosition);
  });
  applyFilters();
}

  function renderBookmarkCategoryOptions(preferredKey, descriptors) {
    if (!bookmarkCategorySelect) {
      return;
    }

    const options = Array.isArray(descriptors) ? descriptors : computeCategoryDescriptors();

    const optionNodes = options.map((descriptor) => {
      const option = document.createElement("option");
      option.value = descriptor.key;
      option.textContent = descriptor.label;
      return option;
    });

    if (!optionNodes.length) {
      const fallbackOption = document.createElement("option");
      fallbackOption.value = DEFAULT_CATEGORY_SLUG;
      fallbackOption.textContent = DEFAULT_CATEGORY_LABEL;
      replaceChildrenSafe(bookmarkCategorySelect, [fallbackOption]);
      bookmarkCategorySelect.value = DEFAULT_CATEGORY_SLUG;
      return;
    }

    replaceChildrenSafe(bookmarkCategorySelect, optionNodes);

    const existingValues = Array.from(bookmarkCategorySelect.options).map((option) => option.value);
    const normalizedPreferred = normalizeCategoryKey(preferredKey || "");
    let selection = existingValues[0];

  if (normalizedPreferred && existingValues.includes(normalizedPreferred)) {
    selection = normalizedPreferred;
  } else if (activeCategory !== "all" && existingValues.includes(activeCategory)) {
    selection = activeCategory;
  }

  bookmarkCategorySelect.value = selection;
}

function updateCategoryBar() {
  if (!categoryBar) {
    console.error("Cannot render categories without #categories element");
    return;
  }

  const descriptors = computeCategoryDescriptors();
  const availableKeys = new Set(descriptors.map((descriptor) => descriptor.key));

    if (activeCategory !== "all" && !availableKeys.has(activeCategory)) {
      activeCategory = "all";
    }

    const allDescriptor = {
      key: "all",
      label: "All",
      color: pickCategoryColor("all"),
    };

    const pills = [createCategoryPill(allDescriptor), ...descriptors.map((descriptor) => createCategoryPill(descriptor))];
    replaceChildrenSafe(categoryBar, pills);
    syncActiveCategoryVisuals();
    renderBookmarkCategoryOptions(bookmarkCategorySelect?.value || activeCategory, descriptors);
  }

function createCategoryPill(descriptor) {
  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = "filter-pill";
  pill.dataset.category = descriptor.key;
  pill.textContent = descriptor.label;
  applyCategoryStylesToPill(pill, descriptor.color);
  pill.addEventListener("click", () => {
    setActiveCategory(descriptor.key);
  });
  return pill;
}

function setActiveCategory(nextKey) {
  activeCategory = nextKey;
  syncActiveCategoryVisuals();
  applyFilters();
}

function syncActiveCategoryVisuals() {
  const pills = categoryBar.querySelectorAll(".filter-pill");
  pills.forEach((pill) => {
    const key = pill.dataset.category;
    const isActive = key === activeCategory || (activeCategory === "all" && key === "all");
    pill.classList.toggle("active", isActive);
    pill.setAttribute("aria-pressed", String(isActive));
  });
}

  function updateSuggestions() {
    if (!datalist) {
      return;
    }

    const options = bookmarks.map((bookmark) => {
      const option = document.createElement("option");
      option.value = bookmark.name;
      return option;
    });

    replaceChildrenSafe(datalist, options);
  }

  function applyFilters() {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = bookmarks.filter((bookmark) => {
    const categoryKey = resolveAllowedCategoryKey(bookmark.category || DEFAULT_CATEGORY_LABEL);
    const matchesCategory = activeCategory === "all" || categoryKey === activeCategory;
    if (!matchesCategory) return false;

    if (!normalizedSearch) return true;

    const categoryLabel = getCategoryLabel(categoryKey, bookmark.category ?? DEFAULT_CATEGORY_LABEL);
    const haystack = `${bookmark.name} ${bookmark.category ?? ""} ${categoryLabel}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  renderBookmarkCollection(filtered);
}

  function renderBookmarkCollection(collection, options = {}) {
    const bookmarksContainer = grid || document.getElementById("bookmarks");
    if (!bookmarksContainer) {
      console.error("Cannot render bookmarks without #bookmarks element");
      return;
    }
    grid = bookmarksContainer;

    if (!template?.content?.firstElementChild) {
      console.error("Missing bookmark card template");
      return;
    }

    const maintainPage = Boolean(options.maintainPage);
    const incoming = Array.isArray(collection) ? collection.slice() : [];

    if (!maintainPage || !lastRenderedCollection.length) {
      lastRenderedCollection = incoming;
      if (!maintainPage) {
        currentPage = 1;
      }
    }

    const source = maintainPage ? lastRenderedCollection : incoming;

    if (!source.length) {
      hidePaginationControls();
      replaceChildrenSafe(bookmarksContainer, []);
      showEmptyState("No bookmarks match that vibe yet. Try a different search or category!");
      if (isNotionMode) {
        scheduleNotionScaleUpdate();
      }
      return;
    }

    hideEmptyState();

    let working = source;

    if (isNotionMode) {
      ensurePaginationControls();
      const rowsPerPage = Math.max(1, notionRowsPerPage);
      const columns = Math.max(1, Math.min(4, getGridColumnCount()));
      const perPage = Math.max(1, rowsPerPage * columns);
      const totalPages = Math.max(1, Math.ceil(source.length / perPage));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      if (currentPage < 1) {
        currentPage = 1;
      }
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      working = source.slice(startIndex, endIndex);
      updatePaginationControls(totalPages);
    } else {
      hidePaginationControls();
    }

    const cards = working.map((bookmark) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.classList.add("bookmark-card");
      card.innerHTML = `
        <img src="${bookmark.image}" alt="${bookmark.name}">
        <div class="card-body">
          <div class="card-title">${bookmark.name}</div>
          <div class="card-category">${bookmark.category}</div>
        </div>
      `;

      const imageEl = card.querySelector("img");
      const titleEl = card.querySelector(".card-title");
      const categoryEl = card.querySelector(".card-category");

      if (imageEl) {
        imageEl.classList.add("card-image");
        imageEl.loading = "lazy";
        applyBookmarkImage(imageEl, bookmark);
        imageEl.alt = bookmark.name || "";
      }
      if (titleEl) {
        titleEl.textContent = bookmark.name || "";
      }
      const categoryKey = resolveAllowedCategoryKey(bookmark.category || DEFAULT_CATEGORY_LABEL);
      const displayLabel = getCategoryLabel(categoryKey, bookmark.category || DEFAULT_CATEGORY_LABEL);
      if (categoryEl) {
        categoryEl.textContent = displayLabel;
        applyCategoryStylesToBadge(categoryEl, getCategoryColor(categoryKey));
      }

      const openBookmark = () => {
        window.open(bookmark.url, "_blank", "noopener,noreferrer");
      };

      card.addEventListener("click", openBookmark);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBookmark();
        }
      });

      return card;
    });

    replaceChildrenSafe(bookmarksContainer, cards);
  }

  function getGridColumnCount() {
    if (!grid) {
      return 1;
    }

    const bodyStyle = window.getComputedStyle(document.body);
    const declared = parseInt(bodyStyle.getPropertyValue("--grid-columns"), 10);
    if (Number.isFinite(declared) && declared > 0) {
      return declared;
    }

    const gridStyle = window.getComputedStyle(grid);
    const template = gridStyle.getPropertyValue("grid-template-columns");
    if (template && !template.includes("repeat")) {
      const segments = template
        .split(/\s+(?![^\(]*\))/)
        .map((segment) => segment.trim())
        .filter(Boolean);
      const segmentCount = segments.length;
      if (segmentCount > 0) {
        return segmentCount;
      }
    }

    const firstCard = grid.querySelector(".bookmark-card");
    if (firstCard) {
      const gap =
        parseFloat(gridStyle.getPropertyValue("column-gap")) ||
        parseFloat(gridStyle.getPropertyValue("gap")) ||
        0;
      const gridWidth = grid.clientWidth;
      const cardWidth = firstCard.offsetWidth;
      if (gridWidth > 0 && cardWidth > 0) {
        const estimated = Math.max(
          1,
          Math.floor((gridWidth + gap) / (cardWidth + gap))
        );
        if (Number.isFinite(estimated) && estimated > 0) {
          return estimated;
        }
      }
    }
  }

  return 1;
}

  function getItemsPerPage() {
    if (!isNotionMode) {
      return lastRenderedCollection.length || bookmarks.length || 1;
    }

    const columns = Math.max(1, Math.min(4, getGridColumnCount()));
    const rows = Math.max(1, notionRowsPerPage);
    return Math.max(1, columns * rows);
  }

  function ensurePaginationControls() {
    if (paginationContainer || !grid) {
      return;
    }

    paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-arrows";
    paginationContainer.hidden = true;

    paginationPrevBtn = document.createElement("button");
    paginationPrevBtn.type = "button";
    paginationPrevBtn.className = "pagination-arrow pagination-arrow--prev";
    paginationPrevBtn.textContent = "Previous";
    paginationPrevBtn.setAttribute("aria-label", "Previous page");
    paginationPrevBtn.addEventListener("click", () => {
      if (currentPage <= 1) {
        return;
      }
      currentPage -= 1;
      renderBookmarkCollection(lastRenderedCollection, { maintainPage: true });
    });

    paginationNextBtn = document.createElement("button");
    paginationNextBtn.type = "button";
    paginationNextBtn.className = "pagination-arrow pagination-arrow--next";
    paginationNextBtn.textContent = "Next";
    paginationNextBtn.setAttribute("aria-label", "Next page");
    paginationNextBtn.addEventListener("click", () => {
      const perPage = Math.max(1, getItemsPerPage());
      const totalPages = Math.max(1, Math.ceil(lastRenderedCollection.length / perPage));
      if (currentPage >= totalPages) {
        return;
      }
      currentPage += 1;
      renderBookmarkCollection(lastRenderedCollection, { maintainPage: true });
    });

    paginationContainer.append(paginationPrevBtn, paginationNextBtn);
    grid.insertAdjacentElement("afterend", paginationContainer);
  }

function hidePaginationControls() {
  if (paginationContainer) {
    paginationContainer.hidden = true;
  }
}

  function updatePaginationControls(totalPages) {
    if (!paginationContainer) {
      ensurePaginationControls();
    }

    if (!paginationContainer) {
      return;
    }

    const hasPages = isNotionMode && totalPages > 1;
    paginationContainer.hidden = !hasPages;

    if (!paginationPrevBtn || !paginationNextBtn) {
      return;
    }

    paginationPrevBtn.disabled = currentPage <= 1;
    paginationNextBtn.disabled = currentPage >= totalPages;

  }

function applyBookmarkImage(imageEl, bookmark) {
  imageEl.classList.remove("is-fallback");
  imageEl.referrerPolicy = "no-referrer";
  imageEl.decoding = "async";
  const primarySource = bookmark.image || buildFaviconUrl(bookmark.url);

  const handleError = () => {
    imageEl.src = createFallbackImage(bookmark);
    imageEl.classList.add("is-fallback");
  };

  imageEl.addEventListener("error", handleError, { once: true });
  imageEl.src = primarySource;
}

function createFallbackImage(bookmark) {
  const title = bookmark.name?.trim() || "?";
  const initials = title
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const displayInitials = initials || "☆";
  const palette = pickFallbackPalette(title + (bookmark.category ?? ""));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Bookmark placeholder">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.background}" />
          <stop offset="100%" stop-color="${palette.shadow}" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="${palette.shadow}" flood-opacity="0.65" />
        </filter>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#grad)" />
      <g filter="url(#shadow)">
        <circle cx="50" cy="42" r="10" fill="rgba(255, 255, 255, 0.7)" />
        <circle cx="108" cy="34" r="14" fill="rgba(255, 255, 255, 0.4)" />
        <circle cx="124" cy="110" r="12" fill="rgba(255, 255, 255, 0.4)" />
      </g>
      <text x="50%" y="55%" text-anchor="middle" font-size="64" font-family="'Bigbesty', 'Papernotes', 'Comic Sans MS', 'Segoe UI', sans-serif" fill="${palette.accent}" dominant-baseline="middle">${displayInitials}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function pickFallbackPalette(seed) {
  const index = Math.abs(hashString(seed)) % FALLBACK_PALETTES.length;
  return FALLBACK_PALETTES[index];
}

function hashString(value) {
  let hash = 0;
  const stringValue = String(value);
  for (let i = 0; i < stringValue.length; i += 1) {
    hash = (hash << 5) - hash + stringValue.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function buildFaviconUrl(url) {
  try {
    const domain = new URL(url).origin;
    return `https://www.google.com/s2/favicons?sz=256&domain=${encodeURIComponent(domain)}`;
  } catch (error) {
    return "https://www.google.com/s2/favicons?sz=256&domain=https://example.com";
  }
}

function setLoading(isLoading) {
  if (grid) {
    grid.setAttribute("aria-busy", String(isLoading));
  }
}

function showEmptyState(message) {
  if (!emptyState) return;
  emptyState.textContent = message;
  emptyState.hidden = false;
}

function hideEmptyState() {
  if (!emptyState) return;
  emptyState.hidden = true;
}

async function initAxolotlMascot() {
  if (axolotlInitialized) {
    axolotlController?.enable?.();
    return;
  }

  if (axolotlInitPromise) {
    return axolotlInitPromise;
  }

  if (!axolotlPath || !axolotlSprite || !axolotlFigure) {
    axolotlInitialized = true;
    axolotlController = { enable: () => {}, disable: () => {} };
    return;
  }

  axolotlInitPromise = (async () => {
    try {
      const discovery = await discoverAxolotlFrames();
      let stopFrameAnimation = null;
      let stateAnimator = null;
      let stopSwimming = null;
      let isSwimming = false;
      let swimTransitionPromise = null;
      let clearStateTimersRef = () => {};

      const stopFrameAnimationIfNeeded = () => {
        if (typeof stopFrameAnimation === "function") {
          stopFrameAnimation();
          stopFrameAnimation = null;
        }
      };

      const destroyStateAnimatorIfNeeded = () => {
        if (stateAnimator) {
          stateAnimator.destroy();
          stateAnimator = null;
        }
      };

      const settleMascot = () => {
        const width = window.innerWidth || document.documentElement.clientWidth || 0;
        const height = window.innerHeight || document.documentElement.clientHeight || 0;
        const targetX = clamp(width * 0.72, 80, Math.max(width - 110, 80));
        const targetY = clamp(height * 0.68, 90, Math.max(height - 150, 90));
        axolotlPath.style.transitionDuration = "0ms";
        axolotlPath.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        axolotlSprite.style.setProperty("--axolotl-flip", "0deg");
        axolotlSprite.style.setProperty("--axolotl-tilt", "0deg");
      };

      const stopSwim = () => {
        if (typeof stopSwimming === "function") {
          stopSwimming();
          stopSwimming = null;
        }
        isSwimming = false;
        swimTransitionPromise = null;
        clearStateTimersRef();
      };

      if (discovery.mode === "states") {
        const preloadTargets = new Set();
        for (const frames of Object.values(discovery.states || {})) {
          if (Array.isArray(frames)) {
            frames.forEach((frame) => preloadTargets.add(frame));
          }
        }
        await preloadImages([...preloadTargets]);

        axolotlFigure.classList.remove("axolotl--fallback");
        axolotlFrameDisplay.clearFallback();
        stateAnimator = createAxolotlStateAnimator(
          axolotlFigure,
          discovery.states,
          undefined,
          axolotlFrameDisplay
        );

        if (!stateAnimator.hasAny()) {
          destroyStateAnimatorIfNeeded();
          axolotlFigure.classList.add("axolotl--fallback");
          axolotlFrameDisplay.useFallback(DEFAULT_AXOLOTL_IMAGE);
          axolotlController = { enable: () => {}, disable: () => {} };
          return;
        }

        const findAvailableState = (candidates) =>
          candidates.find((name) => stateAnimator.hasState(name)) || null;

        const restState = findAvailableState(["resting", "floating", "swimming"]);
        const floatState = findAvailableState(["floating", "resting", "swimming"]);
        const swimState = findAvailableState(["swimming", "floating", "resting"]);
        const prepState = stateAnimator.hasState("swimmode") ? "swimmode" : null;
        const wakeState = stateAnimator.hasState("getup") ? "getup" : null;

        const stateTimers = new Set();
        const clearStateTimers = () => {
          stateTimers.forEach((id) => window.clearTimeout(id));
          stateTimers.clear();
        };
        const scheduleStateTimer = (fn, delay) => {
          const id = window.setTimeout(() => {
            stateTimers.delete(id);
            fn();
          }, delay);
          stateTimers.add(id);
          return id;
        };

        clearStateTimersRef = clearStateTimers;

        isSwimming = false;
        swimTransitionPromise = null;

        const showStill = () => {
          isSwimming = false;
          clearStateTimers();
          if (restState && stateAnimator.showState(restState)) {
            return;
          }
          if (floatState && stateAnimator.showState(floatState)) {
            return;
          }
          if (swimState) {
            stateAnimator.showState(swimState);
          }
        };

        const playFloatingLoop = () => {
          clearStateTimers();
          if (isSwimming) {
            return;
          }
          if (
            floatState &&
            stateAnimator.playLoop(floatState, floatState === "floating" ? 240 : 260)
          ) {
            return;
          }
          if (restState) {
            stateAnimator.playLoop(restState, 320);
          } else if (swimState) {
            stateAnimator.playLoop(swimState, 180);
          }
        };

        const scheduleRestingCycle = () => {
          if (!restState || restState === floatState || isSwimming) {
            return;
          }
          scheduleStateTimer(() => {
            if (!restState || isSwimming) return;
            stateAnimator.playLoop(restState, 320);
            if (wakeState) {
              scheduleStateTimer(() => {
                if (isSwimming) return;
                stateAnimator.playOnce(wakeState, {
                  interval: 200,
                  holdLast: true,
                  onComplete: () => {
                    if (isSwimming) return;
                    playFloatingLoop();
                  },
                });
              }, 3200);
            } else if (floatState) {
              scheduleStateTimer(() => {
                if (isSwimming) return;
                playFloatingLoop();
              }, 3600);
            }
          }, 9000);
        };

        const playIdleCycle = () => {
          if (isSwimming) {
            return;
          }
          clearStateTimers();
          if (restState && restState !== floatState) {
            stateAnimator.playLoop(restState, 320);
            if (wakeState) {
              scheduleStateTimer(() => {
                if (isSwimming) return;
                stateAnimator.playOnce(wakeState, {
                  interval: 200,
                  holdLast: true,
                  onComplete: () => {
                    if (isSwimming) return;
                    playFloatingLoop();
                    scheduleRestingCycle();
                  },
                });
              }, 3600);
            } else {
              scheduleStateTimer(() => {
                if (isSwimming) return;
                playFloatingLoop();
                scheduleRestingCycle();
              }, 4000);
            }
          } else {
            playFloatingLoop();
            scheduleRestingCycle();
          }
        };

        const playOnceAndWait = (stateName, options = {}) => {
          if (!stateName || !stateAnimator.hasState(stateName)) {
            return Promise.resolve(false);
          }
          return stateAnimator.playOnceAsync(stateName, options);
        };

        const transitionToSwim = () => {
          if (isSwimming) {
            return Promise.resolve();
          }
          if (swimTransitionPromise) {
            return swimTransitionPromise;
          }

          clearStateTimers();
          isSwimming = true;

          swimTransitionPromise = (async () => {
            let currentState = stateAnimator.getCurrentState();

            if (currentState === restState && wakeState) {
              await playOnceAndWait(wakeState, { interval: 210, holdLast: true });
              currentState = stateAnimator.getCurrentState();
            }

            if (floatState) {
              if (currentState !== floatState) {
                await playOnceAndWait(floatState, { interval: 230, holdLast: true });
                currentState = floatState;
              }
            }

            if (prepState) {
              await playOnceAndWait(prepState, { interval: 200, holdLast: false });
            }

            if (swimState) {
              stateAnimator.playLoop(swimState, 210);
            } else if (floatState) {
              stateAnimator.playLoop(floatState, floatState === "floating" ? 240 : 260);
            } else if (restState) {
              stateAnimator.playLoop(restState, 320);
            }
          })()
            .catch((error) => {
              isSwimming = false;
              throw error;
            })
            .finally(() => {
              swimTransitionPromise = null;
            });

          return swimTransitionPromise;
        };

        const settleAfterSwim = () => {
          isSwimming = false;
          playFloatingLoop();
          scheduleRestingCycle();
        };

        const startSwim = () => {
          stopSwim();
          stopSwimming = startAxolotlSwim(axolotlPath, axolotlSprite, {
            onSwimStart: transitionToSwim,
            onSwimStop: settleAfterSwim,
          });
        };

        const handleMotionPreference = () => {
          if (prefersReducedMotion.matches) {
            stopSwim();
            settleMascot();
            showStill();
          } else {
            if (!stopSwimming) {
              startSwim();
            }
            playIdleCycle();
          }
        };

        handleMotionPreference();

        addMotionPreferenceListener(() => {
          handleMotionPreference();
        });

        window.addEventListener("resize", () => {
          if (prefersReducedMotion.matches) {
            settleMascot();
            showStill();
          }
        });

        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            stopSwim();
            showStill();
          } else if (!prefersReducedMotion.matches) {
            if (!stopSwimming) {
              startSwim();
            }
            playIdleCycle();
          }
        });

        axolotlController = {
          enable: () => {
            if (prefersReducedMotion.matches) {
              settleMascot();
              showStill();
            } else {
              startSwim();
              playIdleCycle();
            }
          },
          disable: () => {
            stopSwim();
            clearStateTimers();
            showStill();
            settleMascot();
          },
        };

        return;
      }

      destroyStateAnimatorIfNeeded();

      const frames = discovery.frames || [];

      await preloadImages(frames);

      const startFrameAnimation = () => {
        stopFrameAnimationIfNeeded();
        if (frames.length > 1) {
          stopFrameAnimation = createAxolotlFrameAnimator(
            axolotlFigure,
            frames,
            180,
            axolotlFrameDisplay
          );
        }
      };

      const syncFramesWithMotionPreference = () => {
        if (frames.length <= 1) return;
        if (prefersReducedMotion.matches) {
          stopFrameAnimationIfNeeded();
        } else if (!stopFrameAnimation) {
          startFrameAnimation();
        }
      };

      if (frames.length === 0) {
        axolotlFigure.classList.add("axolotl--fallback");
        axolotlFrameDisplay.useFallback(DEFAULT_AXOLOTL_IMAGE);
      } else if (frames.length === 1) {
        axolotlFigure.classList.remove("axolotl--fallback");
        axolotlFrameDisplay.clearFallback();
        axolotlFrameDisplay.showFrame(frames[0], { immediate: true }).catch(() => {});
      } else {
        axolotlFigure.classList.remove("axolotl--fallback");
        axolotlFrameDisplay.clearFallback();
        startFrameAnimation();
      }

      const startSwim = () => {
        stopSwim();
        stopSwimming = startAxolotlSwim(axolotlPath, axolotlSprite, {
          onSwimStop: () => {
            if (prefersReducedMotion.matches) {
              settleMascot();
            }
          },
        });
      };

      const handleMotionPreference = () => {
        if (prefersReducedMotion.matches) {
          stopSwim();
          settleMascot();
        } else if (!stopSwimming) {
          startSwim();
        }
        syncFramesWithMotionPreference();
      };

      handleMotionPreference();

      addMotionPreferenceListener(() => {
        handleMotionPreference();
      });

      window.addEventListener("resize", () => {
        if (prefersReducedMotion.matches) {
          settleMascot();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopSwim();
        } else if (!prefersReducedMotion.matches && !stopSwimming) {
          startSwim();
        }
      });

      axolotlController = {
        enable: () => {
          if (prefersReducedMotion.matches) {
            stopFrameAnimationIfNeeded();
            settleMascot();
          } else {
            startFrameAnimation();
            startSwim();
          }
        },
        disable: () => {
          stopSwim();
          stopFrameAnimationIfNeeded();
          settleMascot();
        },
      };
    } catch (error) {
      console.warn("Axolotl mascot could not be initialized", error);
      axolotlFigure.classList.add("axolotl--fallback");
      axolotlFrameDisplay.useFallback(DEFAULT_AXOLOTL_IMAGE);
      axolotlController = { enable: () => {}, disable: () => {} };
    } finally {
      axolotlInitialized = true;
      axolotlInitPromise = null;
    }
  })();

  return axolotlInitPromise;
}

function startAxolotlSwim(pathEl, spriteEl, callbacks = {}) {
  const { onSwimStart, onSwimStop } = callbacks || {};
  let swimTimer = null;
  let currentX = 0;
  let currentY = 0;
  let awaitingTransition = false;
  const restWindow = { min: 1600, max: 3200 };

  const clearSwimTimer = () => {
    if (swimTimer !== null) {
      clearTimeout(swimTimer);
      swimTimer = null;
    }
  };

  const queueNextSwim = (delay) => {
    const range = restWindow.max - restWindow.min;
    const baseDelay =
      typeof delay === "number"
        ? delay
        : restWindow.min + Math.random() * (range > 0 ? range : 0);
    clearSwimTimer();
    swimTimer = window.setTimeout(swim, Math.max(0, baseDelay));
  };

  const handleTransitionEnd = (event) => {
    if (event?.target !== pathEl || event.propertyName !== "transform") {
      return;
    }
    if (awaitingTransition) {
      awaitingTransition = false;
      spriteEl.style.setProperty("--axolotl-tilt", "0deg");
      const stopResult = typeof onSwimStop === "function" ? onSwimStop() : null;
      Promise.resolve(stopResult)
        .catch(() => {})
        .finally(() => {
          queueNextSwim();
        });
    }
  };

  pathEl.addEventListener("transitionend", handleTransitionEnd);

  const applyTransform = (x, y, duration) => {
    pathEl.style.setProperty("--axolotl-duration", `${duration}ms`);
    pathEl.style.transitionDuration = `${duration}ms`;
    pathEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (awaitingTransition && duration <= 0) {
      awaitingTransition = false;
      if (typeof onSwimStop === "function") {
        onSwimStop();
      }
    }
  };

  const choosePoint = () => {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    const marginX = Math.max(width * 0.18, 140);
    const marginY = Math.max(height * 0.22, 160);
    const safeWidth = Math.max(width - marginX, 0);
    const safeHeight = Math.max(height - marginY, 0);
    const x = safeWidth > 0 ? marginX / 2 + Math.random() * safeWidth : width / 2;
    const y = safeHeight > 0 ? marginY / 2 + Math.random() * safeHeight : height / 2;
    const duration = 9000 + Math.random() * 7000;
    return { x, y, duration };
  };

  const swim = () => {
    clearSwimTimer();
    const { x, y, duration } = choosePoint();
    spriteEl.style.setProperty("--axolotl-flip", "0deg");
    const tiltRange = 8;
    const direction = x < currentX ? -1 : 1;
    const tilt = (Math.random() * tiltRange + 4) * direction;
    spriteEl.style.setProperty("--axolotl-tilt", `${tilt}deg`);

    const hasDuration = duration > 0;

    const startMovement = () => {
      awaitingTransition = hasDuration;
      applyTransform(x, y, duration);
      currentX = x;
      currentY = y;
      if (!hasDuration) {
        queueNextSwim();
      }
    };

    const response =
      hasDuration && typeof onSwimStart === "function"
        ? onSwimStart()
        : null;

    if (response && typeof response.then === "function") {
      response.then(startMovement).catch(startMovement);
    } else {
      startMovement();
    }
  };

  const handleResize = () => {
    if (swimTimer === null && !awaitingTransition) return;
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    const marginX = Math.max(width * 0.18, 140);
    const marginY = Math.max(height * 0.22, 160);
    const clampedX = clamp(currentX, marginX / 2, Math.max(width - marginX / 2, marginX / 2));
    const clampedY = clamp(currentY, marginY / 2, Math.max(height - marginY / 2, marginY / 2));
    applyTransform(clampedX, clampedY, 0);
    currentX = clampedX;
    currentY = clampedY;
  };

  window.addEventListener("resize", handleResize);

  const first = choosePoint();
  currentX = first.x;
  currentY = first.y;
  spriteEl.style.setProperty("--axolotl-flip", "0deg");
  spriteEl.style.setProperty("--axolotl-tilt", "0deg");
  applyTransform(first.x, first.y, 0);
  queueNextSwim(1200 + Math.random() * 1800);

  return () => {
    clearSwimTimer();
    window.removeEventListener("resize", handleResize);
    pathEl.removeEventListener("transitionend", handleTransitionEnd);
    if (awaitingTransition) {
      awaitingTransition = false;
      spriteEl.style.setProperty("--axolotl-tilt", "0deg");
      const stopResult = typeof onSwimStop === "function" ? onSwimStop() : null;
      Promise.resolve(stopResult).catch(() => {});
    }
  };
}

async function discoverAxolotlFrames() {
  const manifest = await loadAxolotlManifest();
  if (manifest) {
    return manifest;
  }

  const tested = new Map();

  const stateFrames = await discoverAxolotlStateFrames(tested);
  if (stateFrames) {
    return { mode: "states", states: stateFrames };
  }

  const single = await discoverAxolotlSingleFrame(tested);
  if (single.length) {
    return { mode: "frames", frames: single };
  }

  const sequential = await discoverAxolotlSequentialFrames(tested);
  if (sequential.length) {
    return { mode: "frames", frames: sequential };
  }

  return { mode: "frames", frames: [] };
}

async function loadAxolotlManifest() {
  try {
    const response = await fetch(AXOLOTL_MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return normalizeAxolotlManifest(payload);
  } catch (error) {
    return null;
  }
}

function normalizeAxolotlManifest(payload) {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    const frames = payload
      .map((entry) => normalizeAxolotlFramePath(entry))
      .filter(Boolean);
    return frames.length ? { mode: "frames", frames } : null;
  }

  if (Array.isArray(payload?.frames)) {
    const frames = payload.frames
      .map((entry) => normalizeAxolotlFramePath(entry))
      .filter(Boolean);
    return frames.length ? { mode: "frames", frames } : null;
  }

  const stateSource = extractStateMap(payload);
  if (stateSource) {
    const states = {};
    let total = 0;
    for (const name of AXOLOTL_STATE_NAMES) {
      if (!Array.isArray(stateSource[name])) {
        continue;
      }
      const frames = stateSource[name]
        .map((entry) => normalizeAxolotlFramePath(entry))
        .filter(Boolean);
      if (frames.length) {
        states[name] = frames;
        total += frames.length;
      }
    }
    if (total) {
      return { mode: "states", states };
    }
  }

  if (Array.isArray(payload?.sequence)) {
    const frames = payload.sequence
      .map((entry) => normalizeAxolotlFramePath(entry))
      .filter(Boolean);
    return frames.length ? { mode: "frames", frames } : null;
  }

  return null;
}

function extractStateMap(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.states && typeof payload.states === "object") {
    return payload.states;
  }

  let found = false;
  const direct = {};
  for (const name of AXOLOTL_STATE_NAMES) {
    if (Array.isArray(payload[name])) {
      direct[name] = payload[name];
      found = true;
    }
  }

  return found ? direct : null;
}

async function discoverAxolotlSingleFrame(tested) {
  for (const single of AXOLOTL_SINGLE_ASSETS) {
    if (await checkAxolotlCandidate(single, tested)) {
      return [single];
    }
  }
  return [];
}

async function discoverAxolotlSequentialFrames(tested) {
  for (const extension of AXOLOTL_FRAME_EXTENSIONS) {
    for (const pattern of AXOLOTL_FRAME_PATTERNS) {
      const frames = [];
      for (let index = 1; index <= AXOLOTL_FRAME_LIMIT; index += 1) {
        const candidate = pattern(index, extension);
        if (await checkAxolotlCandidate(candidate, tested)) {
          frames.push(candidate);
        } else if (index === 1) {
          frames.length = 0;
          break;
        } else {
          break;
        }
      }
      if (frames.length) {
        return frames;
      }
    }
  }

  return [];
}

async function discoverAxolotlStateFrames(tested) {
  const discovered = {};
  let total = 0;

  for (const state of AXOLOTL_STATE_NAMES) {
    let frames = [];

    for (const extension of AXOLOTL_FRAME_EXTENSIONS) {
      for (const pattern of AXOLOTL_STATE_FRAME_PATTERNS) {
        const candidates = [];
        for (let index = 1; index <= AXOLOTL_FRAME_LIMIT; index += 1) {
          const candidate = pattern(state, index, extension);
          if (await checkAxolotlCandidate(candidate, tested)) {
            candidates.push(candidate);
          } else if (index === 1) {
            candidates.length = 0;
            break;
          } else {
            break;
          }
        }

        if (candidates.length) {
          frames = candidates;
          break;
        }
      }
      if (frames.length) {
        break;
      }
    }

    if (frames.length) {
      discovered[state] = frames;
      total += frames.length;
    }
  }

  return total ? discovered : null;
}

async function checkAxolotlCandidate(candidate, tested) {
  if (tested.has(candidate)) {
    return tested.get(candidate);
  }
  const exists = await imageExists(candidate);
  tested.set(candidate, exists);
  return exists;
}

function normalizeAxolotlFramePath(entry) {
  if (typeof entry !== "string" || !entry.trim()) {
    return null;
  }
  const trimmed = entry.trim();
  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }
  const sanitized = trimmed.replace(/^\/+/, "");
  if (/^assets\//i.test(sanitized)) {
    return sanitized;
  }
  return `assets/axolotl/${sanitized}`;
}

function imageExists(source) {
  return probeImage(source).then(Boolean);
}

function probeImage(source) {
  if (!source) {
    return Promise.resolve(false);
  }
  if (imageProbeCache.has(source)) {
    return imageProbeCache.get(source);
  }
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = source;
  });
  imageProbeCache.set(source, promise);
  return promise;
}

function preloadImages(sources = []) {
  if (!Array.isArray(sources) || !sources.length) {
    return Promise.resolve();
  }
  const tasks = sources.map((source) => probeImage(source));
  return Promise.all(tasks).then(() => {});
}

function createAxolotlFrameDisplay(container) {
  if (!container) {
    return {
      showFrame: () => Promise.resolve(),
      useFallback: () => {},
      clearFallback: () => {},
    };
  }

  const front = container.querySelector(".axolotl-frame--front");
  const back = container.querySelector(".axolotl-frame--back");

  if (!front || !back) {
    return {
      showFrame: (url) => {
        container.style.backgroundImage = url ? `url('${url}')` : "";
        return Promise.resolve();
      },
      useFallback: (url) => {
        container.style.backgroundImage = url ? `url('${url}')` : "";
      },
      clearFallback: () => {
        container.style.backgroundImage = "";
      },
    };
  }

  let visibleEl = front;
  let hiddenEl = back;
  let queue = Promise.resolve();

  visibleEl.classList.add("is-visible");
  hiddenEl.classList.remove("is-visible");

  const loadInto = (el, url) =>
    new Promise((resolve) => {
      if (!url) {
        el.style.backgroundImage = "";
        delete el.dataset.src;
        resolve();
        return;
      }

      if (el.dataset.src === url) {
        resolve();
        return;
      }

      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        el.dataset.src = url;
        el.style.backgroundImage = `url('${url}')`;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });

  const enqueue = (task) => {
    queue = queue.then(() => task()).catch(() => {});
    return queue;
  };

  const performSwap = async (url) => {
    await loadInto(hiddenEl, url);
    const previousVisible = visibleEl;
    previousVisible.classList.remove("is-visible");
    hiddenEl.classList.add("is-visible");
    visibleEl = hiddenEl;
    hiddenEl = previousVisible;
    container.style.backgroundImage = "";
  };

  const showFrame = (url, { immediate = false } = {}) => {
    if (immediate) {
      const immediateTask = performSwap(url);
      queue = immediateTask.then(() => {}).catch(() => {});
      return immediateTask;
    }
    return enqueue(() => performSwap(url));
  };

  const useFallback = (url) => {
    queue = Promise.resolve();
    front.classList.remove("is-visible");
    back.classList.remove("is-visible");
    delete front.dataset.src;
    delete back.dataset.src;
    visibleEl = front;
    hiddenEl = back;
    container.style.backgroundImage = url ? `url('${url}')` : "";
  };

  const clearFallback = () => {
    container.style.backgroundImage = "";
    if (!front.classList.contains("is-visible") && !back.classList.contains("is-visible")) {
      visibleEl = front;
      hiddenEl = back;
      visibleEl.classList.add("is-visible");
      hiddenEl.classList.remove("is-visible");
    }
  };

  return { showFrame, useFallback, clearFallback };
}

function createAxolotlFrameAnimator(target, frames, interval = 160, display = null) {
  if ((!target && !display) || !frames.length) {
    return () => {};
  }

  const frameDisplay = display || createAxolotlFrameDisplay(target);
  let frameIndex = 0;
  let timerId = null;

  const showCurrentFrame = (immediate = false) => {
    const frame = frames[frameIndex];
    if (!frame) {
      return;
    }
    if (frameDisplay && typeof frameDisplay.showFrame === "function") {
      frameDisplay.showFrame(frame, { immediate }).catch(() => {});
    } else if (target) {
      target.style.backgroundImage = `url('${frame}')`;
    }
  };

  const step = () => {
    frameIndex = (frameIndex + 1) % frames.length;
    showCurrentFrame();
    timerId = window.setTimeout(step, interval);
  };

  showCurrentFrame(true);

  if (frames.length > 1) {
    timerId = window.setTimeout(step, interval);
  }

  const handleVisibility = () => {
    if (document.hidden) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    } else if (!timerId && frames.length > 1) {
      timerId = window.setTimeout(step, interval);
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

function createAxolotlStateAnimator(target, states, defaultInterval = 200, display = null) {
  const normalized = {};
  for (const [name, frames] of Object.entries(states || {})) {
    if (Array.isArray(frames) && frames.length) {
      normalized[name] = [...frames];
    }
  }

  let timerId = null;
  let current = null;
  let visibilityPaused = false;
  const frameDisplay = display || createAxolotlFrameDisplay(target);

  const clearTimer = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const applyFrame = (frames, index, immediate = false) => {
    if (!frames.length) {
      return;
    }
    const frame = frames[Math.max(0, Math.min(index, frames.length - 1))];
    if (frameDisplay && typeof frameDisplay.showFrame === "function") {
      frameDisplay.showFrame(frame, { immediate }).catch(() => {});
    } else if (target) {
      target.style.backgroundImage = `url('${frame}')`;
    }
  };

  const scheduleNext = () => {
    if (!current || document.hidden) {
      visibilityPaused = !!current;
      return;
    }
    clearTimer();
    timerId = window.setTimeout(step, current.interval);
  };

  const finalize = () => {
    const complete = current?.onComplete;
    current = null;
    clearTimer();
    if (typeof complete === "function") {
      complete();
    }
  };

  const step = () => {
    if (!current) {
      return;
    }
    const frames = current.frames;
    if (!frames.length) {
      finalize();
      return;
    }

    current.index += 1;

    if (current.index >= frames.length) {
      if (current.loop) {
        current.index = 0;
      } else {
        if (current.holdLast) {
          current.index = frames.length - 1;
          applyFrame(frames, current.index, true);
        }
        finalize();
        return;
      }
    }

    applyFrame(frames, current.index);
    scheduleNext();
  };

  const playState = (stateName, options = {}) => {
    const frames = normalized[stateName];
    if (!frames || !frames.length) {
      return false;
    }

    const {
      loop = false,
      interval = defaultInterval,
      holdLast = false,
      onComplete,
      restart = false,
    } = options;

    const resolvedInterval = Number.isFinite(interval) ? interval : defaultInterval;
    const currentInterval = Number.isFinite(current?.interval)
      ? current.interval
      : defaultInterval;

    if (
      !restart &&
      current &&
      current.stateName === stateName &&
      current.loop &&
      loop &&
      Math.abs(currentInterval - resolvedInterval) < 1
    ) {
      return true;
    }

    clearTimer();
    current = {
      stateName,
      frames,
      loop,
      holdLast,
      onComplete,
      interval: resolvedInterval,
      index: 0,
    };

    applyFrame(frames, 0, true);

    if (frames.length > 1) {
      scheduleNext();
    } else if (!loop) {
      const complete = current.onComplete;
      current = null;
      if (typeof complete === "function") {
        window.setTimeout(complete, resolvedInterval);
      }
    }

    return true;
  };

  const showState = (stateName) => {
    const frames = normalized[stateName];
    if (!frames || !frames.length) {
      return false;
    }
    clearTimer();
    current = null;
    applyFrame(frames, 0, true);
    return true;
  };

  const stop = () => {
    current = null;
    clearTimer();
  };

  const handleVisibility = () => {
    if (document.hidden) {
      if (timerId) {
        clearTimer();
        visibilityPaused = true;
      }
    } else if (visibilityPaused) {
      visibilityPaused = false;
      if (current && (current.loop || current.index < current.frames.length - 1)) {
        scheduleNext();
      }
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return {
    playLoop: (stateName, interval = defaultInterval) =>
      playState(stateName, { loop: true, interval }),
    playOnce: (stateName, options = {}) =>
      playState(stateName, { loop: false, ...options }),
    playOnceAsync: (stateName, options = {}) =>
      new Promise((resolve) => {
        const success = playState(stateName, {
          loop: false,
          ...options,
          onComplete: () => {
            if (typeof options.onComplete === "function") {
              options.onComplete();
            }
            resolve(true);
          },
        });

        if (!success) {
          resolve(false);
        }
      }),
    showState,
    stop,
    destroy: () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    },
    hasState: (stateName) => Array.isArray(normalized[stateName]) && normalized[stateName].length > 0,
    hasAny: () => Object.values(normalized).some((frames) => frames.length > 0),
    getCurrentState: () => current?.stateName || null,
    isLooping: (stateName) =>
      !!(current && current.loop && (!stateName || current.stateName === stateName)),
  };
}

function addMotionPreferenceListener(listener) {
  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", listener);
  } else if (typeof prefersReducedMotion.addListener === "function") {
    prefersReducedMotion.addListener(listener);
  }
}

function removeMotionPreferenceListener(listener) {
  if (typeof prefersReducedMotion.removeEventListener === "function") {
    prefersReducedMotion.removeEventListener("change", listener);
  } else if (typeof prefersReducedMotion.removeListener === "function") {
    prefersReducedMotion.removeListener(listener);
  }
}

function clamp(value, min, max) {
  if (Number.isNaN(value) || Number.isNaN(min) || Number.isNaN(max)) {
    return value;
  }
  if (min > max) {
    return Math.min(Math.max(value, max), min);
  }
  return Math.min(Math.max(value, min), max);
}

function setupDataTools() {
  if (!importBtn || !exportBtn || !restoreBtn || !importInput) {
    console.error("Data management controls are missing from the DOM");
    return;
  }

  importBtn.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const sanitized = sanitizeBookmarks(parsed);
      if (!sanitized.length) {
        alert("We couldn't find any bookmarks in that file. Please check the format and try again.");
        return;
      }
      setBookmarks(sanitized, { persist: true });
      alert(`Imported ${sanitized.length} sparkly bookmarks!`);
    } catch (error) {
      console.error("Import failed", error);
      alert("Import failed. Make sure you're using a valid JSON backup file.");
    } finally {
      importInput.value = "";
    }
  });

  exportBtn.addEventListener("click", () => {
    if (!bookmarks.length) {
      alert("There are no bookmarks to export just yet.");
      return;
    }

    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bubblemarks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  restoreBtn.addEventListener("click", async () => {
    if (
      !confirm(
        "Restore bookmarks from bookmarks.json? This will replace your current list."
      )
    ) {
      return;
    }

    await hydrateData();
    resetCategorySettingsToDefaults();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  hydrateData();
  setupControlTabs();
  setupKeyboard();
  setupSettingsMenu();
});

console.log("✅ script validated");
