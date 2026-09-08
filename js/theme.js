/* ==========================================================
   TEMA CLARO/OSCURO
========================================================== */
/* ==========================================================
   THEME TOGGLE
   (En memoria durante la sesión. Si quieres que el modo
   elegido se recuerde entre visitas una vez publicado en
   GitHub Pages, guarda/lee el valor con localStorage ahí.)
========================================================== */
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const logoImg = document.getElementById('logo-img');
const heroRider = document.getElementById('hero-rider');
const footerLogo = document.querySelector('.footer-logo');

function applyTheme(theme){
  root.setAttribute('data-theme', theme);
  const logoSrc = theme === 'dark' ? 'assets/logo-dark.png' : 'assets/logo-light.png';
  logoImg.src = logoSrc;
  heroRider.src = logoSrc;
  if(footerLogo) footerLogo.src = logoSrc;
}

const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(prefersDark ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

