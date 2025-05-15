"use strict";

const apiKey = "0ea2bdb2e0714ed0a010339f866ae4b0"; // <-- Replace with your NewsAPI.org key
const baseUrl = "https://newsapi.org/v2/everything";

const navItems = document.querySelectorAll(".nav-item");
const searchInput = document.getElementById("search-text");
const searchButton = document.getElementById("search-button");
const cardsContainer = document.getElementById("cardscontainer");
const loader = document.getElementById("loader");
const loadMoreBtn = document.getElementById("load-more-btn");

const sourceFilter = document.getElementById("source-filter");
const dateFilter = document.getElementById("date-filter");
const filterApplyBtn = document.getElementById("filter-apply");
const darkModeToggle = document.getElementById("dark-mode-toggle");

const templateCard = document.getElementById("template-news-card");

let currentQuery = "";
let currentPage = 1;
const pageSize = 6; // articles per page
let totalResults = 0;
let articlesCache = [];

let availableSources = new Set();

function showLoader(show) {
    loader.style.display = show ? "block" : "none";
}

function clearCards() {
    cardsContainer.innerHTML = "";
}

function toggleActiveNavItem(id) {
    navItems.forEach((item) => {
        if (item.id === id) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

// Save and load last search in localStorage
function saveLastQuery(query) {
    localStorage.setItem("lastQuery", query);
}

function loadLastQuery() {
    return localStorage.getItem("lastQuery") || "";
}

async function fetchNews(query, page = 1) {
    showLoader(true);

    let url = `${baseUrl}?q=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}&apiKey=${apiKey}&language=en&sortBy=publishedAt`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "ok") {
            alert("Error fetching news: " + data.message);
            showLoader(false);
            return null;
        }

        return data;
    } catch (err) {
        alert("Failed to fetch news: " + err.message);
        showLoader(false);
        return null;
    }
}

function populateSourcesFilter(articles) {
    availableSources.clear();
    articles.forEach((article) => {
        if (article.source && article.source.name) {
            availableSources.add(article.source.name);
        }
    });

    // Clear and add to select dropdown
    sourceFilter.innerHTML = '<option value="">All Sources</option>';
    [...availableSources].sort().forEach((source) => {
        const option = document.createElement("option");
        option.value = source;
        option.textContent = source;
        sourceFilter.appendChild(option);
    });
}

function filterArticles(articles) {
    let filtered = articles;

    const sourceValue = sourceFilter.value;
    const dateValue = dateFilter.value;

    if (sourceValue) {
        filtered = filtered.filter((a) => a.source.name === sourceValue);
    }
    if (dateValue) {
        // filter articles published on or after selected date
        filtered = filtered.filter((a) => {
            const publishedDate = new Date(a.publishedAt);
            const filterDate = new Date(dateValue);
            // Only keep articles on the selected date (ignoring time)
            return (
                publishedDate.getFullYear() === filterDate.getFullYear() &&
                publishedDate.getMonth() === filterDate.getMonth() &&
                publishedDate.getDate() === filterDate.getDate()
            );
        });
    }

    return filtered;
}

function renderArticles(articles, append = false) {
    if (!append) {
        clearCards();
    }

    if (!articles.length) {
        cardsContainer.innerHTML = `<p style="padding: 2rem; color: var(--secondary-text-color);">No articles found.</p>`;
        loadMoreBtn.style.display = "none";
        return;
    }

    articles.forEach((article) => {
        const card = templateCard.content.cloneNode(true);

        const img = card.getElementById("news-img");
        img.src = article.urlToImage || "https://via.placeholder.com/400x200";
        img.alt = article.title || "News Image";

        const title = card.getElementById("news-title");
        title.textContent = article.title || "No Title";

        const source = card.getElementById("news-source");
        const dateStr = article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString()
            : "";
        source.textContent = `${article.source.name} • ${dateStr}`;

        const desc = card.getElementById("news-desc");
        desc.textContent = article.description || "No Description";

        // Open article link on click or keyboard
        card.firstElementChild.addEventListener("click", () => {
            window.open(article.url, "_blank");
        });
        card.firstElementChild.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                window.open(article.url, "_blank");
            }
        });

        cardsContainer.appendChild(card);
    });

    // Show or hide Load More button
    loadMoreBtn.style.display = totalResults > currentPage * pageSize ? "block" : "none";
}

async function loadNews(query, page = 1, append = false) {
    if (!query) {
        alert("Please enter a search term or select a category.");
        return;
    }

    const data = await fetchNews(query, page);
    if (!data) return;

    totalResults = data.totalResults;

    if (page === 1) {
        articlesCache = data.articles;
        populateSourcesFilter(articlesCache);
    } else {
        articlesCache = articlesCache.concat(data.articles);
    }

    // Apply filters on cached articles and render
    const filtered = filterArticles(articlesCache);
    renderArticles(filtered, append);

    showLoader(false);
}

function onNavItemClick(id) {
    toggleActiveNavItem(id);
    currentQuery = id;
    currentPage = 1;
    saveLastQuery(currentQuery);
    loadNews(currentQuery, currentPage);
}

function onSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        alert("Please enter a search term.");
        return;
    }
    toggleActiveNavItem(null);
    currentQuery = query;
    currentPage = 1;
    saveLastQuery(currentQuery);
    loadNews(currentQuery, currentPage);
}

function onLoadMore() {
    currentPage++;
    loadNews(currentQuery, currentPage, true);
}

function applyFilters() {
    const filtered = filterArticles(articlesCache);
    renderArticles(filtered);
}

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    // Save preference
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
        darkModeToggle.textContent = "☀️";
    } else {
        localStorage.setItem("darkMode", "disabled");
        darkModeToggle.textContent = "🌙";
    }
}

function loadDarkModePreference() {
    const mode = localStorage.getItem("darkMode");
    if (mode === "enabled") {
        document.body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️";
    } else {
        darkModeToggle.textContent = "🌙";
    }
}

// Initialization
window.addEventListener("DOMContentLoaded", () => {
    loadDarkModePreference();

    // Load last query or default
    const lastQuery = loadLastQuery() || "cricket";
    currentQuery = lastQuery;

    // If last query matches a nav item, highlight it
    if ([...navItems].some((item) => item.id === lastQuery)) {
        toggleActiveNavItem(lastQuery);
    } else {
        toggleActiveNavItem(null);
    }

    searchInput.value = lastQuery;

    loadNews(currentQuery, currentPage);

    searchButton.addEventListener("click", onSearch);
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            onSearch();
        }
    });

    navItems.forEach((item) => {
        item.addEventListener("click", () => onNavItemClick(item.id));
    });

    loadMoreBtn.addEventListener("click", onLoadMore);
    filterApplyBtn.addEventListener("click", applyFilters);
    darkModeToggle.addEventListener("click", toggleDarkMode);
});
