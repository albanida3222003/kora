/* ==========================================================
   SESION PERSISTENTE
========================================================== */
/* ==========================================================
   SESIÓN PERSISTENTE — para que "Ingresar" se mantenga iniciado
   entre visitas y muestre el nombre del cliente en vez del botón
   genérico. Guardado en localStorage (solo nombre y celular, nada
   sensible como el código OTP).
   Para producción: reemplaza esto por una sesión real de Supabase
   Auth (supabase.auth.getSession() / onAuthStateChange).
========================================================== */
const SESSION_KEY = 'moshaco_session';

function saveSession(){
  try{ localStorage.setItem(SESSION_KEY, JSON.stringify({ name: customerName, phone: customerPhone })); }catch(err){}
}
function clearSession(){
  try{ localStorage.removeItem(SESSION_KEY); }catch(err){}
}
function restoreSession(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return;
    const data = JSON.parse(raw);
    if(data && data.name && data.phone){
      customerName = data.name;
      customerPhone = data.phone;
      isVerified = true;
    }
  }catch(err){}
}

function firstName(fullName){
  return (fullName || '').trim().split(/\s+/)[0] || 'Cuenta';
}

function updateAuthUI(){
  const cta2 = document.getElementById('open-auth-2');
  const ctaSection = cta2 ? cta2.closest('.app-cta') : null;
  const heroSection = document.getElementById('hero-section');
  if(isVerified && customerName){
    openAuthBtn.textContent = `¡Hola, ${firstName(customerName)}!`;
    openAuthBtn.classList.add('logged-in');
    if(ctaSection) ctaSection.style.display = 'none';
    // Ya inició sesión: nos saltamos el hero de bienvenida/registro y
    // mostramos los restaurantes de una vez.
    if(heroSection) heroSection.style.display = 'none';
  } else {
    openAuthBtn.textContent = 'Ingresar';
    openAuthBtn.classList.remove('logged-in');
    if(ctaSection) ctaSection.style.display = '';
    if(heroSection) heroSection.style.display = '';
  }
}

restoreSession();
updateAuthUI();

function openModal(){ backdrop.classList.add('open'); showStep(stepPhone); }
function closeModal(){ backdrop.classList.remove('open'); pendingCheckoutAfterAuth = false; }
openBtns.forEach(b => b && b.addEventListener('click', (e) => {
  // Si ya inició sesión, el botón del header abre un menú (cerrar sesión)
  // en vez de pedir el login de nuevo.
  if(b.id === 'open-auth' && isVerified){
    e.stopPropagation();
    authDropdown.classList.toggle('open');
    return;
  }
  openModal();
}));
document.addEventListener('click', (e) => {
  if(authWidget && !authWidget.contains(e.target)) authDropdown.classList.remove('open');
});
logoutBtn.addEventListener('click', () => {
  customerName = '';
  customerPhone = '';
  isVerified = false;
  clearSession();
  authDropdown.classList.remove('open');
  updateAuthUI();
});
closeBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', (e) => { if(e.target === backdrop) closeModal(); });

function showStep(step){
  [stepPhone, stepOtp, stepSuccess].forEach(s => s.classList.remove('active'));
  step.classList.add('active');
}

// Código de 6 dígitos generado para esta sesión — mientras no haya un
// proveedor real de WhatsApp conectado (ver notas de Supabase arriba),
// lo mostramos en pantalla para que el flujo se pueda probar de punta a punta.
let currentOtpCode = '';
function generateOtpCode(){ return String(Math.floor(100000 + Math.random() * 900000)); }

sendCodeBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const digits = phoneInput.value.replace(/\D/g,'');
  let ok = true;
  if(name.length < 2){ nameError.classList.add('show'); ok = false; } else { nameError.classList.remove('show'); }
  if(digits.length !== 9){ phoneError.classList.add('show'); ok = false; } else { phoneError.classList.remove('show'); }
  if(!ok){ (name.length < 2 ? nameInput : phoneInput).focus(); return; }

  // --- AQUÍ va la llamada real a Supabase para disparar el WhatsApp ---
  // await supabase.functions.invoke('send-otp', { body: { phone: `+51${digits}` } });
  currentOtpCode = generateOtpCode();

  otpPhoneDisplay.textContent = `+51 ${digits}`;
  otpError.classList.remove('show');
  otpMsg.textContent = `✓ Código enviado por WhatsApp (demo, mientras conectamos WhatsApp real): ${currentOtpCode}`;
  otpBoxes.forEach(b => b.value = '');
  showStep(stepOtp);
  otpBoxes[0].focus();
  startResendTimer();
});

otpBoxes.forEach((box, i) => {
  box.addEventListener('input', () => {
    box.value = box.value.replace(/\D/g,'');
    if(box.value && otpBoxes[i+1]) otpBoxes[i+1].focus();
  });
  box.addEventListener('keydown', (e) => {
    if(e.key === 'Backspace' && !box.value && otpBoxes[i-1]) otpBoxes[i-1].focus();
  });
});

verifyBtn.addEventListener('click', () => {
  const code = Array.from(otpBoxes).map(b => b.value).join('');
  if(code.length !== 6) { otpBoxes[0].focus(); return; }

  // --- AQUÍ va la verificación real contra Supabase ---
  // const { data, error } = await supabase.functions.invoke('verify-otp', { body: { phone, code } });
  if(code !== currentOtpCode){
    otpError.classList.add('show');
    otpBoxes.forEach(b => b.value = '');
    otpBoxes[0].focus();
    return;
  }
  otpError.classList.remove('show');

  customerName = nameInput.value.trim();
  customerPhone = phoneInput.value.replace(/\D/g,'');
  isVerified = true;
  saveSession();
  updateAuthUI();
  showStep(stepSuccess);
});

finishBtn.addEventListener('click', () => {
  closeModal();
  if(pendingCheckoutAfterAuth){
    pendingCheckoutAfterAuth = false;
    sendOrderToWhatsApp();
  }
});

let resendInterval;
function startResendTimer(){
  let t = 30;
  resendBtn.disabled = true;
  let timerSpan = document.getElementById('resend-timer');
  if(timerSpan) timerSpan.textContent = t;
  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    t -= 1;
    timerSpan = document.getElementById('resend-timer');
    if(timerSpan) timerSpan.textContent = t;
    if(t <= 0){
      clearInterval(resendInterval);
      resendBtn.disabled = false;
      resendBtn.innerHTML = 'Reenviar código';
    }
  }, 1000);
}
resendBtn.addEventListener('click', () => {
  if(resendBtn.disabled) return;
  currentOtpCode = generateOtpCode();
  otpMsg.textContent = `✓ Código reenviado por WhatsApp (demo): ${currentOtpCode}`;
  otpError.classList.remove('show');
  resendBtn.innerHTML = 'Reenviar en <span id="resend-timer">30</span>s';
  startResendTimer();
});

/* Formulario rápido del hero: abre el mismo modal ya con el número cargado */
document.getElementById('hero-quick-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const val = e.target.querySelector('input').value.replace(/\D/g,'');
  openModal();
  phoneInput.value = val;
  nameInput.focus();
});

