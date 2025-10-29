const STORAGE_KEY = "bubblemarks.bookmarks.v1";
const DEFAULT_SOURCE = "bookmarks.json";
const FALLBACK_PALETTES = [
  { background: "#ffe9f6", accent: "#ff80c8", shadow: "#ffc3e4" },
  { background: "#e7f1ff", accent: "#92a9ff", shadow: "#cdd8ff" },
  { background: "#fff5e5", accent: "#ffba6b", shadow: "#ffe3ba" },
  { background: "#e8fff6", accent: "#6ad6a6", shadow: "#c2f7da" },
];

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
const AXOLOTL_FRAME_EXTENSIONS = ["png", "webp", "gif"];
const AXOLOTL_FRAME_PATTERNS = [
  (index, extension) =>
    `assets/axolotl/frame-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/frame${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/axolotl-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/axolotl${index}.${extension}`,
  (index, extension) =>
    `assets/axolotl/swim-${String(index).padStart(2, "0")}.${extension}`,
  (index, extension) => `assets/axolotl/swim${index}.${extension}`,
];
const AXOLOTL_SINGLE_ASSETS = [
  "assets/axolotl/axolotl.gif",
  "assets/axolotl/axolotl.png",
  "assets/axolotl/axolotl.webp",
  "assets/axolotl/swim.gif",
  "assets/axolotl/swim.png",
  "assets/axolotl/swim.webp",
];
const AXOLOTL_FRAME_LIMIT = 30;

let bookmarks = [];
let defaultBookmarks = [];
let activeCategory = "all";
let searchTerm = "";

const grid = document.getElementById("bookmarks");
const emptyState = document.getElementById("empty-state");
const keyboardContainer = document.getElementById("keyboard");
const categoryBar = document.getElementById("categories");
const searchInput = document.getElementById("search");
const clearSearchBtn = document.getElementById("clear-search");
const datalist = document.getElementById("bookmark-suggestions");
const importBtn = document.getElementById("import-btn");
const exportBtn = document.getElementById("export-btn");
const restoreBtn = document.getElementById("restore-btn");
const importInput = document.getElementById("import-input");
const template = document.getElementById("bookmark-card-template");
const axolotlPath = document.getElementById("axolotl-path");
const axolotlSprite = document.getElementById("axolotl-sprite");
const axolotlFigure = document.getElementById("axolotl-figure");

window.addEventListener("DOMContentLoaded", async () => {
  setupSearch();
  setupKeyboard();
  setupDataTools();
  initAxolotlMascot();
  await hydrateData();
});

async function hydrateData() {
  setLoading(true);
  const stored = readStoredBookmarks();

  if (stored && stored.length) {
    defaultBookmarks = await loadDefaultBookmarks();
    setBookmarks(stored, { persist: false });
    setLoading(false);
    return;
  }

  try {
    const fallback = await loadDefaultBookmarks();
    if (fallback.length) {
      setBookmarks(fallback, { persist: true });
    } else {
      throw new Error("No bookmark data available");
    }
  } catch (error) {
    console.error(error);
    renderBookmarks([]);
    showEmptyState("We couldn't load your bookmarks yet. Try importing a backup!");
  } finally {
    setLoading(false);
  }
}

function readStoredBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return sanitizeBookmarks(parsed);
  } catch (error) {
    console.warn("Unable to read bookmarks from storage", error);
    return null;
  }
}

