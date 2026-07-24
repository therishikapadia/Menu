let menuData = null;
let currentLang = 'en';
let currentFilter = 'all';

// DOM Elements
const restaurantNameEl = document.getElementById('restaurant-name');
const footerRestaurantNameEl = document.getElementById('footer-restaurant-name');
const langSwitch = document.getElementById('lang-switch');
const langEnEl = document.getElementById('lang-en');
const langGuEl = document.getElementById('lang-gu');
const filtersContainer = document.getElementById('filters-container');
const menuGrid = document.getElementById('menu-grid');
const yearEl = document.getElementById('year');

// Set current year in footer
yearEl.textContent = new Date().getFullYear();

// Initialize App
async function initApp() {
  try {
    let response;
    try {
      response = await fetch('menu.json');
      if (!response.ok) throw new Error('menu.json not found');
    } catch (e) {
      response = await fetch('m.json');
    }
    menuData = await response.json();
    
    // Set basic info
    const rName = menuData.restaurant.name || 'Restaurant';
    restaurantNameEl.textContent = rName;
    footerRestaurantNameEl.textContent = rName;
    
    renderFilters();
    renderMenu();
    
    // Listeners
    langSwitch.addEventListener('change', toggleLanguage);
  } catch (error) {
    console.error('Error loading menu:', error);
    menuGrid.innerHTML = '<p>Error loading menu. Please try again later.</p>';
  }
}

// Toggle Language
function toggleLanguage(e) {
  currentLang = e.target.checked ? 'gu' : 'en';
  
  if (currentLang === 'en') {
    langEnEl.classList.add('active');
    langGuEl.classList.remove('active');
  } else {
    langGuEl.classList.add('active');
    langEnEl.classList.remove('active');
  }
  
  renderFilters(); // Re-render filters to update language
  renderMenu();    // Re-render menu items
}

// Render Filters
function renderFilters() {
  filtersContainer.innerHTML = '';
  
  // 'All' Filter
  const allBtn = document.createElement('button');
  allBtn.className = `filter-btn ${currentFilter === 'all' ? 'active' : ''}`;
  allBtn.textContent = currentLang === 'en' ? 'All' : 'બધા';
  allBtn.onclick = () => setFilter('all');
  filtersContainer.appendChild(allBtn);
  
  // Category Filters
  menuData.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${currentFilter === cat.id ? 'active' : ''}`;
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

// Render Menu
function renderMenu() {
  menuGrid.innerHTML = '';
  const currency = menuData.restaurant.currency || '₹';
  
  const categoriesToRender = currentFilter === 'all' 
    ? menuData.categories 
    : menuData.categories.filter(c => c.id === currentFilter);
    
  categoriesToRender.forEach(cat => {
    // Add Category Header & Notes
    const catHeaderWrap = document.createElement('div');
    catHeaderWrap.className = 'category-header-wrap';
    
    let notesHtml = '';
    if (cat.notes) {
      const notesList = cat.notes[currentLang] || cat.notes.en || [];
      if (notesList.length > 0) {
        notesHtml = `<div class="category-notes">${notesList.map(n => `<span class="note-badge">📌 ${n}</span>`).join('')}</div>`;
      }
    }
    
    catHeaderWrap.innerHTML = `
      <h3 class="category-header">${cat.title[currentLang] || cat.title.en}</h3>
      ${notesHtml}
    `;
    menuGrid.appendChild(catHeaderWrap);
    
    // Check if category has direct items
    if (cat.items && cat.items.length > 0) {
      renderItems(cat.items, currency);
    }
    
    // Check if category has subcategories
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories.forEach(subcat => {
        if (subcat.items && subcat.items.length > 0) {
           renderItems(subcat.items, currency, subcat.title);
        }
      });
    }
  });
}

function renderItems(items, currency, subcatTitleObj = null) {
  items.forEach(item => {
    const card = document.createElement('div');
    const isCombo = Boolean(item.originalPrice);
    card.className = `menu-card ${isCombo ? 'combo-card' : ''}`;
    
    const nameStr = item.name ? (item.name[currentLang] || item.name.en) : '';
    let subcatStr = '';
    if (subcatTitleObj) {
      const st = subcatTitleObj[currentLang] || subcatTitleObj.en;
      subcatStr = `<div class="subcat-title">${st}</div>`;
    }
    
    let comboBadgeHtml = '';
    if (isCombo) {
      const tagText = currentLang === 'en' ? '🔥 Combo Offer' : '🔥 કોમ્બો ઓફર';
      comboBadgeHtml = `<div class="combo-badge">${tagText}</div>`;
    }
    
    let priceHtml = '';
    let variantsHtml = '';
    
    if (item.price) {
      if (item.originalPrice) {
        const savings = item.originalPrice - item.price;
        const saveText = currentLang === 'en' ? `Save ${currency}${savings}` : `${currency}${savings} બચત`;
        priceHtml = `
          <div class="price-container">
            <span class="original-price">${currency}${item.originalPrice}</span>
            <span class="item-price">${currency}${item.price}</span>
            ${savings > 0 ? `<span class="save-badge">${saveText}</span>` : ''}
          </div>
        `;
      } else {
        priceHtml = `<span class="item-price">${currency}${item.price}</span>`;
      }
    } else if (item.options && item.options.length > 0) {
      variantsHtml = `<div class="options-container">`;
      item.options.forEach(opt => {
        const typeStr = typeof opt.type === 'object' ? (opt.type[currentLang] || opt.type.en) : opt.type;
        variantsHtml += `
          <div class="option-group">
            <div class="option-group-title">${typeStr}</div>
            <div class="option-variants">
        `;
        opt.variants.forEach(v => {
          const vName = typeof v.name === 'object' ? (v.name[currentLang] || v.name.en) : v.name;
          variantsHtml += `
            <div class="variant-item">
              <span class="variant-name">${vName}</span>
              <span class="variant-price">${currency}${v.price}</span>
            </div>
          `;
        });
        variantsHtml += `</div></div>`;
      });
      variantsHtml += `</div>`;
    } else if (item.variants && item.variants.length > 0) {
      variantsHtml = `<div class="variants-container">`;
      item.variants.forEach(v => {
        const vName = typeof v.name === 'object' ? (v.name[currentLang] || v.name.en) : v.name;
        variantsHtml += `
          <div class="variant-item">
            <span class="variant-name">${vName}</span>
            <span class="variant-price">${currency}${v.price}</span>
          </div>
        `;
      });
      variantsHtml += `</div>`;
    }
    
    card.innerHTML = `
      ${comboBadgeHtml}
      ${subcatStr}
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
document.addEventListener('DOMContentLoaded', initApp);
