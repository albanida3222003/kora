/* ==========================================================
   CARRUSEL DE PROMOCIONES
========================================================== */
const promoTrack = document.getElementById('promo-track');
const promoDots = document.getElementById('promo-dots');
promoTrack.innerHTML = promos.map((p, i) => `
  <div class="promo-slide${i===0 ? ' active' : ''}" style="background:${p.gradient};">
    <span class="promo-deco d1"></span>
    <span class="promo-deco d2"></span>
    <div class="promo-copy">
      <span class="promo-badge">${p.badge}</span>
      <h3>${p.title}</h3>
      <p class="promo-subtitle">${p.subtitle}</p>
      <p>${p.desc}</p>
      <button class="btn promo-cta" type="button">${p.cta}</button>
    </div>
    <div class="promo-media">
      <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'">
    </div>
  </div>
`).join('');
promoDots.innerHTML = promos.map((_, i) => `<button class="promo-dot${i===0 ? ' active' : ''}" data-i="${i}" aria-label="Ir a promo ${i+1}"></button>`).join('');

let promoIndex = 0;
const promoSlides = () => document.querySelectorAll('.promo-slide');
const promoDotEls = () => document.querySelectorAll('.promo-dot');

function goToPromo(i){
  const slides = promoSlides(), dots = promoDotEls();
  promoIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle('active', idx === promoIndex));
  dots.forEach((d, idx) => d.classList.toggle('active', idx === promoIndex));
}
document.getElementById('promo-prev').addEventListener('click', () => { goToPromo(promoIndex - 1); resetPromoAutoplay(); });
document.getElementById('promo-next').addEventListener('click', () => { goToPromo(promoIndex + 1); resetPromoAutoplay(); });
promoDots.addEventListener('click', (e) => {
  const dot = e.target.closest('.promo-dot');
  if(!dot) return;
  goToPromo(Number(dot.dataset.i));
  resetPromoAutoplay();
});

let promoAutoplay;
function resetPromoAutoplay(){
  clearInterval(promoAutoplay);
  promoAutoplay = setInterval(() => goToPromo(promoIndex + 1), 5000);
}
resetPromoAutoplay();
const promoCarouselEl = document.getElementById('promo-carousel');
promoCarouselEl.addEventListener('mouseenter', () => clearInterval(promoAutoplay));
promoCarouselEl.addEventListener('mouseleave', resetPromoAutoplay);
