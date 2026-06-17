// ==========================================================================
// GLOBALS & STATE MANAGEMENT
// ==========================================================================
let siteData = null;
let isAdminMode = false;
let currentProduct = null;
let currentGalleryIndex = 0;
let currentEditProductId = null;
let currentEditSectionId = null;
let uploadedImages = []; // Stores image paths/base64 strings during product editing
let activeSectionFilter = 'all';
let searchQuery = '';

// Default fallback data in case data.json fails to fetch
const fallbackDefaultData = {
  settings: {
    companyName: "AURA",
    companyTagline: "Premium Lifestyle & Tech Boutique",
    heroTitle: "Curated Design for Modern Living",
    heroSubtitle: "Explore our handpicked collection of minimalist furniture and next-generation smart devices.",
    whatsappNumber: "15550199",
    emailAddress: "hello@auradesign.com",
    currency: "$"
  },
  sections: []
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  initTheme();
  renderApp();
  
  // Setup dropzone events for product image upload
  setupDropzone();
  
  // Close modals when clicking outside the content box
  window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
      closeModal(event.target.id);
    }
  };
});

// Load data from localStorage (user changes) or fetch from data.json (repo default)
async function loadData() {
  const localData = localStorage.getItem('brochure_data');
  if (localData) {
    try {
      siteData = JSON.parse(localData);
      showToast("Loaded catalog settings from local storage.");
      return;
    } catch (e) {
      console.error("Failed to parse localStorage data, falling back to data.json", e);
    }
  }
  
  // Fetch from data.json
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error("Network response was not ok");
    siteData = await response.json();
    // Cache locally for performance and edits
    localStorage.setItem('brochure_data', JSON.stringify(siteData));
  } catch (error) {
    console.error("Error fetching data.json, using fallback layout", error);
    siteData = fallbackDefaultData;
  }
}

// Save data to state and localStorage
function saveData() {
  localStorage.setItem('brochure_data', JSON.stringify(siteData));
  renderApp();
}

// Reset data back to default data.json template
async function resetToDefaultData() {
  if (confirm("Are you sure you want to discard ALL custom edits and restore the default catalog? This cannot be undone.")) {
    localStorage.removeItem('brochure_data');
    await loadData();
    renderApp();
    showToast("Discards saved. Reset to default catalog.");
  }
}

// ==========================================================================
// RENDERING LAYOUT
// ==========================================================================
function renderApp() {
  renderSettings();
  renderNavigation();
  renderCatalog();
}

// Populate branding details across the site based on settings
function renderSettings() {
  const s = siteData.settings;
  
  // Brand name references
  document.getElementById("company-name-nav").textContent = s.companyName;
  document.getElementById("company-name-footer").textContent = s.companyName;
  document.getElementById("company-name-copy").textContent = s.companyName;
  
  // Tagline references
  document.getElementById("company-tagline-hero").textContent = s.companyTagline;
  document.getElementById("company-tagline-footer").textContent = s.companyTagline;
  
  // Hero text
  document.getElementById("hero-title").textContent = s.heroTitle;
  document.getElementById("hero-subtitle").textContent = s.heroSubtitle;
  
  // Page Title and Meta Description (SEO)
  document.title = `${s.companyName} | ${s.companyTagline}`;
  document.getElementById("meta-title").textContent = `${s.companyName} | ${s.companyTagline}`;
  document.getElementById("meta-description").setAttribute("content", s.heroSubtitle);
  
  // Footer inquiry links
  const waFooter = document.getElementById("footer-whatsapp");
  if (s.whatsappNumber) {
    waFooter.href = `https://wa.me/${s.whatsappNumber.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(s.companyName)}!%20I%20am%20interested%20in%20your%20products.`;
    waFooter.classList.remove("hidden");
    document.getElementById("footer-whatsapp-text").textContent = `WhatsApp: +${s.whatsappNumber}`;
  } else {
    waFooter.classList.add("hidden");
  }
  
  const emailFooter = document.getElementById("footer-email");
  if (s.emailAddress) {
    emailFooter.href = `mailto:${s.emailAddress}?subject=Product%20Inquiry%20-%20${encodeURIComponent(s.companyName)}`;
    emailFooter.classList.remove("hidden");
    document.getElementById("footer-email-text").textContent = s.emailAddress;
  } else {
    emailFooter.classList.add("hidden");
  }
}

