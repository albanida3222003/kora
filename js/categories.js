/* ==========================================================
   CATEGORIAS — chips de filtro con flechas de desplazamiento
========================================================== */
/* ==========================================================
   CATEGORÍAS — flechas de desplazamiento + estado activo
========================================================== */
const chipRow = document.getElementById('chip-row');
document.getElementById('cat-prev').addEventListener('click', () => chipRow.scrollBy({ left:-220, behavior:'smooth' }));
document.getElementById('cat-next').addEventListener('click', () => chipRow.scrollBy({ left:220, behavior:'smooth' }));
chipRow.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if(!chip) return;
  chipRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  chip.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
  activeCategory = chip.dataset.cat;
  renderRestaurantGrid();
  document.getElementById('featured')?.scrollIntoView({ behavior:'smooth', block:'start' });
});

