/* ==========================================================
   HISTORIAL DE PEDIDOS (localStorage)
========================================================== */
/* ==========================================================
   HISTORIAL DE PEDIDOS
   Cada vez que se envía un pedido por WhatsApp, guardamos una copia
   en localStorage (por navegador) para que la persona pueda ver sus
   pedidos anteriores y volver a pedir lo mismo con un solo toque.
   Para producción: guarda esto en una tabla `orders` de Supabase
   ligada al usuario autenticado, así el historial viaja con su cuenta
   entre dispositivos en vez de quedarse solo en este navegador.
========================================================== */
const ORDER_HISTORY_KEY = 'moshaco_order_history';
const MAX_HISTORY_ORDERS = 30;

function getOrderHistory(){
  try{
    const raw = localStorage.getItem(ORDER_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  }catch(err){ return []; }
}

function saveOrderToHistory(){
  const items = Object.values(cart);
  if(items.length === 0) return;
  const { subtotal, deliveryFee, tip, vipFee, total } = cartTotals();
  const addr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];

  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    items: items.map(it => ({
      rid: it.rid, did: it.did, sig: it.sig, name: it.dish.name, qty: it.qty,
      price: it.unitPrice, restaurantName: it.restaurant.name, selections: it.selections || null
    })),
    subtotal, deliveryFee, tip, vipFee, total,
    address: addr ? { label: addr.label, address: addr.address, addressNote: addr.addressNote, reference: addr.reference } : null,
    note: orderNote.trim(),
    customerName, customerPhone
  };

  const history = getOrderHistory();
  history.unshift(order); // el más nuevo primero
  try{
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ORDERS)));
  }catch(err){}
}

function fmtOrderDate(iso){
  try{
    return new Date(iso).toLocaleString('es-PE', {
      day:'numeric', month:'short', hour:'numeric', minute:'2-digit'
    });
  }catch(err){ return ''; }
}

function openOrderHistory(){
  showView(viewOrders);
  renderOrderHistory();
}

function renderOrderHistory(){
  const ordersListEl = document.getElementById('orders-list');
  const history = getOrderHistory();

  if(history.length === 0){
    ordersListEl.innerHTML = `
      <div class="orders-empty">
        <span class="big-emoji">🧾</span>
        Todavía no hiciste ningún pedido.<br>Cuando pidas algo, va a aparecer aquí.
      </div>`;
    return;
  }

  ordersListEl.innerHTML = history.map(order => {
    const groupsByRest = {};
    order.items.forEach(it => {
      if(!groupsByRest[it.restaurantName]) groupsByRest[it.restaurantName] = [];
      groupsByRest[it.restaurantName].push(it);
    });
    const restNames = Object.keys(groupsByRest);

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-card-head">
          <span class="order-date">${fmtOrderDate(order.date)}</span>
          <span class="order-total">${fmtMoney(order.total)}</span>
        </div>
        ${restNames.map(rn => `
          <div class="order-rest-group">
            <p class="order-rest-name">🍽️ ${rn}</p>
            ${groupsByRest[rn].map(it => `
              <p class="order-item-line">• ${it.qty}x ${it.name} — ${fmtMoney(it.price * it.qty)}</p>
              ${it.selections && it.selections.length ? `
                <p class="order-item-opts">${it.selections.map(s => s.choices.map(c => c.label).join(', ')).join(' · ')}</p>
              ` : ''}
            `).join('')}
          </div>
        `).join('')}
        ${order.address ? `<p class="order-address">📍 ${order.address.label} · ${order.address.address}</p>` : ''}
        ${order.note ? `<p class="order-note-line">📝 ${order.note}</p>` : ''}
        <button type="button" class="btn btn-primary order-repeat-btn" data-order-id="${order.id}" style="width:100%; margin-top:12px;">
          Pedir de nuevo
        </button>
      </div>
    `;
  }).join('');
}

document.getElementById('orders-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.order-repeat-btn');
  if(!btn) return;
  const orderId = Number(btn.dataset.orderId);
  const order = getOrderHistory().find(o => o.id === orderId);
  if(!order) return;

  let addedCount = 0;
  order.items.forEach(it => {
    const restaurant = findRestaurant(it.rid);
    const dish = restaurant?.dishes.find(d => d.id === it.did);
    if(restaurant && dish){
      changeQty(it.rid, it.did, it.qty, it.selections || null);
      addedCount += it.qty;
    }
  });

  if(addedCount > 0){
    openCart();
  } else {
    alert('Uy, algunos platos de ese pedido ya no están disponibles. Intenta pedirlos de nuevo desde el restaurante.');
  }
});

document.getElementById('orders-history-btn').addEventListener('click', () => {
  authDropdown.classList.remove('open');
  openOrderHistory();
});
document.getElementById('orders-back-btn').addEventListener('click', () => showView(viewHome));

cartBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const delta = btn.dataset.act === 'inc' ? 1 : -1;
  const key = cartKey(btn.dataset.rid, btn.dataset.did, btn.dataset.sig || '');
  const selections = cart[key] ? cart[key].selections : null;
  changeQty(btn.dataset.rid, btn.dataset.did, delta, selections);
});

updateCartBadge();