// Renders top navbar links and category quicknav pills
function renderNavigation() {
  const sections = siteData.sections;
  
  // Navbar Links
  const navLinksContainer = document.getElementById("nav-links");
  navLinksContainer.innerHTML = '';
  
  // Add Catalog home
  const homeLi = document.createElement("li");
  homeLi.innerHTML = `<a href="#hero" class="active">Home</a>`;
  navLinksContainer.appendChild(homeLi);
  
  sections.forEach(sec => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="#${sec.id}">${sec.title}</a>`;
    navLinksContainer.appendChild(li);
  });
  
  // Category Quick Link Pills
  const pillsContainer = document.getElementById("category-pills");
  pillsContainer.innerHTML = '';
  
  // "All" Pill
  const allPill = document.createElement("button");
  allPill.className = `category-pill ${activeSectionFilter === 'all' ? 'active' : ''}`;
  allPill.textContent = "All Collections";
  allPill.onclick = () => filterBySection('all');
  pillsContainer.appendChild(allPill);
  
  sections.forEach(sec => {
    const pill = document.createElement("button");
    pill.className = `category-pill ${activeSectionFilter === sec.id ? 'active' : ''}`;
    pill.textContent = sec.title;
    pill.onclick = () => filterBySection(sec.id);
    pillsContainer.appendChild(pill);
  });
  
  // Re-register navbar link highlighters
  setupScrollSpy();
}

// Scroll Spy to highlight active navbar section
function setupScrollSpy() {
  const links = document.querySelectorAll(".nav-menu a");
  const sections = document.querySelectorAll(".catalog-section-group, .hero-section");
  
  window.onscroll = () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 120) {
        current = section.getAttribute("id");
      }
    });
    
    links.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  };
}

// Filter the catalog by section click
function filterBySection(sectionId) {
  activeSectionFilter = sectionId;
  renderNavigation();
  renderCatalog();
  
  if (sectionId !== 'all') {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

// Render the actual catalog sections and products
function renderCatalog() {
  const container = document.getElementById("sections-container");
  container.innerHTML = '';
  
  let sectionsToRender = siteData.sections;
  
  // If a specific section is filtered, narrow down
  if (activeSectionFilter !== 'all') {
    sectionsToRender = sectionsToRender.filter(s => s.id === activeSectionFilter);
  }
  
  let totalFound = 0;
  
  sectionsToRender.forEach(sec => {
    // Filter products in section if search query exists
    let filteredProducts = sec.products || [];
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.tagline.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        (p.features && p.features.some(f => f.toLowerCase().includes(q)))
      );
    }
    
    // Skip rendering section if filtering/searching and no products match
    if (searchQuery.trim() !== '' && filteredProducts.length === 0) {
      return;
    }
    
    totalFound += filteredProducts.length;
    
    const sectionElement = document.createElement("section");
    sectionElement.className = "catalog-section-group";
    sectionElement.id = sec.id;
    
    // Section header HTML
    let sectionHeaderHtml = `
      <div class="section-header-block">
        <div class="section-title-wrap">
          <h3>${sec.title}</h3>
          ${sec.description ? `<p>${sec.description}</p>` : ''}
        </div>
    `;
    
    // Section admin controls
    if (isAdminMode) {
      sectionHeaderHtml += `
        <div class="section-admin-actions">
          <button class="btn-icon-sm" onclick="openSectionFormModal('${sec.id}')" title="Edit Section Description/Name"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon-sm btn-danger" onclick="deleteSection('${sec.id}', event)" title="Delete Section & Products"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
    }
    
    sectionHeaderHtml += `</div>`; // Close header block
    
    // Products Grid HTML
    let productsGridHtml = `<div class="products-grid">`;
    
    if (filteredProducts.length === 0) {
      productsGridHtml += `
        <div class="loading-state" style="grid-column: 1/-1; padding: 40px 0;">
          <i class="fa-solid fa-box-open" style="font-size: 30px;"></i>
          <p>No products in this collection yet.</p>
          ${isAdminMode ? `<button class="btn btn-secondary btn-small" onclick="openProductFormModal(null, '${sec.id}')"><i class="fa-solid fa-plus"></i> Add Product</button>` : ''}
        </div>
      `;
    } else {
      filteredProducts.forEach(prod => {
        const primaryImage = (prod.images && prod.images.length > 0) ? prod.images[0] : 'https://placehold.co/400x300?text=No+Image';
        const formattedPrice = formatPrice(prod.price);
        
        let cardAdminHtml = '';
        if (isAdminMode) {
          cardAdminHtml = `
            <div class="card-admin-overlay">
              <button class="btn-icon-sm" onclick="openProductFormModal('${prod.id}', '${sec.id}', event)" title="Edit Product"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon-sm btn-danger" onclick="deleteProduct('${prod.id}', event)" title="Delete Product"><i class="fa-solid fa-trash"></i></button>
            </div>
          `;
        }
        
        productsGridHtml += `
          <div class="product-card" onclick="openProductDetailModal('${prod.id}')" style="cursor: pointer;">
            <div class="card-image-box">
              ${cardAdminHtml}
              <img src="${primaryImage}" alt="${prod.name}">
              ${prod.price ? `<span class="card-badge">${formattedPrice}</span>` : ''}
            </div>
            
            <div class="card-info-box">
              <h4>${prod.name}</h4>
              <p class="product-tagline">${prod.tagline}</p>
              
              <div class="card-footer-row">
                <div>
                  <span class="price-estimate">Estimated Value</span>
                  <span class="product-price">${formattedPrice}</span>
                </div>
                <button class="btn-text">View Details <i class="fa-solid fa-arrow-right"></i></button>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    productsGridHtml += `</div>`; // Close grid
    
    sectionElement.innerHTML = sectionHeaderHtml + productsGridHtml;
    container.appendChild(sectionElement);
  });
  
  // Update result count banner
  const countSpan = document.getElementById("results-count");
  if (searchQuery.trim() !== '') {
    countSpan.textContent = `Found ${totalFound} product(s) matching "${searchQuery}"`;
    document.getElementById("clear-search-btn").classList.remove("hidden");
  } else {
    countSpan.textContent = `Showing all products across collections`;
    document.getElementById("clear-search-btn").classList.add("hidden");
  }
  
  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <p>No sections or products matched your query.</p>
        <button class="btn btn-secondary" onclick="clearSearch()">Clear Filters</button>
      </div>
    `;
  }
}

// Helper: Formats prices with the configured currency
function formatPrice(val) {
  if (!val) return "Contact us";
  // If it's already a formatted string containing letters/symbols, return as-is
  if (isNaN(val.trim().replace(siteData.settings.currency, ''))) {
    return val;
  }
  return `${siteData.settings.currency}${parseFloat(val).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// ==========================================================================
// SEARCH & FILTER ACTIONS
// ==========================================================================
function handleSearch(val) {
  searchQuery = val;
  renderCatalog();
}

function handleMobileSearch(val) {
  document.getElementById("search-input").value = val;
  handleSearch(val);
}

function clearSearch() {
  document.getElementById("search-input").value = '';
  const mobSearch = document.getElementById("mobile-search-input");
  if (mobSearch) mobSearch.value = '';
  searchQuery = '';
  activeSectionFilter = 'all';
  renderNavigation();
  renderCatalog();
}

// ==========================================================================
// PRODUCT DETAIL GALLERY & MODAL
// ==========================================================================
function openProductDetailModal(productId) {
  // Find product by id
  let foundProduct = null;
  let sectionTitle = '';
  
  for (let sec of siteData.sections) {
    const match = sec.products.find(p => p.id === productId);
    if (match) {
      foundProduct = match;
      sectionTitle = sec.title;
      break;
    }
  }
  
  if (!foundProduct) {
    showToast("Product details not found.");
    return;
  }
  
  currentProduct = foundProduct;
  currentGalleryIndex = 0;
  
  // Populate modal data
  document.getElementById("detail-category").textContent = sectionTitle;
  document.getElementById("detail-name").textContent = foundProduct.name;
  document.getElementById("detail-tagline").textContent = foundProduct.tagline;
  document.getElementById("detail-price").textContent = formatPrice(foundProduct.price);
  document.getElementById("detail-description").textContent = foundProduct.description;
  
  // Populate Features List
  const featuresList = document.getElementById("detail-features-list");
  featuresList.innerHTML = '';
  if (foundProduct.features && foundProduct.features.length > 0) {
    foundProduct.features.forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      featuresList.appendChild(li);
    });
  } else {
    featuresList.innerHTML = '<li>Standard premium quality guaranteed.</li>';
  }
  
  // Populate Specs Table
  const specsTable = document.getElementById("detail-specs-table");
  specsTable.innerHTML = '';
  if (foundProduct.specs && foundProduct.specs.length > 0) {
    foundProduct.specs.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${s.label}</td><td>${s.value}</td>`;
      specsTable.appendChild(tr);
    });
  } else {
    specsTable.innerHTML = '<tr><td colspan="2">No special specs listed. Contact us for custom designs.</td></tr>';
  }
  
  // Setup WhatsApp & Email Inquiry Links
  const waBtn = document.getElementById("btn-inquire-whatsapp");
  const emailBtn = document.getElementById("btn-inquire-email");
  const s = siteData.settings;
  
  // Format WhatsApp message text
  const formattedPrice = formatPrice(foundProduct.price);
  const waMsg = `Hello ${s.companyName}! I am viewing your website and interested in:
- *${foundProduct.name}* (${foundProduct.tagline})
- Price estimate: ${formattedPrice}

Can you please share availability and ordering details? Thank you.`;
  
  if (s.whatsappNumber) {
    waBtn.href = `https://wa.me/${s.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`;
    waBtn.style.display = 'inline-flex';
  } else {
    waBtn.style.display = 'none';
  }
  
  if (s.emailAddress) {
    emailBtn.href = `mailto:${s.emailAddress}?subject=Catalog%20Inquiry%20-%20${encodeURIComponent(foundProduct.name)}&body=${encodeURIComponent(waMsg)}`;
    emailBtn.style.display = 'inline-flex';
  } else {
    emailBtn.style.display = 'none';
  }
  
  // Render Gallery Images
  renderDetailGallery();
  
  // Switch to description tab by default
  switchDetailTab('desc');
  
  openModal('product-detail-modal');
}

