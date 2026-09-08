/* ==========================================================
   CAMBIO DE VISTAS (home / menu / direcciones / mapa)
========================================================== */
/* ---------- CAMBIO DE VISTAS (home / menú / direcciones / mapa) ---------- */
const viewHome = document.getElementById('view-home');
const viewMenu = document.getElementById('view-menu');
const viewAddresses = document.getElementById('view-addresses');
const viewMapConfirm = document.getElementById('view-map-confirm');
const viewOrders = document.getElementById('view-orders');
const allViews = [viewHome, viewMenu, viewAddresses, viewMapConfirm, viewOrders];
function showView(target){
  allViews.forEach(v => { v.style.display = (v === target) ? (v === viewHome ? '' : 'block') : 'none'; });
  window.scrollTo({ top: 0, behavior: 'auto' });
}
const mvBackBtn = document.getElementById('mv-back-btn');
const mvRestName = document.getElementById('mv-rest-name');
const mvRestStrip = document.getElementById('mv-rest-strip');
const mvCatTabs = document.getElementById('mv-cat-tabs');
const mvDishList = document.getElementById('mv-dish-list');
const locationLabel = document.getElementById('location-label');
const locationPickerBtn = document.getElementById('location-picker');

/* Mapa local + entrega dentro del menú: lo quitamos por ahora (queda para más adelante),
   pero toda la infraestructura de mapas (Leaflet + coordenadas por restaurante) ya está lista
   para reactivarlo cuando se necesite. */

let activeMenuCategory = 'Todos';

function openMenu(rid){
  const r = findRestaurant(rid);
  if(!r) return;
  activeMenuCategory = 'Todos'; // al entrar a un restaurante, siempre arranca mostrando todo
  mvRestName.textContent = r.name;
  mvRestStrip.innerHTML = `
    <img src="${r.image}" alt="${r.name}" onerror="this.style.display='none'">
    <span>${r.sub}</span>
    <span>★ ${r.rating}</span>
    <span>⏱ ${r.time}</span>
    <span>📍 ${r.distanceKm} km</span>
    <span>🛵 ${r.fee}</span>
  `;
  const closedBanner = document.getElementById('mv-closed-banner');
  const status = getRestaurantStatus(r);
  if(r.hours && !status.isOpen){
    closedBanner.style.display = 'flex';
    closedBanner.innerHTML = `🔴 <strong>Este local está cerrado ahora.</strong> ${status.label.replace('Cerrado · ', '')}`;
  } else {
    closedBanner.style.display = 'none';
    closedBanner.innerHTML = '';
  }
  renderCategoryTabs(rid);
  renderMenuDishList(rid);
  showView(viewMenu);
}
function renderCategoryTabs(rid){
  const r = findRestaurant(rid);
  if(!r) return;
  const cats = ['Todos', ...new Set(r.dishes.map(d => d.category))];
  mvCatTabs.innerHTML = cats.map(c => `
    <button class="mv-cat-tab ${c === activeMenuCategory ? 'active' : ''}" data-cat="${c}" type="button">${c}</button>
  `).join('');
}
mvCatTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.mv-cat-tab');
  if(!btn) return;
  const rid = mvDishList.dataset.rid;
  activeMenuCategory = btn.dataset.cat;
  renderCategoryTabs(rid);
  renderMenuDishList(rid);
});
function renderMenuDishList(rid){
  const r = findRestaurant(rid);
  if(!r) return;
  mvDishList.dataset.rid = rid;
  const isClosed = r.hours && !getRestaurantStatus(r).isOpen;
  const dishes = activeMenuCategory === 'Todos' ? r.dishes : r.dishes.filter(d => d.category === activeMenuCategory);
  mvDishList.innerHTML = dishes.map(d => {
    const hasOptions = d.options && d.options.length > 0;
    const qty = hasOptions ? getDishTotalQty(rid, d.id) : getQty(rid, d.id);
    return `
    <div class="dish-row">
      <img class="dish-thumb" src="${d.image}" alt="${d.name}" loading="lazy" decoding="async" onerror="this.style.display='none'">
      <div class="dish-body">
        ${activeMenuCategory === 'Todos' ? `<span class="dish-cat-tag">${d.category}</span>` : ''}
        <h4>${d.name}</h4>
        <p class="dish-desc">${d.desc}</p>
        ${hasOptions && qty > 0 ? `<span class="dish-cart-badge">🛒 ${qty} en tu pedido</span>` : ''}
        <div class="dish-bottom">
          <span class="dish-price">${hasOptions ? 'Desde ' : ''}${fmtMoney(d.price)}</span>
          ${isClosed ? `
            <button class="add-btn disabled" type="button" disabled>Cerrado</button>
          ` : hasOptions ? `
            <button class="add-btn" type="button" data-act="open-options" data-did="${d.id}">Agregar</button>
          ` : qty > 0 ? `
            <div class="stepper">
              <button type="button" data-act="dec" data-did="${d.id}">−</button>
              <span class="qty">${qty}</span>
              <button type="button" data-act="inc" data-did="${d.id}">+</button>
            </div>
          ` : `
            <button class="add-btn" type="button" data-act="inc" data-did="${d.id}">Agregar</button>
          `}
        </div>
      </div>
    </div>
  `;
  }).join('');
}
mvDishList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const rid = mvDishList.dataset.rid;
  const did = btn.dataset.did;
  if(btn.dataset.act === 'open-options'){
    openOptionsModal(rid, did);
    return;
  }
  const delta = btn.dataset.act === 'inc' ? 1 : -1;
  changeQty(rid, did, delta);
});
function closeMenu(){ showView(viewHome); }
mvBackBtn.addEventListener('click', closeMenu);

