let menuData = null;
let currentLang = "en";
let currentFilter = "all";

// DOM Elements
const restaurantNameEl = document.getElementById("restaurant-name");
const footerRestaurantNameEl = document.getElementById(
  "footer-restaurant-name",
);
const langSwitch = document.getElementById("lang-switch");
const langEnEl = document.getElementById("lang-en");
const langGuEl = document.getElementById("lang-gu");
const filtersContainer = document.getElementById("filters-container");
const menuGrid = document.getElementById("menu-grid");
const yearEl = document.getElementById("year");

// Set current year in footer
yearEl.textContent = new Date().getFullYear();

// Initialize App
async function initApp() {
  try {
    let response;
    try {
      response = await fetch("menu.json");
      if (!response.ok) throw new Error("menu.json not found");
    } catch (e) {
      response = await fetch("m.json");
    }
    menuData = await response.json();

    // Set basic info
    const rName = menuData.restaurant.name || "Restaurant";
    restaurantNameEl.textContent = rName;
    footerRestaurantNameEl.textContent = rName;

    renderFilters();
    renderMenu();

    // Listeners
    langSwitch.addEventListener("change", toggleLanguage);
  } catch (error) {
    console.error("Error loading menu:", error);
    menuGrid.innerHTML = "<p>Error loading menu. Please try again later.</p>";
  }
}

// Toggle Language
function toggleLanguage(e) {
  currentLang = e.target.checked ? "gu" : "en";

  if (currentLang === "en") {
    langEnEl.classList.add("active");
    langGuEl.classList.remove("active");
  } else {
    langGuEl.classList.add("active");
    langEnEl.classList.remove("active");
  }

  renderFilters(); // Re-render filters to update language
  renderMenu(); // Re-render menu items
}

