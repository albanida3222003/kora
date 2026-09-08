/* ==========================================================
   VISTA: CONFIRMAR DIRECCION (mapa real con Leaflet)
========================================================== */
/* ---------- VISTA: CONFIRMAR DIRECCIÓN (mapa real, pin fijo al centro) ---------- */
let confirmMap = null;
let confirmMoveTimer = null;
let confirmPendingLabel = 'Nueva dirección';
let editingAddressId = null; // si está seteado, "Continuar" actualiza esta dirección en vez de crear una nueva
let mapConfirmReturnTo = 'addresses'; // 'addresses' o 'cart' — a dónde volver al terminar
const confirmAddressText = document.getElementById('confirm-address-text');
const mapBackBtn = document.getElementById('map-back-btn');
const mapLocateBtn = document.getElementById('map-locate-btn');
const confirmAddressBtn = document.getElementById('confirm-address-btn');

function ensureConfirmMap(lat, lng){
  if(confirmMap){
    confirmMap.setView([lat, lng], 17);
    setTimeout(() => confirmMap.invalidateSize(), 80);
    return confirmMap;
  }
  confirmMap = L.map('confirm-map', { zoomControl:true }).setView([lat, lng], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(confirmMap);
  confirmMap.on('moveend', () => {
    clearTimeout(confirmMoveTimer);
    confirmMoveTimer = setTimeout(updateConfirmAddress, 350);
  });
  setTimeout(() => confirmMap.invalidateSize(), 80);

  // En mobile, la barra del navegador aparece/desaparece al hacer scroll y
  // cambia el alto real de la pantalla. Sin esto, Leaflet se queda con un
  // tamaño de mapa "viejo" y los tiles se ven desalineados o se salen del
  // recuadro. Recalculamos el tamaño cada vez que cambia el viewport.
  const refreshMapSize = () => { if(confirmMap) confirmMap.invalidateSize(); };
  window.addEventListener('resize', refreshMapSize);
  window.visualViewport?.addEventListener('resize', refreshMapSize);
  window.addEventListener('orientationchange', () => setTimeout(refreshMapSize, 200));

  return confirmMap;
}
async function reverseGeocode(lat, lng){
  try{
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    const a = data.address || {};
    const street = [a.road, a.house_number].filter(Boolean).join(' ');
    const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
    const parts = [street || area, street ? area : ''].filter(Boolean);
    return parts.length ? parts.join(', ') + ', Pucallpa' : (data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }catch(err){
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
async function updateConfirmAddress(){
  const c = confirmMap.getCenter();
  confirmAddressText.textContent = 'Ubicando…';
  confirmAddressText.textContent = await reverseGeocode(c.lat, c.lng);
}
function openMapConfirm(lat, lng, label, options = {}){
  confirmPendingLabel = label || `Dirección ${savedAddresses.length + 1}`;
  editingAddressId = options.editId || null;
  mapConfirmReturnTo = options.returnTo || 'addresses';
  document.getElementById('confirm-address-note').value = options.addressNote || '';
  document.getElementById('confirm-reference').value = options.reference || '';
  document.getElementById('confirm-address-search-status').textContent = '';
  document.querySelector('#view-map-confirm h2').textContent = editingAddressId ? 'Editar dirección' : 'Confirmar dirección';
  document.getElementById('confirm-address-btn').textContent = editingAddressId ? 'Guardar cambios' : 'Continuar';
  showView(viewMapConfirm);
  ensureConfirmMap(lat, lng);
  updateConfirmAddress();
}
function backFromMapConfirm(){
  if(mapConfirmReturnTo === 'cart'){ showView(viewHome); openCart(); }
  else showView(viewAddresses);
}
mapBackBtn.addEventListener('click', backFromMapConfirm);
mapLocateBtn.addEventListener('click', () => {
  if(!navigator.geolocation) return;
  mapLocateBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => { confirmMap.setView([pos.coords.latitude, pos.coords.longitude], 17); mapLocateBtn.disabled = false; },
    () => { mapLocateBtn.disabled = false; },
    { enableHighAccuracy:true, timeout:10000 }
  );
});

/* Buscar por texto la dirección aproximada y mover el mapa ahí directo —
   así quien escribe "Jr. 7 de Junio 343" no tiene que arrastrar el pin
   a mano; el mapa se ubica solo en la dirección real que encontró. */
const confirmAddressNoteInput = document.getElementById('confirm-address-note');
const confirmAddressSearchBtn = document.getElementById('confirm-address-search-btn');
const confirmAddressSearchStatus = document.getElementById('confirm-address-search-status');

async function searchAndMoveToAddress(query){
  const q = query.trim();
  if(q.length < 4){
    confirmAddressSearchStatus.textContent = 'Escribe un poco más para poder buscarla (mín. 4 letras).';
    return;
  }
  confirmAddressSearchStatus.textContent = 'Buscando esa dirección en el mapa…';
  const { results, exact, networkError } = await geocodePucallpa(q, 1);
  if(networkError){
    confirmAddressSearchStatus.textContent = 'No pudimos buscar en este momento. Intenta de nuevo o mueve el pin manualmente.';
    return;
  }
  if(!results.length){
    confirmAddressSearchStatus.textContent = 'No encontramos esa calle en el mapa. Mueve el pin manualmente hasta tu casa.';
    return;
  }
  const { lat, lon } = results[0];
  confirmMap.setView([parseFloat(lat), parseFloat(lon)], exact ? 17 : 16);
  confirmAddressSearchStatus.textContent = exact
    ? '¡Listo! Ubicamos el mapa ahí — ajusta el pin si hace falta.'
    : 'Encontramos la calle pero no el número exacto (Pucallpa aún no tiene todas las casas mapeadas). Ubicamos la cuadra — mueve el pin hasta tu puerta.';
}
confirmAddressSearchBtn.addEventListener('click', () => searchAndMoveToAddress(confirmAddressNoteInput.value));
confirmAddressNoteInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter'){ e.preventDefault(); searchAndMoveToAddress(confirmAddressNoteInput.value); }
});

confirmAddressBtn.addEventListener('click', () => {
  const c = confirmMap.getCenter();
  const addressNote = document.getElementById('confirm-address-note').value.trim();
  const reference = document.getElementById('confirm-reference').value.trim();

  if(editingAddressId){
    // Edita la dirección existente (ubicación + referencia) en vez de crear una nueva.
    const addr = savedAddresses.find(a => a.id === editingAddressId);
    if(addr){
      addr.address = confirmAddressText.textContent;
      addr.addressNote = addressNote;
      addr.reference = reference;
      addr.lat = c.lat; addr.lng = c.lng;
      if(addr.id === activeAddressId) selectAddress(addr.id);
    }
    editingAddressId = null;
  } else {
    const newAddr = {
      id: addrIdSeq++, label: confirmPendingLabel, address: confirmAddressText.textContent,
      addressNote, reference, lat:c.lat, lng:c.lng
    };
    savedAddresses.push(newAddr);
    selectAddress(newAddr.id);
  }

  renderAddressList();
  backFromMapConfirm();
});


