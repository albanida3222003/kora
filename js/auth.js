/* ==========================================================
   AUTH MODAL — numero de celular + confirmacion por WhatsApp
========================================================== */
/* ==========================================================
   AUTH MODAL — número de celular + confirmación por WhatsApp
   ----------------------------------------------------------
   Este bloque es una SIMULACIÓN de frontend. Para producción,
   conecta estos puntos con Supabase + un proveedor de WhatsApp
   (Meta Cloud API / Twilio WhatsApp) así:

   1) Al enviar el celular:
      - Llama a una Supabase Edge Function ("send-otp") que:
          a) genera un código de 6 dígitos
          b) lo guarda en una tabla `otp_codes` con expiración
          c) llama a la API de WhatsApp para mandar el mensaje
      - supabase.functions.invoke('send-otp', { body: { phone } })

   2) Al confirmar el código:
      - Llama a otra función ("verify-otp") que valide el código
        contra la tabla `otp_codes` y, si es correcto, cree/loguee
        al usuario con supabase.auth.signInWithOtp o una sesión
        personalizada (custom JWT) ya que Supabase Auth no tiene
        WhatsApp nativo — el código se valida en tu propia función.
========================================================== */
const backdrop = document.getElementById('auth-backdrop');
const openBtns = [document.getElementById('open-auth'), document.getElementById('open-auth-2')];
const closeBtn = document.getElementById('modal-close');
const stepPhone = document.getElementById('step-phone');
const stepOtp = document.getElementById('step-otp');
const stepSuccess = document.getElementById('step-success');
const nameInput = document.getElementById('name-input');
const nameError = document.getElementById('name-error');
const phoneInput = document.getElementById('phone-input');
const phoneError = document.getElementById('phone-error');
const sendCodeBtn = document.getElementById('send-code-btn');
const otpPhoneDisplay = document.getElementById('otp-phone-display');
const otpMsg = document.getElementById('otp-msg');
const otpError = document.getElementById('otp-error');
const verifyBtn = document.getElementById('verify-code-btn');
const finishBtn = document.getElementById('finish-btn');
const resendBtn = document.getElementById('resend-btn');
const otpBoxes = document.querySelectorAll('.otp-box');
const authWidget = document.getElementById('auth-widget');
const authDropdown = document.getElementById('auth-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const openAuthBtn = document.getElementById('open-auth');

// Datos del cliente ya confirmados en esta sesión (nombre, celular).
// Cuando ya están completos no le volvemos a pedir el login para pedir de nuevo.
let customerName = '';
let customerPhone = '';
let isVerified = false;
// Si el modal se abrió desde "Realizar pedido", al terminar el login
// seguimos directo a enviar el pedido por WhatsApp.
let pendingCheckoutAfterAuth = false;