// Render Filters
function renderFilters() {
  filtersContainer.innerHTML = "";

  // 'All' Filter
  const allBtn = document.createElement("button");
  allBtn.className = `filter-btn ${currentFilter === "all" ? "active" : ""}`;
  allBtn.textContent = currentLang === "en" ? "All" : "બધા";
  allBtn.onclick = () => setFilter("all");
  filtersContainer.appendChild(allBtn);

  // Category Filters
  menuData.categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${currentFilter === cat.id ? "active" : ""}`;
    btn.textContent = cat.title[currentLang] || cat.title.en;
    btn.onclick = () => setFilter(cat.id);
    filtersContainer.appendChild(btn);
  });
}

// Set Filter
function setFilter(id) {
  currentFilter = id;
  renderFilters(); // To update active state
  renderMenu();
}

function renderMenu() {
  menuGrid.innerHTML = "";
  const currency = menuData.restaurant.currency || "₹";

  const categoriesToRender =
    currentFilter === "all"
      ? menuData.categories
      : menuData.categories.filter((c) => c.id === currentFilter);

  categoriesToRender.forEach((cat) => {
    // Category Header
    const catHeaderWrap = document.createElement("div");
    catHeaderWrap.className = "category-header-wrap";

    let notesHtml = "";
    if (cat.notes) {
      const notesList = cat.notes[currentLang] || cat.notes.en || [];
      if (notesList.length) {
        notesHtml = `
            <div class="category-notes">
              ${notesList
                .map((n) => `<span class="note-badge">📌 ${n}</span>`)
                .join("")}
            </div>
          `;
      }
    }

    catHeaderWrap.innerHTML = `
        <h3 class="category-header">
          ${cat.title[currentLang] || cat.title.en}
        </h3>
        ${notesHtml}
      `;

    menuGrid.appendChild(catHeaderWrap);

    // Render normal items
    if (cat.items && cat.items.length) {
      renderItems(cat.items, currency);
    }

    // Render sections (like Sandwich sections)
    if (cat.sections && cat.sections.length) {
      cat.sections.forEach((section) => {
        const sectionHeader = document.createElement("div");
        sectionHeader.className = "subcategory-header-wrap";
        sectionHeader.innerHTML = `
            <h4 class="subcategory-header">
              ${section.title[currentLang] || section.title.en}
            </h4>
          `;
        menuGrid.appendChild(sectionHeader);

        renderItems(section.items, currency, section.priceLabels);
      });
    }

    // Render subcategories (if any)
    if (cat.subcategories && cat.subcategories.length) {
      cat.subcategories.forEach((subcat) => {
        const sectionHeader = document.createElement("div");
        sectionHeader.className = "subcategory-header-wrap";
        sectionHeader.innerHTML = `
            <h4 class="subcategory-header">
              ${subcat.title[currentLang] || subcat.title.en}
            </h4>
          `;
        menuGrid.appendChild(sectionHeader);

        renderItems(subcat.items, currency);
      });
    }
  });
}

function renderItems(items, currency, priceLabels = null) {
  items.forEach((item) => {
    if (!item.name) return;

    const card = document.createElement("div");
    const isCombo = Boolean(item.originalPrice);
    const hasPricesObject = Boolean(item.prices);
    card.className = `menu-card ${isCombo ? "combo-card" : ""}`;

    const nameStr = item.name[currentLang] || item.name.en;

    let comboBadgeHtml = "";

    if (isCombo) {
      comboBadgeHtml = `
        <div class="combo-badge">
          ${currentLang === "en" ? "🔥 Combo Offer" : "🔥 કોમ્બો ઓફર"}
        </div>
      `;
    }

    let priceHtml = "";
    let variantsHtml = "";

    // Handle items with prices object (like 2 Layer / 3 Layer)
    if (hasPricesObject) {
      const prices = item.prices;
      const labels = priceLabels || Object.keys(prices);

      // Check if any price exists
      const hasAnyPrice = Object.values(prices).some(
        (price) => price !== null && price !== undefined,
      );

      // If only one price exists, show it as single price
      const availablePrices = Object.entries(prices).filter(
        ([key, value]) => value !== null && value !== undefined,
      );

      if (availablePrices.length === 1) {
        // Single price - show without layer label
        const [key, price] = availablePrices[0];
        priceHtml = `<span class="item-price">${currency}${price}</span>`;
      } else if (availablePrices.length > 1) {
        // Multiple prices - show with layer labels
        priceHtml = '<div class="prices-container">';

        labels.forEach((label) => {
          const price = prices[label];
          const displayLabel =
            currentLang === "gu"
              ? label === "2Layer"
                ? "૨ લેયર"
                : label === "3Layer"
                  ? "૩ લેયર"
                  : label
              : label === "2Layer"
                ? "2 Layer"
                : label === "3Layer"
                  ? "3 Layer"
                  : label;

          if (price !== null && price !== undefined) {
            priceHtml += `
              <div class="variant-item">
                <span class="variant-name">${displayLabel}</span>
                <span class="variant-price">${currency}${price}</span>
              </div>
            `;
          }
          // Don't show N/A items at all - hide them completely
        });

        priceHtml += "</div>";
      } else {
        // No prices available
        priceHtml = `<span class="item-price">${currentLang === "en" ? "Price unavailable" : "ભાવ ઉપલબ્ધ નથી"}</span>`;
      }
    }
    // Single price
    else if (item.price !== undefined) {
      if (item.originalPrice) {
        const savings = item.originalPrice - item.price;

        priceHtml = `
          <div class="price-container">
            <span class="original-price">${currency}${item.originalPrice}</span>
            <span class="item-price">${currency}${item.price}</span>
            <span class="save-badge">
              ${
                currentLang === "en"
                  ? `Save ${currency}${savings}`
                  : `${currency}${savings} બચત`
              }
            </span>
          </div>
        `;
      } else {
        priceHtml = `<span class="item-price">${currency}${item.price}</span>`;
      }
    }

    // Options
    if (item.options && item.options.length) {
      variantsHtml += `<div class="options-container">`;

      item.options.forEach((opt) => {
        const heading = opt.type || opt.name || {};
        const title =
          typeof heading === "object"
            ? heading[currentLang] || heading.en
            : heading;

        variantsHtml += `
          <div class="option-group">
            ${title ? `<div class="option-group-title">${title}</div>` : ""}
        `;

        opt.variants.forEach((v) => {
          const variantName =
            typeof v.name === "object"
              ? v.name[currentLang] || v.name.en
              : v.name;

          variantsHtml += `
            <div class="variant-item">
              <span class="variant-name">${variantName}</span>
              <span class="variant-price">${currency}${v.price}</span>
            </div>
          `;
        });

        variantsHtml += `</div>`;
      });

      variantsHtml += `</div>`;
    }

    // Variants
    else if (item.variants && item.variants.length) {
      variantsHtml += `<div class="variants-container">`;

      item.variants.forEach((v) => {
        const variantName =
          typeof v.name === "object"
            ? v.name[currentLang] || v.name.en
            : v.name;

        variantsHtml += `
          <div class="variant-item">
            <span class="variant-name">${variantName}</span>
            <span class="variant-price">${currency}${v.price}</span>
          </div>
        `;
      });

      variantsHtml += `</div>`;
    }

    // Includes (Combo)
    if (item.includes) {
      const list = item.includes[currentLang] || item.includes.en;

      variantsHtml += `
        <div class="combo-includes">
          <strong>${currentLang === "en" ? "Includes:" : "સમાવેશ:"}</strong>
          <ul>
            ${list.map((x) => `<li>${x}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    card.innerHTML = `
      ${comboBadgeHtml}

      <div class="item-header">
        <h4 class="item-name">${nameStr}</h4>
        ${priceHtml}
      </div>

      ${variantsHtml}
    `;

    menuGrid.appendChild(card);
  });
}
// Start
document.addEventListener("DOMContentLoaded", initApp);