// Render image slider inside product details modal
function renderDetailGallery() {
  const images = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images : ['https://placehold.co/600x450?text=No+Image+Available'];
  
  // Main Image
  const mainImg = document.getElementById("detail-main-img");
  mainImg.src = images[currentGalleryIndex];
  mainImg.alt = `${currentProduct.name} - Image ${currentGalleryIndex + 1}`;
  
  // Gallery navigation visibility
  const prevBtn = document.querySelector(".gallery-nav.prev");
  const nextBtn = document.querySelector(".gallery-nav.next");
  if (images.length <= 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
  }
  
  // Thumbnails
  const thumbsContainer = document.getElementById("detail-thumbs");
  thumbsContainer.innerHTML = '';
  
  if (images.length > 1) {
    images.forEach((imgSrc, idx) => {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.className = `thumb-img ${idx === currentGalleryIndex ? 'active' : ''}`;
      img.alt = `Thumbnail ${idx + 1}`;
      img.onclick = () => {
        currentGalleryIndex = idx;
        renderDetailGallery();
      };
      thumbsContainer.appendChild(img);
    });
  }
}

// Navigate product detail gallery carousel
function navigateGallery(direction) {
  const images = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images : [];
  if (images.length === 0) return;
  
  currentGalleryIndex += direction;
  if (currentGalleryIndex >= images.length) currentGalleryIndex = 0;
  if (currentGalleryIndex < 0) currentGalleryIndex = images.length - 1;
  
  renderDetailGallery();
}

