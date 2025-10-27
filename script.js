async function loadBookmarks() {
  const res = await fetch("bookmarks.json");
  const data = await res.json();
  window.bookmarks = data;
  displayBookmarks(data);
}

function displayBookmarks(data) {
  const container = document.getElementById("bookmarks");
  container.innerHTML = "";
  data.forEach(b => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${b.image}" alt="${b.name}">
      <p>${b.name}</p>
    `;
    card.onclick = () => window.open(b.url, "_blank");
    container.appendChild(card);
  });
}

function setupSearch() {
  const input = document.getElementById("search");
  input.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filtered = window.bookmarks.filter(b =>
      b.name.toLowerCase().includes(query)
    );
    displayBookmarks(filtered);
  });
}

function setupKeyboard() {
  const keyboard = document.getElementById("keyboard");
  const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ←".split("");
  keys.forEach(k => {
    const key = document.createElement("button");
    key.textContent = k;
    key.onclick = () => {
      const input = document.getElementById("search");
      if (k === "←") input.value = input.value.slice(0, -1);
      else input.value += k.toLowerCase();
      input.dispatchEvent(new Event("input"));
    };
    keyboard.appendChild(key);
  });
}

loadBookmarks();
setupSearch();
setupKeyboard();
