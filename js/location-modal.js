/* ==========================================================
   MODAL DE UBICACION al entrar
========================================================== */
/* ==========================================================
   MODAL DE UBICACIÓN — sale ni bien entra el usuario, para
   recalcular al toque el envío de todos los restaurantes.
========================================================== */
const locBackdrop = document.getElementById('loc-backdrop');
const locDetectBtn = document.getElementById('loc-detect-btn');
const locSkipBtn = document.getElementById('loc-skip-btn');
const locCloseBtn = document.getElementById('loc-close');
const locStatus = document.getElementById('loc-status');

function refreshAllFeeDependentViews(){
  updateAllFees();
  renderRestaurantGrid();
  // si está viendo el menú de un restaurante, refresca su tarjeta de envío/distancia
  if(viewMenu.style.display !== 'none' && mvDishList.dataset.rid){
    openMenu(mvDishList.dataset.rid);
  }
  // si tiene el carrito abierto, refresca los totales
  if(cartBackdrop.classList.contains('open')) renderCart();
}

function openLocationModal(){ locBackdrop.classList.add('open'); locStatus.textContent = ''; }
function closeLocationModal(){ locBackdrop.classList.remove('open'); }

function detectLocation(){
  if(!navigator.geolocation){
    locStatus.textContent = 'Tu navegador no soporta geolocalización. Usaremos una ubicación aproximada.';
    return;
  }
  locDetectBtn.disabled = true;
  locDetectBtn.textContent = 'Detectando…';
  locStatus.textContent = 'Espera un momento, estamos ubicándote…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      customerLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locationIsPrecise = true;
      refreshAllFeeDependentViews();
      locationLabel.textContent = 'Ubicación detectada ✓';
      locDetectBtn.disabled = false;
      locDetectBtn.textContent = 'Detectar con mi ubicación actual';
      locStatus.textContent = '¡Listo! Ya actualizamos el envío de todos los restaurantes.';
      setTimeout(closeLocationModal, 900);
    },
    (err) => {
      locDetectBtn.disabled = false;
      locDetectBtn.textContent = 'Detectar con mi ubicación actual';
      locStatus.textContent = 'No pudimos acceder a tu ubicación. Puedes darle permiso desde tu navegador o seguir con la ubicación aproximada.';
    },
    { enableHighAccuracy:true, timeout:10000 }
  );
}

locDetectBtn.addEventListener('click', detectLocation);
locSkipBtn.addEventListener('click', () => {
  refreshAllFeeDependentViews(); // ya se calculó con el centro de Pucallpa, solo confirmamos
  closeLocationModal();
});
locCloseBtn.addEventListener('click', closeLocationModal);
locBackdrop.addEventListener('click', (e) => { if(e.target === locBackdrop) closeLocationModal(); });

// Sale automáticamente ni bien entra a la app, para poder actualizar
// los precios de envío de todos los locales en ese momento.
setTimeout(openLocationModal, 500);