// Modal Detail tab switching logic
function switchDetailTab(tabName) {
  // Reset tab buttons
  const tabs = document.querySelectorAll(".detail-tabs .tab-btn");
  tabs.forEach(tab => tab.classList.remove("active"));
  
  // Reset tab contents
  const contents = document.querySelectorAll(".modal-content .tab-content");
  contents.forEach(content => content.classList.remove("active"));
  
  // Set active
  const activeTabBtn = Array.from(tabs).find(btn => btn.getAttribute("onclick").includes(tabName));
  if (activeTabBtn) activeTabBtn.classList.add("active");
  
  const activeContent = document.getElementById(`tab-${tabName}`);
  if (activeContent) activeContent.classList.add("active");
}

// ==========================================================================
// MODAL GENERAL UTILS
// ==========================================================================
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
  // Clean up any temporary states
  if (modalId === 'product-form-modal') {
    uploadedImages = [];
    currentEditProductId = null;
    currentEditSectionId = null;
  }
  if (modalId === 'section-form-modal') {
    currentEditSectionId = null;
  }
}

// Toggle mobile navigation slide-down menu
function toggleMobileMenu() {
  const menu = document.getElementById("nav-menu");
  menu.classList.toggle("active");
  const icon = document.querySelector("#mobile-menu-btn i");
  if (menu.classList.contains("active")) {
    icon.className = "fa-solid fa-xmark";
  } else {
    icon.className = "fa-solid fa-bars";
  }
}

// ==========================================================================
// THEME TOGGLE (LIGHT & obsidian DARK)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.className = 'dark-mode';
    updateThemeToggleIcon(true);
  } else {
    document.body.className = 'light-mode';
    updateThemeToggleIcon(false);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  if (isDark) {
    document.body.className = 'light-mode';
    localStorage.setItem('theme', 'light');
    updateThemeToggleIcon(false);
  } else {
    document.body.className = 'dark-mode';
    localStorage.setItem('theme', 'dark');
    updateThemeToggleIcon(true);
  }
}

