/* ==========================================================
   ENVIO DEL PEDIDO POR WHATSAPP
========================================================== */
/* ==========================================================
   ENVÍO DEL PEDIDO POR WHATSAPP
   Arma un mensaje con todo el detalle del pedido (cliente, platos,
   totales, dirección + referencia y nota) y lo abre directo en
   WhatsApp hacia el número del negocio. Mientras no haya un backend
   propio, este es el "checkout": el pedido llega como mensaje de
   WhatsApp para que el negocio lo confirme y cobre manualmente.
========================================================== */
const MOSHACO_WHATSAPP_NUMBER = '51982780329';

function buildOrderMessage(){
  const items = Object.values(cart);
  const groups = restaurants
    .map(r => ({ r, items: items.filter(it => it.rid === r.id) }))
    .filter(g => g.items.length > 0);
  const { subtotal, deliveryFee, tip, vipFee, total } = cartTotals();
  const addr = savedAddresses.find(a => a.id === activeAddressId) || savedAddresses[0];

  let msg = `🐒 *Nuevo pedido Moshaco*\n\n`;
  msg += `👤 Cliente: ${customerName}\n`;
  msg += `📱 Celular: +51 ${customerPhone}\n\n`;

  groups.forEach(g => {
    msg += `🍽️ *${g.r.name}*\n`;
    g.items.forEach(it => {
      msg += `• ${it.qty}x ${it.dish.name} — ${fmtMoney(it.unitPrice * it.qty)}\n`;
      if(it.selections && it.selections.length){
        it.selections.forEach(s => {
          msg += `   ↳ ${s.groupTitle}: ${s.choices.map(c => c.label).join(', ')}\n`;
        });
      }
    });
    msg += `   Envío: ${g.r.fee}\n\n`;
  });

  msg += `💰 Subtotal: ${fmtMoney(subtotal)}\n`;
  msg += `🐒 Envío total: ${deliveryFee === 0 ? 'Gratis' : fmtMoney(deliveryFee)}\n`;
  if(tip > 0) msg += `🙌 Propina: ${fmtMoney(tip)}\n`;
  if(vipFee > 0) msg += `⭐ Servicio VIP: ${fmtMoney(vipFee)}\n`;
  msg += `*Total a pagar: ${fmtMoney(total)}*\n\n`;

  if(addr){
    msg += `📍 Dirección: ${addr.address}\n`;
    if(addr.addressNote) msg += `🏠 Dirección aprox.: ${addr.addressNote}\n`;
    if(addr.reference) msg += `📌 Referencia: ${addr.reference}\n`;
  }

  if(orderNote.trim()) msg += `\n📝 Nota: ${orderNote.trim()}\n`;

  return msg;
}

function sendOrderToWhatsApp(){
  const message = buildOrderMessage();
  const url = `https://wa.me/${MOSHACO_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
  saveOrderToHistory();
  cart = {};
  orderNote = '';
  tipMode = 'none';
  tipCustomValue = 0;
  isVip = false;
  updateCartBadge();
  closeCart();
}

