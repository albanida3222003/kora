/* ==========================================================
   HORARIO DE ATENCIÓN POR LOCAL
   Cada restaurante puede traer `hours`: un objeto con una entrada por
   día de la semana (dom, lun, mar, mie, jue, vie, sab). Cada día puede ser:
     { open:'11:00', close:'22:00' }   -> abre y cierra ese día
     null                               -> cerrado todo ese día
   Si un local no trae `hours`, se asume que siempre está abierto
   (para no romper datos viejos que no lo definieron).

   Soporta horarios que cruzan la medianoche (ej. open:'18:00', close:'02:00').

   Para producción: trae esto de tu backend (ej. una tabla
   `restaurant_hours` en Supabase) en vez de tenerlo hardcodeado aquí,
   y ojo con la zona horaria — conviene manejar el horario en la zona
   horaria DEL LOCAL, no la del navegador del cliente que puede estar
   viendo la página desde otro huso horario.
========================================================== */
const HOURS_DAY_KEYS = ['dom','lun','mar','mie','jue','vie','sab']; // coincide con Date.getDay(): 0=domingo
const HOURS_DAY_NAMES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

function timeToMinutes(hhmm){
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}
function minutesToLabel(mins){
  mins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? 'a.m.' : 'p.m.';
  let h12 = h % 12;
  if(h12 === 0) h12 = 12;
  return m ? `${h12}:${String(m).padStart(2,'0')} ${period}` : `${h12}:00 ${period}`;
}

/* Devuelve el estado de atención de un local en un momento dado:
   { isOpen, label, closesAtLabel, opensAtLabel }
   `now` se puede pasar para pruebas; por defecto usa la hora actual del navegador. */
function getRestaurantStatus(r, now){
  now = now || new Date();
  if(!r.hours) return { isOpen:true, label:'' }; // sin horario definido = siempre abierto

  const dayIndex = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const today = r.hours[HOURS_DAY_KEYS[dayIndex]];
  const yesterday = r.hours[HOURS_DAY_KEYS[(dayIndex + 6) % 7]];

  // ¿Sigue abierto por un turno que empezó HOY?
  if(today){
    const openMin = timeToMinutes(today.open);
    let closeMin = timeToMinutes(today.close);
    if(closeMin <= openMin) closeMin += 1440; // cruza la medianoche
    if(nowMin >= openMin && nowMin < closeMin){
      return { isOpen:true, label:`Abierto · cierra ${closeMin >= 1440 ? 'mañana' : 'hoy'} a las ${minutesToLabel(closeMin)}` };
    }
  }
  // ¿Sigue abierto por un turno que empezó AYER y cruza la medianoche?
  if(yesterday){
    const openMin = timeToMinutes(yesterday.open);
    let closeMin = timeToMinutes(yesterday.close);
    if(closeMin <= openMin){
      const closeMinToday = closeMin; // minutos desde medianoche de hoy
      if(nowMin < closeMinToday){
        return { isOpen:true, label:`Abierto · cierra hoy a las ${minutesToLabel(closeMinToday)}` };
      }
    }
  }

  // Está cerrado ahora mismo — ¿abre más tarde hoy?
  if(today && nowMin < timeToMinutes(today.open)){
    return { isOpen:false, label:`Cerrado · abre hoy a las ${minutesToLabel(timeToMinutes(today.open))}` };
  }

  // Busca la próxima apertura en los siguientes 7 días.
  for(let i = 1; i <= 7; i++){
    const idx = (dayIndex + i) % 7;
    const day = r.hours[HOURS_DAY_KEYS[idx]];
    if(day){
      const when = i === 1 ? 'mañana' : `el ${HOURS_DAY_NAMES[idx]}`;
      return { isOpen:false, label:`Cerrado · abre ${when} a las ${minutesToLabel(timeToMinutes(day.open))}` };
    }
  }
  return { isOpen:false, label:'Cerrado por ahora' };
}