function updateThemeToggleIcon(isDark) {
  const icon = document.querySelector("#theme-toggle i");
  if (isDark) {
    icon.className = "fa-solid fa-sun";
  } else {
    icon.className = "fa-solid fa-moon";
  }
}

// ==========================================================================
// ADMIN MODE CONTROLLER
// ==========================================================================
function toggleAdminMode(forceValue) {
  const targetState = (forceValue !== undefined) ? forceValue : !isAdminMode;
  
  // Verify password if turning on and not session-authorized
  if (targetState === true && sessionStorage.getItem('brochure_auth') !== 'true') {
    openPasswordModal();
    return;
  }
  
  isAdminMode = targetState;
  
  const banner = document.getElementById("admin-banner");
  const adminToggle = document.getElementById("admin-toggle");
  
  if (isAdminMode) {
    document.body.classList.add("admin-active");
    banner.classList.remove("hidden");
    adminToggle.innerHTML = `<i class="fa-solid fa-lock-open"></i> <span>Editing Site</span>`;
    showToast("Editor Dashboard Activated. Double-click fields or use editing buttons.");
  } else {
    document.body.classList.remove("admin-active");
    banner.classList.add("hidden");
    adminToggle.innerHTML = `<i class="fa-solid fa-lock"></i> <span>Edit Site</span>`;
    showToast("Editor closed. Viewing live site layout.");
    
    // De-authorize session on exit
    sessionStorage.removeItem('brochure_auth');
    
    // Close FAB panel
    document.getElementById("admin-fabs").classList.remove("open");
  }
  
  renderApp();
}

function openPasswordModal() {
  document.getElementById("admin-password-input").value = '';
  document.getElementById("password-error").classList.add("hidden");
  openModal('password-modal');
}

function verifyPassword(event) {
  event.preventDefault();
  const inputPass = document.getElementById("admin-password-input").value;
  const correctPass = siteData.settings.adminPassword || "Abcd@123";
  
  if (inputPass === correctPass) {
    sessionStorage.setItem('brochure_auth', 'true');
    closeModal('password-modal');
    toggleAdminMode(true);
  } else {
    document.getElementById("password-error").classList.remove("hidden");
  }
}

function toggleFabMenu() {
  document.getElementById("admin-fabs").classList.toggle("open");
}

// ==========================================================================
// ADMIN: SETTINGS MODAL FORM
// ==========================================================================
function openSettingsModal() {
  const s = siteData.settings;
  document.getElementById("set-company-name").value = s.companyName || '';
  document.getElementById("set-currency").value = s.currency || '$';
  document.getElementById("set-company-tagline").value = s.companyTagline || '';
  document.getElementById("set-hero-title").value = s.heroTitle || '';
  document.getElementById("set-hero-subtitle").value = s.heroSubtitle || '';
  document.getElementById("set-whatsapp").value = s.whatsappNumber || '';
  document.getElementById("set-email").value = s.emailAddress || '';
  document.getElementById("set-password").value = ''; // Reset password field
  
  openModal('settings-modal');
  
  // Close FAB menu
  document.getElementById("admin-fabs").classList.remove("open");
}

function saveSettingsForm(event) {
  event.preventDefault();
  
  siteData.settings.companyName = document.getElementById("set-company-name").value.trim();
  siteData.settings.currency = document.getElementById("set-currency").value.trim();
  siteData.settings.companyTagline = document.getElementById("set-company-tagline").value.trim();
  siteData.settings.heroTitle = document.getElementById("set-hero-title").value.trim();
  siteData.settings.heroSubtitle = document.getElementById("set-hero-subtitle").value.trim();
  siteData.settings.whatsappNumber = document.getElementById("set-whatsapp").value.trim();
  siteData.settings.emailAddress = document.getElementById("set-email").value.trim();
  
  const newPass = document.getElementById("set-password").value.trim();
  if (newPass !== '') {
    siteData.settings.adminPassword = newPass;
  }
  
  saveData();
  closeModal('settings-modal');
  showToast("Branding settings saved successfully.");
}

