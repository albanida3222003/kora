/* ==========================================================
   VISTA: MIS DIRECCIONES
========================================================== */
/* ---------- VISTA: MIS DIRECCIONES ---------- */
const addrListEl = document.getElementById('addr-list');
const addrBackBtn = document.getElementById('addr-back-btn');
const addrAddBtn = document.getElementById('addr-add-btn');
const addrSearchInput = document.getElementById('addr-search-input');

function openAddresses(){
  addrSearchInput.value = '';
  renderAddressList();
  showView(viewAddresses);
}
function renderAddressList(){
  if(savedAddresses.length === 0){
    addrListEl.innerHTML = `<div class="addr-empty">Aún no guardaste ninguna dirección.<br>Agrega la primera para calcular tu envío exacto.</div>`;
    return;
  }
  addrListEl.innerHTML = savedAddresses.map(a => `
    <div class="addr-item ${a.id === activeAddressId ? 'active' : ''}" data-id="${a.id}">
      <div class="addr-pin">📍</div>
      <div class="addr-info">
        <p class="addr-title">${a.label}</p>
        <p class="addr-sub">${a.address}${a.addressNote ? ` · ${a.addressNote}` : ''}</p>
        ${a.reference ? `<p class="addr-ref">📌 ${a.reference}</p>` : ''}
      </div>
      <button class="addr-edit" data-id="${a.id}" type="button" aria-label="Editar dirección" style="background:none; border:none; color:var(--text-soft); font-size:1rem; padding:6px; flex-shrink:0;">✏️</button>
      <button class="addr-del" data-id="${a.id}" type="button" aria-label="Eliminar dirección" style="background:none; border:none; color:var(--text-soft); font-size:1rem; padding:6px; flex-shrink:0;">✕</button>
      <div class="addr-check"></div>
    </div>
  `).join('');
}
function selectAddress(id){
  const a = savedAddresses.find(x => x.id === id);
  if(!a) return;
  activeAddressId = id;
  customerLocation = { lat:a.lat, lng:a.lng };
  locationIsPrecise = true;
  locationLabel.textContent = a.label;
  refreshAllFeeDependentViews();
}
addrListEl.addEventListener('click', (e) => {
  const sugg = e.target.closest('.addr-item.suggestion');
  if(sugg){
    openMapConfirm(parseFloat(sugg.dataset.lat), parseFloat(sugg.dataset.lng), sugg.dataset.label);
    return;
  }
  const delBtn = e.target.closest('.addr-del');
  if(delBtn){
    e.stopPropagation();
    const id = Number(delBtn.dataset.id);
    savedAddresses = savedAddresses.filter(a => a.id !== id);
    if(activeAddressId === id){
      activeAddressId = savedAddresses[0] ? savedAddresses[0].id : null;
      if(activeAddressId) selectAddress(activeAddressId);
    }
    renderAddressList();
    return;
  }
  const editBtn = e.target.closest('.addr-edit');
  if(editBtn){
    e.stopPropagation();
    const id = Number(editBtn.dataset.id);
    const a = savedAddresses.find(x => x.id === id);
    if(a){
      openMapConfirm(a.lat, a.lng, a.label, {
        editId: a.id, addressNote: a.addressNote, reference: a.reference, returnTo: 'addresses'
      });
    }
    return;
  }
  const item = e.target.closest('.addr-item');
  if(!item) return;
  selectAddress(Number(item.dataset.id));
  renderAddressList();
});

let addrSearchTimer = null;
addrSearchInput.addEventListener('input', () => {
  clearTimeout(addrSearchTimer);
  const q = addrSearchInput.value.trim();
  if(q.length < 4){ renderAddressList(); return; }
  addrSearchTimer = setTimeout(() => searchAddressSuggestions(q), 500);
});

