/* ==========================================================
   MODAL DE CARRITO
========================================================== */
/* ---------- MODAL DE CARRITO ---------- */
const cartBackdrop = document.getElementById('cart-backdrop');
const cartClose = document.getElementById('cart-close');
const cartBody = document.getElementById('cart-body');
const cartFoot = document.getElementById('cart-foot');
const cartBadge = document.getElementById('cart-badge');
let orderNote = ''; // nota opcional del pedido (ej: "sin cebolla", "tocar timbre 2 veces")

function openCart(){ cartBackdrop.classList.add('open'); renderCart(); }
function closeCart(){ cartBackdrop.classList.remove('open'); }
document.getElementById('open-cart').addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', (e) => { if(e.target === cartBackdrop) closeCart(); });

function wireCartAddressButton(){
  const activeAddr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];

  document.getElementById('cart-change-address-btn')?.addEventListener('click', () => {
    closeCart();
    openAddresses();
  });

  document.getElementById('cart-edit-location-btn')?.addEventListener('click', () => {
    if(!activeAddr) return;
    closeCart();
    openMapConfirm(activeAddr.lat, activeAddr.lng, activeAddr.label, {
      editId: activeAddr.id, addressNote: activeAddr.addressNote, reference: activeAddr.reference, returnTo: 'cart'
    });
  });

  // Edición rápida de la referencia sin salir del pedido: un tap muestra
  // un input en línea, y "Guardar" actualiza la dirección al toque.
  const refDisplay = document.getElementById('cart-address-ref-display');
  const refEditRow = document.getElementById('cart-ref-edit-row');
  const refInput = document.getElementById('cart-ref-input');

  document.getElementById('cart-edit-ref-btn')?.addEventListener('click', () => {
    if(refDisplay) refDisplay.style.display = 'none';
    if(refEditRow) refEditRow.style.display = 'flex';
    refInput?.focus();
    refInput?.select();
  });

  function saveCartReference(){
    if(activeAddr) activeAddr.reference = (refInput?.value || '').trim();
    renderCart();
  }
  document.getElementById('cart-ref-save-btn')?.addEventListener('click', saveCartReference);
  document.getElementById('cart-ref-cancel-btn')?.addEventListener('click', () => renderCart());
  refInput?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); saveCartReference(); }
    if(e.key === 'Escape'){ e.preventDefault(); renderCart(); }
  });
}