// ==========================================================================
// ADMIN: SECTION MODAL FORM
// ==========================================================================
function openSectionFormModal(sectionId = null) {
  const modalTitle = document.getElementById("section-modal-title");
  const titleInput = document.getElementById("form-section-title");
  const descInput = document.getElementById("form-section-desc");
  const hiddenId = document.getElementById("form-section-id");
  
  if (sectionId) {
    // Edit existing
    const sec = siteData.sections.find(s => s.id === sectionId);
    if (!sec) return;
    
    currentEditSectionId = sectionId;
    modalTitle.textContent = "Edit Section Header";
    titleInput.value = sec.title;
    descInput.value = sec.description || '';
    hiddenId.value = sectionId;
  } else {
    // Add new
    currentEditSectionId = null;
    modalTitle.textContent = "Create New Section";
    titleInput.value = '';
    descInput.value = '';
    hiddenId.value = '';
  }
  
  openModal('section-form-modal');
  document.getElementById("admin-fabs").classList.remove("open");
}

function saveSectionForm(event) {
  event.preventDefault();
  
  const title = document.getElementById("form-section-title").value.trim();
  const desc = document.getElementById("form-section-desc").value.trim();
  
  if (currentEditSectionId) {
    // Update existing
    const sec = siteData.sections.find(s => s.id === currentEditSectionId);
    if (sec) {
      sec.title = title;
      sec.description = desc;
      showToast(`Updated section header to "${title}"`);
    }
  } else {
    // Create new
    const newSectionId = 'sec-' + title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if ID collision
    const exists = siteData.sections.some(s => s.id === newSectionId);
    const finalId = exists ? `${newSectionId}-${Date.now()}` : newSectionId;
    
    siteData.sections.push({
      id: finalId,
      title: title,
      description: desc,
      products: []
    });
    showToast(`Created new category section "${title}"`);
  }
  
  saveData();
  closeModal('section-form-modal');
}

function deleteSection(sectionId, event) {
  if (event) event.stopPropagation(); // Avoid triggering card details click
  
  const sec = siteData.sections.find(s => s.id === sectionId);
  if (!sec) return;
  
  const confirmMsg = `WARNING: Are you sure you want to delete the section "${sec.title}"?\n\nThis will also delete all ${sec.products.length} products inside it. This action cannot be undone.`;
  if (confirm(confirmMsg)) {
    siteData.sections = siteData.sections.filter(s => s.id !== sectionId);
    saveData();
    showToast(`Deleted section "${sec.title}" and its catalog.`);
  }
}

// ==========================================================================
// ADMIN: PRODUCT MODAL FORM & BUILDERS
// ==========================================================================
function openProductFormModal(productId = null, preferredSectionId = null, event = null) {
  if (event) event.stopPropagation(); // Stop detailing click trigger
  
  // Populate Section Select Option Dropdown
  const selectBox = document.getElementById("form-product-section");
  selectBox.innerHTML = '';
  
  if (siteData.sections.length === 0) {
    alert("Please create a category section first before adding products.");
    openSectionFormModal();
    return;
  }
  
  siteData.sections.forEach(sec => {
    const opt = document.createElement("option");
    opt.value = sec.id;
    opt.textContent = sec.title;
    selectBox.appendChild(opt);
  });
  
  const modalTitle = document.getElementById("product-modal-title");
  
  // Reset dynamic list containers
  document.getElementById("features-inputs-container").innerHTML = '';
  document.getElementById("specs-inputs-container").innerHTML = '';
  uploadedImages = [];
  
  if (productId) {
    // Edit existing product
    let foundProduct = null;
    let parentSectionId = null;
    
    for (let sec of siteData.sections) {
      const match = sec.products.find(p => p.id === productId);
      if (match) {
        foundProduct = match;
        parentSectionId = sec.id;
        break;
      }
    }
    
    if (!foundProduct) return;
    
    currentEditProductId = productId;
    currentEditSectionId = parentSectionId;
    modalTitle.textContent = "Edit Product Details";
    
    document.getElementById("form-product-id").value = foundProduct.id;
    document.getElementById("form-product-name").value = foundProduct.name;
    document.getElementById("form-product-tagline").value = foundProduct.tagline;
    document.getElementById("form-product-price").value = foundProduct.price || '';
    document.getElementById("form-product-desc").value = foundProduct.description;
    document.getElementById("form-product-section").value = parentSectionId;
    
    // Load existing images
    uploadedImages = [...(foundProduct.images || [])];
    
    // Load features rows
    if (foundProduct.features && foundProduct.features.length > 0) {
      foundProduct.features.forEach(f => addFeatureInputRow(f));
    } else {
      addFeatureInputRow();
    }
    
    // Load specs rows
    if (foundProduct.specs && foundProduct.specs.length > 0) {
      foundProduct.specs.forEach(s => addSpecInputRow(s.label, s.value));
    } else {
      addSpecInputRow();
    }
    
  } else {
    // Add new product
    currentEditProductId = null;
    modalTitle.textContent = "Add Product to Brochure";
    
    document.getElementById("form-product-id").value = '';
    document.getElementById("form-product-name").value = '';
    document.getElementById("form-product-tagline").value = '';
    document.getElementById("form-product-price").value = '';
    document.getElementById("form-product-desc").value = '';
    
    if (preferredSectionId) {
      document.getElementById("form-product-section").value = preferredSectionId;
    }
    
    // Initialize with 1 empty row each for specs and features
    addFeatureInputRow();
    addSpecInputRow();
  }
  
  renderUploadedThumbnails();
  openModal('product-form-modal');
  document.getElementById("admin-fabs").classList.remove("open");
}