async function loadDefaultBookmarks() {
  if (defaultBookmarks.length) {
    return [...defaultBookmarks];
  }

  try {
    const response = await fetch(DEFAULT_SOURCE, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch default bookmarks: ${response.status}`);
    }
    const data = await response.json();
    defaultBookmarks = sanitizeBookmarks(data);
    return [...defaultBookmarks];
  } catch (error) {
    console.warn("Could not load default bookmarks", error);
    return [];
  }
}

function sanitizeBookmarks(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => ({
      name: String(entry.name ?? "Untitled").trim(),
      url: String(entry.url ?? "").trim(),
      category: entry.category ? String(entry.category).trim() : "Unsorted",
      image: entry.image ? String(entry.image).trim() : "",
    }))
    .filter((entry) => entry.name && entry.url);
}

function setBookmarks(next, { persist } = { persist: true }) {
  bookmarks = [...next];
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.warn("Unable to save bookmarks", error);
    }
  }
  updateCategoryBar();
  updateSuggestions();
  applyFilters();
}

function setupSearch() {
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

function setupKeyboard() {
  const keyLayout = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
    ["space", "backspace", "clear"],
  ];

  keyLayout.forEach((rowKeys) => {
    const row = document.createElement("div");
    row.className = "keyboard-row";

    rowKeys.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.key = key.toLowerCase();
      button.className = "key-btn";

      if (key === "space") {
        button.textContent = "Space";
        button.setAttribute("aria-label", "Insert space");
      } else if (key === "backspace") {
        button.textContent = "⌫";
        button.setAttribute("aria-label", "Backspace");
      } else if (key === "clear") {
        button.textContent = "Clear";
        button.setAttribute("aria-label", "Clear search");
      } else {
        button.textContent = key;
        button.setAttribute("aria-label", `Type ${key}`);
      }

      button.addEventListener("click", () => handleVirtualKey(key.toLowerCase()));
      row.appendChild(button);
    });

    keyboardContainer.appendChild(row);
  });
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

function updateCategoryBar() {
  const fragment = document.createDocumentFragment();
  const categories = Array.from(
    new Set(bookmarks.map((item) => item.category || "Unsorted"))
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const allCategories = ["All", ...categories];
  if (!allCategories.some((category) => category.toLowerCase() === activeCategory)) {
    activeCategory = "all";
  }
  categoryBar.innerHTML = "";

  allCategories.forEach((category) => {
    const pill = document.createElement("button");
    const normalized = category.toLowerCase();
    pill.type = "button";
    pill.className = "filter-pill";
    pill.dataset.category = normalized;
    pill.textContent = category;
    if (normalized === activeCategory) {
      pill.classList.add("active");
    }
    pill.addEventListener("click", () => {
      activeCategory = normalized;
      Array.from(categoryBar.children).forEach((node) => node.classList.toggle("active", node.dataset.category === normalized));
      applyFilters();
    });
    fragment.appendChild(pill);
  });

  categoryBar.appendChild(fragment);
}

function updateSuggestions() {
  datalist.innerHTML = "";
  const fragment = document.createDocumentFragment();
  bookmarks.forEach((bookmark) => {
    const option = document.createElement("option");
    option.value = bookmark.name;
    fragment.appendChild(option);
  });
  datalist.appendChild(fragment);
}

function applyFilters() {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = bookmarks.filter((bookmark) => {
    const matchesCategory =
      activeCategory === "all" || bookmark.category?.toLowerCase() === activeCategory;
    if (!matchesCategory) return false;

    if (!normalizedSearch) return true;

    const haystack = `${bookmark.name} ${bookmark.category ?? ""}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  renderBookmarks(filtered);
}

function renderBookmarks(collection) {
  grid.innerHTML = "";

  if (!collection.length) {
    showEmptyState("No bookmarks match that vibe yet. Try a different search or category!");
    return;
  }

  hideEmptyState();

  const fragment = document.createDocumentFragment();

  collection.forEach((bookmark) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const imageEl = card.querySelector(".card-image");
    const titleEl = card.querySelector(".card-title");
    const categoryEl = card.querySelector(".card-category");

    applyBookmarkImage(imageEl, bookmark);
    imageEl.alt = bookmark.name;
    titleEl.textContent = bookmark.name;
    categoryEl.textContent = bookmark.category || "Unsorted";

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

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
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
  grid.setAttribute("aria-busy", String(isLoading));
}

function showEmptyState(message) {
  emptyState.textContent = message;
  emptyState.hidden = false;
}

function hideEmptyState() {
  emptyState.hidden = true;
}

async function initAxolotlMascot() {
  if (!axolotlPath || !axolotlSprite || !axolotlFigure) {
    return;
  }

  try {
    const frames = await discoverAxolotlFrames();
    let stopFrameAnimation = null;

    const stopFrameAnimationIfNeeded = () => {
      if (typeof stopFrameAnimation === "function") {
        stopFrameAnimation();
        stopFrameAnimation = null;
      }
    };

    const startFrameAnimation = () => {
      stopFrameAnimationIfNeeded();
      if (frames.length > 1) {
        stopFrameAnimation = createAxolotlFrameAnimator(axolotlFigure, frames, 130);
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
    } else if (frames.length === 1) {
      axolotlFigure.style.backgroundImage = `url('${frames[0]}')`;
    } else {
      startFrameAnimation();
    }

    let stopSwimming = null;

    const settleMascot = () => {
      const width = window.innerWidth || document.documentElement.clientWidth || 0;
      const height = window.innerHeight || document.documentElement.clientHeight || 0;
      const targetX = clamp(width * 0.72, 80, Math.max(width - 110, 80));
      const targetY = clamp(height * 0.68, 90, Math.max(height - 150, 90));
      axolotlPath.style.transitionDuration = "0ms";
      axolotlPath.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      axolotlSprite.style.setProperty("--axolotl-direction", "1");
    };

    const stopSwim = () => {
      if (typeof stopSwimming === "function") {
        stopSwimming();
        stopSwimming = null;
      }
    };

    const startSwim = () => {
      stopSwimming = startAxolotlSwim(axolotlPath, axolotlSprite);
    };

    const handleMotionPreference = () => {
      if (prefersReducedMotion.matches) {
        stopSwim();
        settleMascot();
      } else if (!stopSwimming) {
        startSwim();
      }
    };

    handleMotionPreference();
    syncFramesWithMotionPreference();

    addMotionPreferenceListener(() => {
      handleMotionPreference();
      syncFramesWithMotionPreference();
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

  } catch (error) {
    console.warn("Axolotl mascot could not be initialized", error);
    axolotlFigure.classList.add("axolotl--fallback");
  }
}

function startAxolotlSwim(pathEl, spriteEl) {
  let swimTimer = null;
  let currentX = 0;
  let currentY = 0;

  const applyTransform = (x, y, duration) => {
    pathEl.style.setProperty("--axolotl-duration", `${duration}ms`);
    pathEl.style.transitionDuration = `${duration}ms`;
    pathEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
    const { x, y, duration } = choosePoint();
    spriteEl.style.setProperty("--axolotl-direction", x < currentX ? "-1" : "1");
    applyTransform(x, y, duration);
    currentX = x;
    currentY = y;
    swimTimer = window.setTimeout(swim, duration);
  };

  const handleResize = () => {
    if (swimTimer === null) return;
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
  spriteEl.style.setProperty("--axolotl-direction", Math.random() > 0.5 ? "1" : "-1");
  applyTransform(first.x, first.y, 0);
  swimTimer = window.setTimeout(swim, 1200 + Math.random() * 1800);

  return () => {
    if (swimTimer !== null) {
      clearTimeout(swimTimer);
    }
    swimTimer = null;
    window.removeEventListener("resize", handleResize);
  };
}

async function discoverAxolotlFrames() {
  const manifestFrames = await loadAxolotlManifest();
  if (manifestFrames.length) {
    return manifestFrames;
  }

  for (const single of AXOLOTL_SINGLE_ASSETS) {
    if (await imageExists(single)) {
      return [single];
    }
  }

  const tested = new Map();
  const checkCandidate = async (candidate) => {
    if (tested.has(candidate)) {
      return tested.get(candidate);
    }
    const exists = await imageExists(candidate);
    tested.set(candidate, exists);
    return exists;
  };

  for (const extension of AXOLOTL_FRAME_EXTENSIONS) {
    for (const pattern of AXOLOTL_FRAME_PATTERNS) {
      const frames = [];
      for (let index = 1; index <= AXOLOTL_FRAME_LIMIT; index += 1) {
        const candidate = pattern(index, extension);
        // Avoid duplicated checks for the same source across patterns
        if (await checkCandidate(candidate)) {
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

async function loadAxolotlManifest() {
  try {
    const response = await fetch(AXOLOTL_MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    const entries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.frames)
      ? payload.frames
      : [];
    return entries
      .map((entry) => normalizeAxolotlFramePath(entry))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function normalizeAxolotlFramePath(entry) {
  if (typeof entry !== "string" || !entry.trim()) {
    return null;
  }
  const trimmed = entry.trim();
  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }
  return `assets/axolotl/${trimmed.replace(/^\/+/, "")}`;
}

function imageExists(source) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = source;
  });
}

function createAxolotlFrameAnimator(target, frames, interval = 120) {
  if (!target || !frames.length) {
    return () => {};
  }

  let frameIndex = 0;
  let timerId = null;

  const applyFrame = () => {
    target.style.backgroundImage = `url('${frames[frameIndex]}')`;
  };

  const step = () => {
    frameIndex = (frameIndex + 1) % frames.length;
    applyFrame();
    timerId = window.setTimeout(step, interval);
  };

  applyFrame();

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
    if (!confirm("Restore the default Bubblemarks sample data? Your current list will be replaced.")) {
      return;
    }
    const defaults = await loadDefaultBookmarks();
    if (!defaults.length) {
      alert("No default bookmarks available right now. Try importing a backup instead.");
      return;
    }
    setBookmarks(defaults, { persist: true });
  });
}