function renderCart(){
  const items = Object.values(cart);
  const activeAddr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];
  const addressBlockHtml = activeAddr ? `
    <div class="cart-address-select" id="cart-address-select">
      <span class="cart-address-icon">📍</span>
      <div class="cart-address-info">
        <p class="cart-address-label">Entregar en <strong>${escapeHtml(activeAddr.label)}</strong></p>
        <p class="cart-address-sub">${escapeHtml(activeAddr.address)}${activeAddr.addressNote ? ` · ${escapeHtml(activeAddr.addressNote)}` : ''}</p>
        <p class="cart-address-ref" id="cart-address-ref-display">
          📌 ${activeAddr.reference ? escapeHtml(activeAddr.reference) : 'Sin referencia — agrégala aquí'}
          <button type="button" id="cart-edit-ref-btn" class="cart-ref-edit-btn" aria-label="Editar referencia">✏️</button>
        </p>
        <div class="cart-ref-edit-row" id="cart-ref-edit-row">
          <input type="text" id="cart-ref-input" placeholder="Ej: Frente a la comisaría de San Fernando" value="${escapeHtml(activeAddr.reference || '')}">
          <button type="button" id="cart-ref-save-btn" class="cart-ref-save-btn">Guardar</button>
          <button type="button" id="cart-ref-cancel-btn" class="cart-ref-cancel-btn" aria-label="Cancelar">✕</button>
        </div>
      </div>
      <div class="cart-address-actions">
        <button type="button" id="cart-edit-location-btn">Editar ubicación</button>
        <button type="button" id="cart-change-address-btn">Cambiar</button>
      </div>
    </div>
  ` : '';

  if(items.length === 0){
    cartBody.innerHTML = addressBlockHtml + `
      <div class="sheet-empty">
        <span class="big-emoji">🛒</span>
        Aún no agregaste nada.<br>Explora los restaurantes y arma tu pedido.
      </div>`;
    cartFoot.innerHTML = `<button class="btn btn-primary" type="button" style="width:100%;" disabled>Realizar pedido</button>`;
    wireCartAddressButton();
    return;
  }

  // Agrupar por restaurante, preservando el orden de restaurants[]
  const groups = restaurants
    .map(r => ({ r, items: items.filter(it => it.rid === r.id) }))
    .filter(g => g.items.length > 0);

  cartBody.innerHTML = addressBlockHtml + groups.map(g => `
    <div class="cart-group">
      <div class="cart-group-head">
        <span class="g-name">🛵 ${g.r.name}</span>
        <span class="g-fee">Delivery: ${g.r.fee}</span>
      </div>
      ${g.items.map(it => `
        <div class="cart-row">
          <img src="${it.dish.image}" alt="${it.dish.name}" onerror="this.style.display='none'">
          <div style="flex:1; min-width:0;">
            <p class="cart-item-name">${it.dish.name}</p>
            ${it.selections && it.selections.length ? `
              <p class="cart-item-opts">${it.selections.map(s => s.choices.map(c => c.label).join(', ')).join(' · ')}</p>
            ` : ''}
            <span class="cart-item-price">${fmtMoney(it.unitPrice)} c/u</span>
          </div>
          <div class="stepper">
            <button type="button" class="${it.qty === 1 ? 'remove-btn' : ''}" data-act="dec" data-rid="${it.rid}" data-did="${it.did}" data-sig="${it.sig}">${it.qty === 1 ? '✕' : '−'}</button>
            <span class="qty">${it.qty}</span>
            <button type="button" data-act="inc" data-rid="${it.rid}" data-did="${it.did}" data-sig="${it.sig}">+</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('') + `
    <div class="cart-tip">
      <label>¿Dejas propina para el repartidor? (opcional)</label>
      <div class="tip-options">
        <button type="button" class="tip-opt ${tipMode === 'none' ? 'active' : ''}" data-tip="none">Sin propina</button>
        <button type="button" class="tip-opt ${tipMode === '1' ? 'active' : ''}" data-tip="1">+S/ 1</button>
        <button type="button" class="tip-opt ${tipMode === '2' ? 'active' : ''}" data-tip="2">+S/ 2</button>
        <button type="button" class="tip-opt ${tipMode === '3' ? 'active' : ''}" data-tip="3">+S/ 3</button>
        <button type="button" class="tip-opt ${tipMode === 'custom' ? 'active' : ''}" data-tip="custom">Otro monto</button>
      </div>
      <div class="tip-custom-wrap" id="tip-custom-wrap" style="display:${tipMode === 'custom' ? 'flex' : 'none'};">
        <span class="cc">S/</span>
        <input type="number" id="tip-custom-input" min="0" step="0.5" placeholder="Monto de propina" value="${tipCustomValue || ''}">
      </div>
    </div>

    <label class="vip-check">
      <input type="checkbox" id="vip-check" ${isVip ? 'checked' : ''}>
      <span><strong>Servicio VIP</strong> — tu pedido se prioriza con el repartidor (+${fmtMoney(VIP_FEE)})</span>
    </label>

    <div class="cart-note">
      <label for="order-note-input">Nota para tu pedido (opcional)</label>
      <textarea id="order-note-input" rows="2" placeholder="Ej: sin cebolla, tocar timbre 2 veces, dejar con el guardián…">${orderNote}</textarea>
    </div>
  `;

  const { subtotal, deliveryFee, tip, vipFee, total, restaurantCount } = cartTotals();
  cartFoot.innerHTML = `
    <div class="sum-row"><span>Subtotal</span><strong>${fmtMoney(subtotal)}</strong></div>
    <div class="sum-row"><span>Envío${restaurantCount > 1 ? ` (${restaurantCount} locales)` : ''}</span><strong>${deliveryFee === 0 ? 'Gratis' : fmtMoney(deliveryFee)}</strong></div>
    <div class="sum-row" id="sum-row-tip" style="display:${tip > 0 ? 'flex' : 'none'};"><span>Propina</span><strong id="sum-tip-value">${fmtMoney(tip)}</strong></div>
    <div class="sum-row" id="sum-row-vip" style="display:${vipFee > 0 ? 'flex' : 'none'};"><span>Servicio VIP</span><strong>${fmtMoney(vipFee)}</strong></div>
    <div class="sum-row total"><span>Total</span><span id="sum-total-value">${fmtMoney(total)}</span></div>
    <button class="btn btn-primary" id="checkout-btn" type="button" style="width:100%; margin-top:14px;">Realizar pedido</button>
  `;

  wireCartAddressButton();

  const noteInput = document.getElementById('order-note-input');
  noteInput.addEventListener('input', () => { orderNote = noteInput.value; });

  document.querySelectorAll('.tip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      tipMode = btn.dataset.tip;
      if(tipMode === 'custom'){
        renderCart();
        setTimeout(() => document.getElementById('tip-custom-input')?.focus(), 30);
      } else {
        renderCart();
      }
    });
  });
  const tipCustomInput = document.getElementById('tip-custom-input');
  tipCustomInput?.addEventListener('input', () => {
    tipCustomValue = parseFloat(tipCustomInput.value) || 0;
    // Solo actualizamos el resumen de totales para no perder el foco del input.
    const t = cartTotals();
    const tipRow = document.getElementById('sum-row-tip');
    document.getElementById('sum-tip-value').textContent = fmtMoney(t.tip);
    tipRow.style.display = t.tip > 0 ? 'flex' : 'none';
    document.getElementById('sum-total-value').textContent = fmtMoney(t.total);
  });

  const vipCheck = document.getElementById('vip-check');
  vipCheck.addEventListener('change', () => {
    isVip = vipCheck.checked;
    renderCart();
  });

  document.getElementById('checkout-btn').addEventListener('click', () => {
    orderNote = noteInput.value;
    tipCustomValue = tipCustomInput ? (parseFloat(tipCustomInput.value) || 0) : tipCustomValue;
    if(isVerified && customerName && customerPhone){
      sendOrderToWhatsApp();
    } else {
      closeCart();
      pendingCheckoutAfterAuth = true;
      openModal(); // pide nombre + celular por WhatsApp para confirmar el pedido
    }
  });
}