// Dynamic Feature input rows builder
function addFeatureInputRow(val = '') {
  const container = document.getElementById("features-inputs-container");
  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.innerHTML = `
    <input type="text" class="feature-input" placeholder="e.g. Battery capacity up to 10 hours" value="${val.replace(/"/g, '&quot;')}">
    <button type="button" class="btn-icon-sm btn-danger" onclick="removeDynamicRow(this)" title="Remove item"><i class="fa-solid fa-minus"></i></button>
  `;
  container.appendChild(row);
}

// Dynamic Specifications input rows builder
function addSpecInputRow(label = '', value = '') {
  const container = document.getElementById("specs-inputs-container");
  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.innerHTML = `
    <input type="text" class="spec-label-input" placeholder="Spec Name (e.g. Dimensions)" value="${label.replace(/"/g, '&quot;')}">
    <input type="text" class="spec-value-input" placeholder="Value (e.g. 10 x 20 cm)" value="${value.replace(/"/g, '&quot;')}">
    <button type="button" class="btn-icon-sm btn-danger" onclick="removeDynamicRow(this)" title="Remove item"><i class="fa-solid fa-minus"></i></button>
  `;
  container.appendChild(row);
}

function removeDynamicRow(btn) {
  btn.parentElement.remove();
}

// Save product edits / new product
function saveProductForm(event) {
  event.preventDefault();
  
  const sectionSelectId = document.getElementById("form-product-section").value;
  const name = document.getElementById("form-product-name").value.trim();
  const tagline = document.getElementById("form-product-tagline").value.trim();
  const price = document.getElementById("form-product-price").value.trim();
  const description = document.getElementById("form-product-desc").value.trim();
  
  // Extract features
  const featureInputs = document.querySelectorAll(".feature-input");
  const features = [];
  featureInputs.forEach(input => {
    if (input.value.trim() !== '') features.push(input.value.trim());
  });
  
  // Extract specs
  const specLabelInputs = document.querySelectorAll(".spec-label-input");
  const specValueInputs = document.querySelectorAll(".spec-value-input");
  const specs = [];
  
  for (let i = 0; i < specLabelInputs.length; i++) {
    const label = specLabelInputs[i].value.trim();
    const value = specValueInputs[i].value.trim();
    if (label !== '' && value !== '') {
      specs.push({ label, value });
    }
  }
  
  // Package product object
  const productData = {
    id: currentEditProductId || ('prod-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()),
    name: name,
    tagline: tagline,
    price: price,
    description: description,
    images: uploadedImages.length > 0 ? uploadedImages : ['https://placehold.co/600x450?text=Aura+Product'],
    features: features,
    specs: specs
  };
  
  // Locate target section
  const targetSection = siteData.sections.find(s => s.id === sectionSelectId);
  if (!targetSection) {
    alert("Target section category not found.");
    return;
  }
  
  if (currentEditProductId) {
    // If section changed, we must move it
    if (currentEditSectionId !== sectionSelectId) {
      // Remove from old section
      const oldSection = siteData.sections.find(s => s.id === currentEditSectionId);
      if (oldSection) {
        oldSection.products = oldSection.products.filter(p => p.id !== currentEditProductId);
      }
      // Add to new section
      targetSection.products.push(productData);
    } else {
      // Update inside original section
      const idx = targetSection.products.findIndex(p => p.id === currentEditProductId);
      if (idx !== -1) {
        targetSection.products[idx] = productData;
      }
    }
    showToast(`Updated product "${name}" successfully.`);
  } else {
    // Add to section
    targetSection.products.push(productData);
    showToast(`Added new product "${name}" to collection.`);
  }
  
  saveData();
  closeModal('product-form-modal');
}

function deleteProduct(productId, event) {
  if (event) event.stopPropagation(); // Avoid triggering modal view
  
  let foundProduct = null;
  let sectionTitle = '';
  
  for (let sec of siteData.sections) {
    const match = sec.products.find(p => p.id === productId);
    if (match) {
      foundProduct = match;
      sectionTitle = sec.title;
      break;
    }
  }
  
  if (!foundProduct) return;
  
  if (confirm(`Are you sure you want to delete the product "${foundProduct.name}" from the collection?`)) {
    for (let sec of siteData.sections) {
      const idx = sec.products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        sec.products.splice(idx, 1);
        break;
      }
    }
    saveData();
    showToast(`Deleted product "${foundProduct.name}" from catalog.`);
  }
}

