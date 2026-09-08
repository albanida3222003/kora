/* ==========================================================
   CARRITO — estado en memoria y helpers de precio/cantidad
========================================================== */
/* Utilidad compartida: escapa texto antes de insertarlo en HTML.
   OBLIGATORIO usarla en cualquier dato que haya escrito el cliente
   (nombre, nota del pedido, referencia de dirección, etc.) antes de
   meterlo en un template `${...}` — de lo contrario alguien podría
   escribir algo como `</textarea><img src=x onerror=...>` y ejecutar
   código en el navegador de quien lo vea (XSS). */
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

/* ==========================================================
   CARRITO — estado en memoria durante la sesión
   Estructura: cart[ "restauranteId::platoId" ] = { r, dish, qty }
   Para producción: guarda el carrito en Supabase (tabla `cart_items`
   ligada al usuario autenticado) en vez de en memoria, así
   persiste entre sesiones y dispositivos.
========================================================== */
let cart = {};

// Propina para el repartidor y servicio VIP (opcionales, elegidos en el carrito).
let tipMode = 'none';   // 'none' | '1' | '2' | '3' | 'custom'
let tipCustomValue = 0; // usado solo cuando tipMode === 'custom'
let isVip = false;
const VIP_FEE = 2.3;

function getTipAmount(){
  if(tipMode === '1') return 1;
  if(tipMode === '2') return 2;
  if(tipMode === '3') return 3;
  if(tipMode === 'custom') return Math.max(0, Number(tipCustomValue) || 0);
  return 0;
}

function findRestaurant(rid){
  return restaurants.find(r => r.id === rid);
}
/* ==========================================================
   OPCIONES OBLIGATORIAS / PERSONALIZACIÓN DE PLATOS
   Un plato puede traer `options`: un arreglo de grupos, cada uno con
   sus alternativas. Ej: "Elige tu gaseosa" (obligatorio, 1 opción) o
   "Arma tu menú" (varios grupos obligatorios: entrada, plato, bebida).
   Cada grupo:
     { id, title, required:true/false, min:1, max:1, choices:[{id,label,priceDelta}] }
   - max === 1  -> selección única (radio)
   - max  > 1   -> selección múltiple (checkbox), respetando min/max
   Como platos con distintas opciones son en realidad distintos "líneas"
   del carrito (ej: 2 alitas BBQ + 1 alitas picante), la clave del
   carrito incluye una "firma" de las opciones elegidas.
========================================================== */
function optionsSig(selections){
  if(!selections || selections.length === 0) return '';
  return selections
    .map(s => `${s.groupId}:${s.choices.map(c => c.id).sort().join(',')}`)
    .sort()
    .join('|');
}
function dishUnitPrice(dish, selections){
  let total = dish.price;
  (selections || []).forEach(sel => {
    sel.choices.forEach(c => { total += c.priceDelta || 0; });
  });
  return total;
}
function cartKey(rid, did, sig=''){ return `${rid}::${did}::${sig}`; }
function getQty(rid, did, sig=''){
  const item = cart[cartKey(rid, did, sig)];
  return item ? item.qty : 0;
}
// Suma la cantidad de un plato en el carrito sin importar qué variante
// (opciones elegidas) tenga — sirve para mostrar "3 en tu pedido" en la ficha del plato.
function getDishTotalQty(rid, did){
  return Object.values(cart)
    .filter(it => it.rid === rid && it.did === did)
    .reduce((sum, it) => sum + it.qty, 0);
}
function changeQty(rid, did, delta, selections=null){
  const restaurant = findRestaurant(rid);
  const dish = restaurant.dishes.find(d => d.id === did);
  const sig = optionsSig(selections);
  const key = cartKey(rid, did, sig);
  const current = cart[key];
  const nextQty = (current ? current.qty : 0) + delta;
  if(nextQty <= 0){
    delete cart[key];
  } else {
    const finalSelections = current ? current.selections : selections;
    const unitPrice = current ? current.unitPrice : dishUnitPrice(dish, selections);
    cart[key] = { rid, did, sig, qty: nextQty, restaurant, dish, selections: finalSelections, unitPrice };
  }
  updateCartBadge();
  renderMenuDishList(rid);
  if(cartBackdrop.classList.contains('open')) renderCart();
}
function cartTotals(){
  let subtotal = 0;
  const restaurantIdsInCart = new Set();
  Object.values(cart).forEach(item => {
    subtotal += item.unitPrice * item.qty;
    restaurantIdsInCart.add(item.rid);
  });
  let deliveryFee = 0;
  restaurantIdsInCart.forEach(rid => { deliveryFee += findRestaurant(rid).feeValue; });
  const itemCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const tip = getTipAmount();
  const vipFee = isVip ? VIP_FEE : 0;
  return {
    subtotal, deliveryFee, tip, vipFee,
    total: subtotal + deliveryFee + tip + vipFee,
    itemCount, restaurantCount: restaurantIdsInCart.size
  };
}
// Redondea al 0.1 más cercano para que nunca se vea algo como "S/ 6.64".
function fmtMoney(n){ return `S/ ${(Math.round(n * 10) / 10).toFixed(1)}`; }

function updateCartBadge(){
  const { itemCount } = cartTotals();
  cartBadge.textContent = itemCount;
}

