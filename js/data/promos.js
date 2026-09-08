/* ==========================================================
   DATOS: PROMOCIONES (banner carrusel)
   Reemplaza este arreglo con una consulta a tu backend, ej:
   const { data } = await supabase.from('promos').select('*')
========================================================== */
const promos = [
  {
    badge:'🍕 Especial martes', title:'Pizza Italiana', subtitle:'2×1 todos los martes',
    desc:'Las mejores pizzas artesanales de Pucallpa llegan a tu puerta.', cta:'Ver pizzerías',
    image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=75&auto=format&fit=crop',
    gradient:'linear-gradient(120deg,#4B32C3,#8C5CFF)'
  },
  {
    badge:'🍣 Solo hoy', title:'Sushi Bar', subtitle:'3×2 en rolls California',
    desc:'Frescura japonesa directo a tu mesa, sin salir de casa.', cta:'Ver sushi bars',
    image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&q=75&auto=format&fit=crop',
    gradient:'linear-gradient(120deg,#0B6E8F,#3B2FD1)'
  },
  {
    badge:'🔥 Oferta del día', title:'Pollo a la Brasa', subtitle:'20% off en combos familiares',
    desc:'El sabor criollo de siempre, más rápido que nunca.', cta:'Ver pollerías',
    image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=75&auto=format&fit=crop',
    gradient:'linear-gradient(120deg,#C1440E,#FF7A29)'
  }
];