// ==========================================================================
// IMAGE UPLOADER LOGIC (COMPRESSION & DATA PREVIEW)
// ==========================================================================
function triggerFileInput() {
  document.getElementById("form-file-input").click();
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById("upload-dropzone").classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  document.getElementById("upload-dropzone").classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("upload-dropzone").classList.remove("dragover");
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processUploadedFiles(files);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processUploadedFiles(files);
  }
}

// Process files, compress them using HTML5 canvas, and append base64 strings
async function processUploadedFiles(files) {
  showToast(`Processing ${files.length} image(s)...`);
  for (let file of files) {
    if (!file.type.startsWith('image/')) {
      showToast("Skip non-image file selection.");
      continue;
    }
    
    try {
      const compressedDataUrl = await compressImage(file);
      uploadedImages.push(compressedDataUrl);
    } catch (err) {
      console.error("Image compression error", err);
      showToast("Error compressing image.");
    }
  }
  
  renderUploadedThumbnails();
}

// Client-side canvas compression down to maximum 800px width/height and 75% jpeg quality
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;
        
        // Calculate aspect ratios for resizing
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress image to JPEG at 75% quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Custom manual URL addition helper
function addImageUrl() {
  const urlField = document.getElementById("form-image-url");
  const val = urlField.value.trim();
  
  if (val === '') {
    showToast("Please enter a valid photo URL.");
    return;
  }
  
  uploadedImages.push(val);
  urlField.value = '';
  renderUploadedThumbnails();
  showToast("Image URL added to gallery.");
}

function deleteUploadedThumbnail(idx) {
  uploadedImages.splice(idx, 1);
  renderUploadedThumbnails();
}

// Render dynamic thumbnail stripes in product editor form
function renderUploadedThumbnails() {
  const container = document.getElementById("uploaded-thumbnails");
  container.innerHTML = '';
  
  uploadedImages.forEach((imgSrc, idx) => {
    const box = document.createElement("div");
    box.className = "thumbnail-preview-box";
    box.innerHTML = `
      <img src="${imgSrc}" alt="Product thumb">
      <button type="button" class="thumbnail-delete-btn" onclick="deleteUploadedThumbnail(${idx})" title="Remove photo">&times;</button>
    `;
    container.appendChild(box);
  });
}

function setupDropzone() {
  // Prevent browser default behavior
  const dropzone = document.getElementById("upload-dropzone");
  if (!dropzone) return;
}

// ==========================================================================
// EXPORT & CONFIGURATION MANAGING (JSON FILE DOWNLOADS)
// ==========================================================================
function openExportModal() {
  const jsonStr = JSON.stringify(siteData, null, 2);
  document.getElementById("export-json-preview").value = jsonStr;
  
  openModal('export-modal');
  document.getElementById("admin-fabs").classList.remove("open");
}

function downloadConfig() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(siteData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "data.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Downloaded data.json. Save it in your repository.");
}

function copyConfigToClipboard() {
  const copyText = document.getElementById("export-json-preview");
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices
  
  navigator.clipboard.writeText(copyText.value)
    .then(() => {
      showToast("Config JSON copied to clipboard.");
    })
    .catch(() => {
      showToast("Failed to copy code. Please copy manually.");
    });
}

function triggerImportFileInput() {
  document.getElementById("import-file-input").click();
}

// Import external JSON configuration database file
function importConfigFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      
      // Basic schema validator validation
      if (parsed.settings && parsed.sections) {
        siteData = parsed;
        saveData();
        closeModal('export-modal');
        showToast("Brochure data configuration imported successfully.");
      } else {
        alert("Invalid file format. The file must contain 'settings' and 'sections' objects.");
      }
    } catch (err) {
      alert("Failed to parse JSON file. Ensure the file contains valid JSON code.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  // Clear input
  event.target.value = '';
}

// ==========================================================================
// TOAST BANNER NOTIFIER
// ==========================================================================
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-message");
  
  msg.textContent = message;
  toast.classList.remove("hidden");
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}
