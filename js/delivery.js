/* ==========================================================
   UBICACION Y CALCULO DE ENVIO + grilla de restaurantes
========================================================== */
/* ==========================================================
   UBICACIÓN Y CÁLCULO DE ENVÍO
   Fórmula: S/ 3.00 por km de distancia entre el
   local y el cliente, con un mínimo de S/ 6.00 por pedido.
   Para producción: guarda la ubicación del cliente y recalcula
   esto en el backend antes de cobrar, nunca confíes solo en el
   cálculo hecho en el navegador.
========================================================== */
const PUCALLPA_CENTER = { lat:-8.3791, lng:-74.5539 }; // Plaza de Armas, usado como fallback si no comparten GPS

// Direcciones guardadas del cliente — en producción esto vive en tu backend (p.ej. Supabase),
// ligado a su cuenta, en vez de en memoria del navegador.
let savedAddresses = [
  { id: 1, label:'Casa', address:'San Fernando Mz. 14 - Lt. 5, Pucallpa', addressNote:'', reference:'', lat:-8.3729, lng:-74.5697 }
];
let activeAddressId = 1;
let addrIdSeq = 2;

let customerLocation = { lat: savedAddresses[0].lat, lng: savedAddresses[0].lng };
let locationIsPrecise = false;

function haversineKm(lat1, lon1, lat2, lon2){
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ==========================================================
   LOCALES SOCIOS vs EXTERNOS
   Cada restaurante trae `partnerType: 'socio' | 'externo'`.
   - 'socio'  -> paga las condiciones normales de la plataforma.
   - 'externo'-> no tiene convenio con nosotros, así que se le suma un
                 recargo fijo al envío. Esto es una decisión interna del
                 negocio: el cliente SIEMPRE ve un solo precio de envío
                 (nunca el desglose), así que este recargo va absorbido
                 directo en `r.feeValue` / `r.fee` antes de mostrarse.
   Para producción: este campo debería vivir en tu tabla `restaurants`
   del backend, no ser editable desde el navegador del cliente.
========================================================== */
const EXTERNAL_PARTNER_SURCHARGE = 1.5; // recargo interno para locales externos (no lo ve el cliente)

function calcDeliveryFee(km, isExternalPartner){
  const raw = 3 * km;
  // Redondeo al 0.1 más cercano y mínimo de S/ 6.00 por pedido.
  const base = Math.max(6, Math.round(raw * 10) / 10);
  const withSurcharge = isExternalPartner ? base + EXTERNAL_PARTNER_SURCHARGE : base;
  return Math.round(withSurcharge * 10) / 10;
}
function updateAllFees(){
  restaurants.forEach(r => {
    const km = haversineKm(customerLocation.lat, customerLocation.lng, r.lat, r.lng);
    r.distanceKm = Math.round(km * 10) / 10;
    r.feeValue = calcDeliveryFee(km, r.partnerType === 'externo');
    r.fee = `S/ ${r.feeValue.toFixed(1)}`; // precio final único — sin desglose visible del recargo
  });
}
updateAllFees(); // primer cálculo con la dirección guardada, para que los precios salgan ni bien carga la página


const grid = document.getElementById('restaurant-grid');
let activeCategory = 'todos';
function renderRestaurantGrid(){
  const list = activeCategory === 'todos'
    ? restaurants
    : restaurants.filter(r => (r.cats || []).includes(activeCategory));

  if(list.length === 0){
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px 10px; color:var(--text-soft);">
        <p style="font-size:1rem; margin:0 0 4px;">Todavía no tenemos locales en esta categoría por aquí 🛵</p>
        <p style="font-size:.85rem; margin:0;">Prueba con otra categoría o revisa "Todos".</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((r, i) => {
    const status = getRestaurantStatus(r);
    return `
    <div class="r-card ${status.isOpen ? '' : 'is-closed'}" data-rid="${r.id}" data-partner="${r.partnerType || 'socio'}" style="cursor:pointer;">
      <div class="r-thumb">
        <img src="${r.image}" alt="${r.name}" loading="lazy" onerror="this.style.display='none'">
        ${!status.isOpen ? `<span class="r-closed-badge">Cerrado</span>` : r.badge ? `<span class="r-badge ${r.badge.type}">${r.badge.label}</span>` : ''}
        <button class="r-fav" data-i="${i}" type="button" aria-label="Guardar en favoritos">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 1.9 6 5.3 5c2-.6 3.9.2 5 1.8L12 8.5l1.7-1.7c1.1-1.6 3-2.4 5-1.8 3.4 1 4.5 4.8 2.6 7.9C18.7 16.65 12 21 12 21z"/></svg>
        </button>
      </div>
      <div class="r-body">
        <h3>${r.name}</h3>
        <p class="r-sub">${r.sub}</p>
        ${r.hours ? `<p class="r-hours-status ${status.isOpen ? 'open' : 'closed'}">${status.isOpen ? '🟢' : '🔴'} ${status.label}</p>` : ''}
        <div class="r-tags">${r.tags.map(t => `<span class="r-tag">${t}</span>`).join('')}</div>
        <div class="r-meta">
          <span class="rating">★ ${r.rating} <span style="color:var(--text-soft); font-weight:600;">(${r.reviews})</span></span>
          <span class="m-item">⏱ ${r.time}</span>
          <span class="m-item">📍 ${r.distanceKm} km</span>
          <span class="m-item">🛵 ${r.fee}</span>
          <span class="m-item">Mín. ${r.min}</span>
        </div>
      </div>
    </div>
  `;
  }).join('');
}
renderRestaurantGrid();
grid.addEventListener('click', (e) => {
  const fav = e.target.closest('.r-fav');
  if(fav){ fav.classList.toggle('active'); return; }
  const card = e.target.closest('.r-card');
  if(!card) return;
  openMenu(card.dataset.rid);
});

