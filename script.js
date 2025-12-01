function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// CommonJS export for Jest tests (has no effect in the browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports.escapeHtml = escapeHtml;
}

// Hardcoded events data
const EVENTS = [
  {
    id: 1,
    title: "AI & Data Science Meetup",
    category: "Tech",
    date: "2025-12-03",
    time: "17:30",
    location: "Innovation Lab A201",
    description: "Lightning talks from students building projects with AI and data tooling.",
    tags: ["workshop", "networking", "engineering"],
  },
  {
    id: 2,
    title: "Sustainability on Campus Panel",
    category: "Community",
    date: "2025-12-05",
    time: "14:00",
    location: "Auditorium West",
    description: "Hear from faculty and students working on green initiatives across campus.",
    tags: ["panel", "environment", "policy"],
  },
  {
    id: 3,
    title: "Winter Music Night",
    category: "Arts",
    date: "2025-12-08",
    time: "19:00",
    location: "Student Union Hall",
    description: "Performances from the campus choir, band, and independent artists.",
    tags: ["performance", "music"],
  },
  {
    id: 4,
    title: "Career Bootcamp: CV & Interview Clinic",
    category: "Careers",
    date: "2025-12-10",
    time: "10:00",
    location: "Careers Centre C101",
    description: "One‑to‑one coaching and workshops to get you job‑search ready.",
    tags: ["career", "coaching", "skills"],
  },
];

// IndexedDB configuration
const DB_NAME = "campusLifeDB";
const DB_VERSION = 1;
const CLUBS_STORE = "clubs";
const ROOMS_STORE = "rooms";

let dbInstance = null;
let latestSearchTerm = "";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(CLUBS_STORE)) {
        const clubsStore = db.createObjectStore(CLUBS_STORE, { keyPath: "id", autoIncrement: true });
        clubsStore.createIndex("name", "name", { unique: false });
        clubsStore.createIndex("category", "category", { unique: false });
      }

      if (!db.objectStoreNames.contains(ROOMS_STORE)) {
        const roomsStore = db.createObjectStore(ROOMS_STORE, { keyPath: "id", autoIncrement: true });
        roomsStore.createIndex("name", "name", { unique: false });
        roomsStore.createIndex("building", "building", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error("Failed to open IndexedDB", request.error);
      reject(request.error);
    };
  });
}

async function seedInitialData() {
  const db = await openDatabase();

  await Promise.all([seedIfEmpty(db, CLUBS_STORE, getDefaultClubs()), seedIfEmpty(db, ROOMS_STORE, getDefaultRooms())]);
}

