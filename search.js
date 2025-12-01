console.log("[CampusLife] search.js module loaded");

export function debounce(fn, delay) {
  let timerId;
  return (...args) => {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function sanitizeSearchTerm(value) {
  const str = String(value || "");
  // Normalize whitespace and limit length to avoid flooding logs or UI
  return str.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function setupSearch(onSearch) {
  const input = document.getElementById("search-input");
  if (!input || typeof onSearch !== "function") return;

  const handleSearch = debounce((value) => {
    const sanitized = sanitizeSearchTerm(value);
    onSearch(sanitized);
  }, 300);

  input.addEventListener("input", (event) => {
    const value = event.target.value || "";
    handleSearch(value);
  });
}


