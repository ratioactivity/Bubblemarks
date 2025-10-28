const STORAGE_KEY = "bubblemarks.bookmarks.v1";
const DEFAULT_SOURCE = "bookmarks.json";

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

window.addEventListener("DOMContentLoaded", async () => {
  setupSearch();
  setupKeyboard();
  setupDataTools();
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

    imageEl.src = bookmark.image || buildFaviconUrl(bookmark.url);
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