function seedIfEmpty(db, storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    const countRequest = store.count();
    countRequest.onsuccess = () => {
      if (countRequest.result > 0) {
        resolve();
        return;
      }

      data.forEach((item) => store.add(item));
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getDefaultClubs() {
  return [
    {
      name: "Developer Society",
      category: "Technology",
      description: "Weekly coding meetups, hackathons, and open‑source collaborations.",
      contact: "devsoc@campus.edu",
      tags: ["coding", "projects", "workshops"],
    },
    {
      name: "Outdoor Adventure Club",
      category: "Recreation",
      description: "Hikes, climbing, and weekend trips for all experience levels.",
      contact: "adventure@campus.edu",
      tags: ["hiking", "outdoors", "community"],
    },
    {
      name: "Film & Media Society",
      category: "Arts",
      description: "Screenings, discussions, and student‑led film productions.",
      contact: "film@campus.edu",
      tags: ["cinema", "creative", "production"],
    },
    {
      name: "Entrepreneurs Guild",
      category: "Business",
      description: "Pitch nights, founder talks, and startup coaching.",
      contact: "startup@campus.edu",
      tags: ["startups", "networking"],
    },
  ];
}

function getDefaultRooms() {
  return [
    {
      name: "Quiet Study Room Q1",
      building: "Library North",
      capacity: 24,
      equipment: ["Power outlets", "Reading lamps"],
      type: "Quiet",
    },
    {
      name: "Collaboration Studio C3",
      building: "Innovation Hub",
      capacity: 10,
      equipment: ["Screen", "Whiteboard", "HDMI"],
      type: "Group",
    },
    {
      name: "Focus Pod F2",
      building: "Main Library",
      capacity: 4,
      equipment: ["Noise‑reduction", "USB‑C docking"],
      type: "Silent",
    },
    {
      name: "Makerspace Lab M1",
      building: "Engineering Block",
      capacity: 16,
      equipment: ["3D printers", "Soldering stations"],
      type: "Lab",
    },
  ];
}

function getAllFromStore(storeName) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

function renderEvents(events, filterTerm) {
  const listEl = document.querySelector("#events .card-grid");
  if (!listEl) return;
  listEl.innerHTML = "";

  const term = (filterTerm || "").toLowerCase();
  const filtered = events.filter((event) => {
    if (!term) return true;
    const haystack = [
      event.title,
      event.category,
      event.location,
      event.description,
      ...(event.tags || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  if (filtered.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "card";
    emptyItem.textContent = "No events match your search.";
    listEl.appendChild(emptyItem);
    return;
  }

  filtered.forEach((event) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header-row">
        <div>
          <h3 class="card-title">${escapeHtml(event.title)}</h3>
          <div class="card-meta">
            <span>${formatDate(event.date)} · ${escapeHtml(event.time)}</span>
            <span>•</span>
            <span>${escapeHtml(event.location)}</span>
          </div>
        </div>
        <span class="chip chip--primary">${escapeHtml(event.category)}</span>
      </div>
      <p class="card-body">${escapeHtml(event.description)}</p>
      <div class="tag-row">
        ${(event.tags || [])
          .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
          .join("")}
      </div>
    `;
    listEl.appendChild(card);
  });
}

async function renderClubs(filterTerm) {
  const listEl = document.querySelector("#clubs .card-grid");
  if (!listEl) return;
  listEl.innerHTML = "";

  let clubs = [];
  try {
    clubs = await getAllFromStore(CLUBS_STORE);
  } catch (err) {
    console.error("Error loading clubs", err);
  }

  const term = (filterTerm || "").toLowerCase();
  const filtered = clubs.filter((club) => {
    if (!term) return true;
    const haystack = [
      club.name,
      club.category,
      club.description,
      club.contact,
      ...(club.tags || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  if (filtered.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "card";
    emptyItem.textContent = "No clubs match your search.";
    listEl.appendChild(emptyItem);
    return;
  }

  filtered.forEach((club) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header-row">
        <div>
          <h3 class="card-title">${escapeHtml(club.name)}</h3>
          <div class="card-meta">
            <span class="chip chip--subtle">${escapeHtml(club.category)}</span>
          </div>
        </div>
      </div>
      <p class="card-body">${escapeHtml(club.description)}</p>
      <div class="tag-row">
        ${(club.tags || [])
          .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
          .join("")}
      </div>
      <div class="card-meta">
        <span>Contact: ${escapeHtml(club.contact)}</span>
      </div>
    `;
    listEl.appendChild(card);
  });
}

async function renderRooms(filterTerm) {
  const listEl = document.querySelector("#rooms .card-grid");
  if (!listEl) return;
  listEl.innerHTML = "";

  let rooms = [];
  try {
    rooms = await getAllFromStore(ROOMS_STORE);
  } catch (err) {
    console.error("Error loading rooms", err);
  }

  const term = (filterTerm || "").toLowerCase();
  const filtered = rooms.filter((room) => {
    if (!term) return true;
    const haystack = [
      room.name,
      room.building,
      room.type,
      String(room.capacity),
      ...(room.equipment || []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  if (filtered.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "card";
    emptyItem.textContent = "No rooms match your search.";
    listEl.appendChild(emptyItem);
    return;
  }

  filtered.forEach((room) => {
    const card = document.createElement("article");
    card.className = "card card--room";
    card.innerHTML = `
      <div class="card-header-row">
        <div>
          <h3 class="card-title">${escapeHtml(room.name)}</h3>
          <div class="card-meta">
            <span>${escapeHtml(room.building)}</span>
            <span>•</span>
            <span>${room.capacity} seats</span>
          </div>
        </div>
        <span class="chip chip--subtle">${escapeHtml(room.type)}</span>
      </div>
      <div class="tag-row">
        ${(room.equipment || [])
          .map((item) => `<span class="tag tag--soft">${escapeHtml(item)}</span>`)
          .join("")}
      </div>
    `;
    listEl.appendChild(card);
  });
}

function initStatusBanner() {
  const banner = document.getElementById("status-banner");
  if (!banner) return;

  const textEl = banner.querySelector(".status-text");

  const setOnline = () => {
    banner.classList.remove("offline");
    textEl.textContent = "You are currently online";
  };

  const setOffline = () => {
    banner.classList.add("offline");
    textEl.textContent = "You are offline – some data may be served from your device.";
  };

  if (navigator.onLine) {
    setOnline();
  } else {
    setOffline();
  }

  window.addEventListener("online", setOnline);
  window.addEventListener("offline", setOffline);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function setCurrentYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}



function initLazySearch() {
  const input = document.getElementById("search-input");
  if (!input) return;

  let loaded = false;

  const loadSearchModule = async () => {
    if (loaded) return;
    loaded = true;

    try {
      const searchModuleUrl = new URL("search.js", window.location.href).href;
      const module = await import(searchModuleUrl);
      console.log("[CampusLife] search module dynamically imported");
      if (typeof module.setupSearch === "function") {
        module.setupSearch((term) => {
          latestSearchTerm = term;
          renderEvents(EVENTS, term);
          renderClubs(term);
          renderRooms(term);
        });
      }
    } catch (error) {
      console.error("Failed to load search module", error);
    }
  };

  input.addEventListener("focus", loadSearchModule, { once: true });
  input.addEventListener("click", loadSearchModule, { once: true });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    setCurrentYear();
    initStatusBanner();
    initLazySearch();

    try {
      await seedInitialData();
    } catch (err) {
      console.error("Error seeding initial data", err);
    }

    renderEvents(EVENTS, latestSearchTerm);
    renderClubs(latestSearchTerm);
    renderRooms(latestSearchTerm);
  });
}
