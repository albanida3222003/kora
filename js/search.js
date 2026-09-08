/* ==========================================================
   BUSCADOR — overlay de busqueda (mobile y desktop)
========================================================== */
/* ==========================================================
   BUSCADOR — funciona igual en mobile (overlay a pantalla completa)
   y en web (panel flotante debajo del header). Busca coincidencias
   tanto en restaurantes ("Locales") como en platos individuales
   ("Productos", agrupados por restaurante, con scroll horizontal).
========================================================== */
const searchOverlay = document.getElementById('search-overlay');
const searchBody = document.getElementById('search-body');
const searchOverlayInput = document.getElementById('search-overlay-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchBackBtn = document.getElementById('search-back-btn');
const openSearchMobileBtn = document.getElementById('open-search-mobile');
const headerSearchInput = document.querySelector('.search-bar input'); // buscador inline de escritorio

let searchSortPrice = '';   // '', 'asc', 'desc'
let searchSortRating = '';  // '', 'desc'

function openSearch(prefill){
  searchOverlay.classList.add('open');
  searchOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const q = prefill ?? searchOverlayInput.value ?? '';
  searchOverlayInput.value = q;
  renderSearchResults(q);
  setTimeout(() => searchOverlayInput.focus({ preventScroll:true }), 60);
}
function closeSearch(){
  searchOverlay.classList.remove('open');
  searchOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderSearchResults(query){
  const q = (query || '').trim().toLowerCase();
  searchClearBtn.style.display = q ? 'inline-flex' : 'none';

  if(!q){
    searchBody.innerHTML = `<div class="search-empty">Busca por nombre de restaurante o plato — por ejemplo "hamburguesa" o "sushi" 🔍</div>`;
    return;
  }

  const matchedRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.sub.toLowerCase().includes(q) ||
    (r.tags || []).some(t => t.toLowerCase().includes(q))
  );

  const matchedDishGroups = restaurants
    .map(r => ({
      r,
      dishes: r.dishes.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.desc || '').toLowerCase().includes(q)
      )
    }))
    .filter(g => g.dishes.length > 0);

  matchedDishGroups.forEach(g => {
    if(searchSortPrice === 'asc') g.dishes.sort((a, b) => a.price - b.price);
    else if(searchSortPrice === 'desc') g.dishes.sort((a, b) => b.price - a.price);
    if(searchSortRating === 'desc') g.dishes.sort((a, b) => b.rating - a.rating);
  });

  if(matchedRestaurants.length === 0 && matchedDishGroups.length === 0){
    searchBody.innerHTML = `
      <div class="search-empty">No encontramos nada para "<strong>${escapeHtml(query)}</strong>" 😕<br>Prueba con otra palabra.</div>`;
    return;
  }

  let html = '';

  if(matchedRestaurants.length){
    html += `<h3 class="search-section-title">Locales</h3><div class="search-rest-list">`;
    html += matchedRestaurants.map(r => {
      const status = getRestaurantStatus(r);
      return `
      <button class="search-rest-item" type="button" data-rid="${r.id}">
        <img src="${r.image}" alt="${r.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
        <div class="search-rest-info">
          <h4>${r.name}</h4>
          <p>${r.sub}</p>
          <div class="search-rest-meta">
            <span>★ ${r.rating}</span><span>⏱ ${r.time}</span><span>🛵 ${r.fee || fmtMoney(r.feeValue || 5.5)}</span>
            ${r.hours && !status.isOpen ? `<span style="color:#E0553D;">🔴 Cerrado</span>` : ''}
          </div>
        </div>
      </button>
    `;
    }).join('');
    html += `</div>`;
  }

  if(matchedDishGroups.length){
    html += `
      <div class="search-section-head">
        <h3 class="search-section-title">Productos</h3>
        <div class="search-filters">
          <select id="search-sort-price" aria-label="Ordenar por precio">
            <option value="">Precio</option>
            <option value="asc" ${searchSortPrice === 'asc' ? 'selected' : ''}>Menor a mayor</option>
            <option value="desc" ${searchSortPrice === 'desc' ? 'selected' : ''}>Mayor a menor</option>
          </select>
          <select id="search-sort-rating" aria-label="Ordenar por calificación">
            <option value="">Calificación</option>
            <option value="desc" ${searchSortRating === 'desc' ? 'selected' : ''}>Mejor calificados</option>
          </select>
        </div>
      </div>
    `;
    html += matchedDishGroups.map(g => `
      <div class="search-prod-group">
        <button class="search-prod-group-header" type="button" data-rid="${g.r.id}">
          <img src="${g.r.image}" alt="${g.r.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
          <h4>${g.r.name}</h4>
          <span>★ ${g.r.rating}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        <div class="search-prod-row">
          ${g.dishes.map(d => `
            <button class="search-dish-card" type="button" data-rid="${g.r.id}" data-did="${d.id}">
              <img src="${d.image}" alt="${d.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
              <div class="sdc-body">
                <h5>${d.name}</h5>
                <span class="sdc-price">${fmtMoney(d.price)}</span>
                <span class="sdc-rating">★ ${d.rating.toFixed(1)} (${d.reviews})</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  searchBody.innerHTML = html;
}

// Abrir el buscador: desde el ícono de lupa en mobile, o al enfocar/escribir
// en la barra de búsqueda de escritorio.
openSearchMobileBtn?.addEventListener('click', () => openSearch(''));
if(headerSearchInput){
  headerSearchInput.addEventListener('focus', () => openSearch(headerSearchInput.value));
  headerSearchInput.addEventListener('input', () => {
    if(!searchOverlay.classList.contains('open')) openSearch(headerSearchInput.value);
    else { searchOverlayInput.value = headerSearchInput.value; renderSearchResults(headerSearchInput.value); }
  });
}
searchOverlayInput.addEventListener('input', () => {
  if(headerSearchInput) headerSearchInput.value = searchOverlayInput.value;
  renderSearchResults(searchOverlayInput.value);
});
searchClearBtn.addEventListener('click', () => {
  searchOverlayInput.value = '';
  if(headerSearchInput) headerSearchInput.value = '';
  renderSearchResults('');
  searchOverlayInput.focus();
});
searchBackBtn.addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', (e) => { if(e.target === searchOverlay) closeSearch(); });
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch();
});
searchBody.addEventListener('change', (e) => {
  if(e.target.id === 'search-sort-price'){ searchSortPrice = e.target.value; renderSearchResults(searchOverlayInput.value); }
  if(e.target.id === 'search-sort-rating'){ searchSortRating = e.target.value; renderSearchResults(searchOverlayInput.value); }
});
searchBody.addEventListener('click', (e) => {
  const restBtn = e.target.closest('.search-rest-item');
  const groupHeader = e.target.closest('.search-prod-group-header');
  const dishCard = e.target.closest('.search-dish-card');
  const rid = restBtn?.dataset.rid || groupHeader?.dataset.rid || dishCard?.dataset.rid;
  if(rid){ closeSearch(); openMenu(rid); }
});

