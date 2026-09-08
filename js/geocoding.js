/* ==========================================================
   BUSQUEDA DE DIRECCIONES CON REINTENTO
========================================================== */
/* ==========================================================
   BÚSQUEDA DE DIRECCIONES CON REINTENTO
   Pucallpa todavía tiene pocas numeraciones de casas cargadas en el
   mapa (OpenStreetMap), así que buscar "Jr. San Fernando 348" tal cual
   muchas veces no encuentra nada. Por eso reintentamos en varios pasos,
   cada vez con una consulta un poco más general, hasta ubicar al menos
   la calle o la zona correcta:
   1) la dirección completa tal cual la escribió la persona
   2) la misma dirección pero sin el número de casa (solo la calle)
   3) solo la primera palabra clave (por si el resto confunde la búsqueda)
========================================================== */
async function geocodePucallpa(query, limit = 1){
  const runQuery = async (q) => {
    try{
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=${limit}&countrycodes=pe`;
      const res = await fetch(url);
      if(!res.ok) return [];
      return await res.json();
    }catch(err){ return null; } // null = error de red, distinto de "sin resultados"
  };

  const attempts = [];
  const full = query.trim();
  attempts.push(full);

  const withoutNumber = full.replace(/\s*\d+[a-zA-Z°ºª]?\s*$/, '').trim();
  if(withoutNumber && withoutNumber !== full) attempts.push(withoutNumber);

  const firstWords = full.split(/\s+/).slice(0, 3).join(' ');
  if(firstWords && firstWords !== full && firstWords !== withoutNumber) attempts.push(firstWords);

  for(let i = 0; i < attempts.length; i++){
    const results = await runQuery(`${attempts[i]}, Pucallpa, Perú`);
    if(results === null) return { results: [], exact: false, networkError: true };
    if(results.length) return { results, exact: i === 0, networkError: false };
  }
  return { results: [], exact: false, networkError: false };
}

async function searchAddressSuggestions(q){
  addrListEl.innerHTML = `<div class="addr-empty">Buscando en el mapa de Pucallpa…</div>`;
  const { results, exact, networkError } = await geocodePucallpa(q, 6);
  if(networkError){
    addrListEl.innerHTML = `<div class="addr-empty">No pudimos buscar en este momento. Intenta de nuevo.</div>`;
    return;
  }
  if(!results.length){
    addrListEl.innerHTML = `<div class="addr-empty">No encontramos esa dirección en Pucallpa.<br>Prueba con otra referencia (por ejemplo solo la calle) o ubica el pin en el mapa.</div>`;
    return;
  }
  addrListEl.innerHTML = (exact ? '' : `<div class="addr-empty" style="padding:10px 4px; text-align:left;">No encontramos el número exacto — te mostramos lo más cercano a esa calle/zona:</div>`) + results.map(r => `
    <div class="addr-item suggestion" data-lat="${r.lat}" data-lng="${r.lon}" data-label="${(r.display_name || '').replace(/"/g,'&quot;')}">
      <div class="addr-pin">🔎</div>
      <div class="addr-info">
        <p class="addr-title">${(r.display_name || '').split(',')[0]}</p>
        <p class="addr-sub">${r.display_name || ''}</p>
      </div>
    </div>
  `).join('');
}
addrBackBtn.addEventListener('click', () => showView(viewHome));
addrAddBtn.addEventListener('click', () => openMapConfirm(customerLocation.lat, customerLocation.lng, `Dirección ${savedAddresses.length + 1}`));
locationPickerBtn.addEventListener('click', openAddresses);

