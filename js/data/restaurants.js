/* ==========================================================
   DATOS: RESTAURANTES Y PLATOS (datos de ejemplo)
   Reemplaza este arreglo con una consulta a tu backend, ej:
   const { data } = await supabase.from('restaurants').select('*')
========================================================== */
const restaurants = [
  {
    id:'burguesia', name:'La Burguesía', sub:'Hamburguesas • Papas Fritas', badge:{type:'off', label:'20% OFF'},
    partnerType:'socio', // convenio directo con la plataforma
    cats:['hamburguesas','bebidas'],
    tags:['Favorito del barrio','Nuevo'], rating:'4.8', reviews:342, time:'25-35 min', min:'S/ 20',
    lat:-8.3791, lng:-74.5539, address:'Jr. Tarapacá, cerca a la Plaza de Armas',
    image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=75&auto=format&fit=crop',
    hours:{
      dom:{open:'12:00', close:'22:00'}, lun:{open:'12:00', close:'22:00'}, mar:{open:'12:00', close:'22:00'},
      mie:{open:'12:00', close:'22:00'}, jue:{open:'12:00', close:'22:00'},
      vie:{open:'12:00', close:'23:30'}, sab:{open:'12:00', close:'23:30'}
    },
    dishes:[
      { id:'d1', category:'Comidas', name:'Clásica Moshaco', desc:'Carne, queso cheddar, lechuga y salsa especial.', price:18.90, rating:4.5, reviews:9, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      {
        id:'d2', category:'Comidas', name:'Promo Doble Bacon + Gaseosa', desc:'Doble carne, bacon crocante y queso — incluye una gaseosa personal.',
        price:24.50, rating:4.5, reviews:137, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop',
        options:[
          { id:'gaseosa', title:'Elige tu gaseosa (incluida)', required:true, min:1, max:1, choices:[
            { id:'inca', label:'Inca Kola', priceDelta:0 },
            { id:'coca', label:'Coca-Cola', priceDelta:0 },
            { id:'sprite', label:'Sprite', priceDelta:0 }
          ]}
        ]
      },
      { id:'d3', category:'Acompañamientos', name:'Papas Fritas', desc:'Porción grande con salsas a elección.', price:9.90, rating:3.9, reviews:107, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Comidas', name:'Chicken Crispy', desc:'Pollo crocante, mayo picante y pepinillos.', price:19.90, rating:4.1, reviews:137, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Chicha Morada 1/2L', desc:'Preparada al día, bien helada.', price:6.00, rating:5.0, reviews:117, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      { id:'d6', category:'Bebidas', name:'Gaseosa 500ml', desc:'Inca Kola, Coca-Cola o Sprite.', price:5.00, rating:4.9, reviews:173, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop' },
      {
        id:'d7', category:'Comidas', name:'Alitas Broaster (8 unid.)', desc:'Crocantes, bañadas en el sabor que elijas.',
        price:21.90, rating:4.6, reviews:64, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70&auto=format&fit=crop',
        options:[
          { id:'sabor', title:'Elige el sabor de tus alitas', required:true, min:1, max:1, choices:[
            { id:'bbq', label:'BBQ', priceDelta:0 },
            { id:'picante', label:'Picante', priceDelta:0 },
            { id:'miel-mostaza', label:'Miel mostaza', priceDelta:0 },
            { id:'buffalo', label:'Buffalo', priceDelta:1.5 }
          ]},
          { id:'extras', title:'¿Agregas algo más?', required:false, min:0, max:2, choices:[
            { id:'papas', label:'Papas fritas', priceDelta:6.0 },
            { id:'aderezo', label:'Aderezo extra', priceDelta:2.0 },
            { id:'chizitos', label:'Chizitos', priceDelta:5.0 }
          ]}
        ]
      }
    ]
  },
  {
    id:'sakura', name:'Sakura Sushi Bar', sub:'Sushi • Japonesa', badge:{type:'feat', label:'Muy pedido'},
    partnerType:'socio',
    cats:['sushi','bebidas'],
    tags:['Top rated'], rating:'4.9', reviews:518, time:'30-45 min', min:'S/ 35',
    lat:-8.3819, lng:-74.5468, address:'Malecón Grau, frente al río Ucayali',
    image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500&q=75&auto=format&fit=crop',
    hours:{
      dom:null, lun:null,
      mar:{open:'18:00', close:'23:00'}, mie:{open:'18:00', close:'23:00'}, jue:{open:'18:00', close:'23:00'},
      vie:{open:'18:00', close:'23:59'}, sab:{open:'13:00', close:'23:59'}
    },
    dishes:[
      { id:'d1', category:'Rolls', name:'Roll California x10', desc:'Palta, kanikama y queso crema.', price:22.00, rating:4.7, reviews:25, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Rolls', name:'Roll Acevichado x10', desc:'Langostino, palta y toque acevichado.', price:26.00, rating:4.4, reviews:93, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Sashimi', name:'Sashimi Salmón (10 pzs)', desc:'Corte fresco del día.', price:32.00, rating:4.4, reviews:34, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Entradas', name:'Gyozas de Cerdo', desc:'6 unidades con salsa ponzu.', price:15.00, rating:3.8, reviews:29, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Ramune Original', desc:'Gaseosa japonesa, bien helada.', price:8.00, rating:4.8, reviews:14, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'napoli', name:'Bella Napoli', sub:'Pizzas • Italiana', badge:{type:'combo', label:'2×1 martes'},
    partnerType:'externo', // sin convenio — lleva el recargo interno de envío
    cats:['pizzas','postres','bebidas'],
    tags:['Artesanal'], rating:'4.6', reviews:289, time:'20-30 min', min:'S/ 25',
    lat:-8.3690, lng:-74.5570, address:'Av. Centenario, San Fernando',
    image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=75&auto=format&fit=crop',
    hours:{
      dom:{open:'17:00', close:'22:30'}, lun:null,
      mar:{open:'17:00', close:'22:30'}, mie:{open:'17:00', close:'22:30'}, jue:{open:'17:00', close:'22:30'},
      vie:{open:'17:00', close:'23:30'}, sab:{open:'17:00', close:'23:30'}
    },
    dishes:[
      { id:'d1', category:'Pizzas', name:'Pizza Margarita', desc:'Salsa de tomate, mozzarella y albahaca.', price:28.00, rating:4.0, reviews:49, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Pizzas', name:'Pizza Pepperoni', desc:'Doble pepperoni y mozzarella.', price:32.00, rating:4.1, reviews:58, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Pastas', name:'Fettuccine Alfredo', desc:'Pasta fresca en salsa cremosa.', price:24.00, rating:4.5, reviews:106, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Postres', name:'Tiramisú', desc:'Postre clásico italiano casero.', price:14.00, rating:3.8, reviews:177, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Limonada Frozen', desc:'Limonada frappé bien fría.', price:9.00, rating:4.4, reviews:166, image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'gallo', name:'Pollería El Gallo', sub:'Pollo a la Brasa • Criolla', badge:{type:'feat', label:'Destacado'},
    partnerType:'socio',
    cats:['pollo','bebidas'],
    tags:['Clásico limeño'], rating:'4.7', reviews:631, time:'35-50 min', min:'S/ 30',
    lat:-8.3540, lng:-74.5732, address:'Av. Yarinacocha, Puerto Callao',
    image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=75&auto=format&fit=crop',
    hours:{
      dom:{open:'11:00', close:'21:00'}, lun:{open:'11:00', close:'21:00'}, mar:{open:'11:00', close:'21:00'},
      mie:{open:'11:00', close:'21:00'}, jue:{open:'11:00', close:'21:00'},
      vie:{open:'11:00', close:'22:00'}, sab:{open:'11:00', close:'22:00'}
    },
    dishes:[
      { id:'d1', category:'Comidas', name:'1/4 Pollo + Papas', desc:'Con ensalada y cremas de la casa.', price:19.00, rating:5.0, reviews:105, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      {
        id:'d6', category:'Menús', name:'Menú Ejecutivo del Día', desc:'Entrada + plato de fondo + bebida, arma tu combo.',
        price:22.00, rating:4.6, reviews:41, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop',
        options:[
          { id:'entrada', title:'Elige tu entrada', required:true, min:1, max:1, choices:[
            { id:'sopa', label:'Sopa criolla', priceDelta:0 },
            { id:'ensalada', label:'Ensalada fresca', priceDelta:0 }
          ]},
          { id:'fondo', title:'Elige tu plato de fondo', required:true, min:1, max:1, choices:[
            { id:'saltado', label:'Lomo saltado', priceDelta:0 },
            { id:'arrozconpollo', label:'Arroz con pollo', priceDelta:0 },
            { id:'pescado', label:'Pescado frito', priceDelta:3.0 }
          ]},
          { id:'bebida', title:'Elige tu bebida', required:true, min:1, max:1, choices:[
            { id:'chicha', label:'Chicha morada', priceDelta:0 },
            { id:'limonada', label:'Limonada', priceDelta:0 },
            { id:'gaseosa', label:'Gaseosa personal', priceDelta:1.5 }
          ]}
        ]
      },
      { id:'d2', category:'Comidas', name:'Pollo Entero Familiar', desc:'Pollo entero, papas y ensalada grande.', price:58.00, rating:3.8, reviews:166, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Comidas', name:'Anticuchos (2 unid.)', desc:'Corazón a la brasa con papa y choclo.', price:16.00, rating:4.4, reviews:95, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Bebidas', name:'Chicha Morada 1L', desc:'Preparada al día, bien helada.', price:8.00, rating:4.3, reviews:151, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Inca Kola 1.5L', desc:'Bien fría, para compartir.', price:10.00, rating:4.0, reviews:17, image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'dulcevida', name:'Dulce Vida', sub:'Postres • Pastelería', badge:null,
    partnerType:'externo',
    cats:['postres','bebidas'],
    tags:['Instagrameable','Nuevo'], rating:'4.5', reviews:120, time:'20-30 min', min:'S/ 15',
    lat:-8.3852, lng:-74.5493, address:'Jr. Sáenz Peña, cerca al Coliseo Regional',
    image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=75&auto=format&fit=crop',
    hours:{
      dom:{open:'14:00', close:'20:00'}, lun:{open:'14:00', close:'20:00'}, mar:{open:'14:00', close:'20:00'},
      mie:{open:'14:00', close:'20:00'}, jue:{open:'14:00', close:'20:00'},
      vie:{open:'14:00', close:'21:30'}, sab:{open:'14:00', close:'21:30'}
    },
    dishes:[
      { id:'d1', category:'Postres', name:'Cheesecake de Fresa', desc:'Porción individual, base de galleta.', price:12.50, rating:4.4, reviews:8, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Postres', name:'Brownie con Helado', desc:'Brownie tibio con bola de vainilla.', price:14.00, rating:4.1, reviews:163, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Postres', name:'Torta de Chocolate (porción)', desc:'Bizcocho húmedo, ganache de chocolate.', price:11.00, rating:5.0, reviews:33, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Helados', name:'Helado Artesanal (2 bolas)', desc:'A elección: vainilla, chocolate o lúcuma.', price:10.00, rating:4.0, reviews:20, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Frappés', name:'Frappé de Café', desc:'Café helado batido con crema.', price:13.00, rating:4.2, reviews:65, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' },
      { id:'d6', category:'Frappés', name:'Frappé de Fresa', desc:'Fresa natural batida con hielo.', price:13.00, rating:4.1, reviews:58, image:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70&auto=format&fit=crop' }
    ]
  },
  {
    id:'greenbowl', name:'Green Bowl', sub:'Saludable • Bowls', badge:null,
    partnerType:'socio',
    cats:['saludable','bebidas'],
    tags:['Fit','Vegetariano'], rating:'4.6', reviews:98, time:'15-25 min', min:'S/ 18',
    lat:-8.3742, lng:-74.5721, address:'Av. Aviación, cerca al aeropuerto',
    image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=75&auto=format&fit=crop',
    hours:{
      dom:null, lun:{open:'08:00', close:'17:00'}, mar:{open:'08:00', close:'17:00'}, mie:{open:'08:00', close:'17:00'},
      jue:{open:'08:00', close:'17:00'}, vie:{open:'08:00', close:'17:00'}, sab:{open:'09:00', close:'15:00'}
    },
    dishes:[
      { id:'d1', category:'Comidas', name:'Bowl Poke de Atún', desc:'Atún fresco, palta, arroz y vegetales.', price:23.00, rating:4.7, reviews:110, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d2', category:'Comidas', name:'Bowl Quinua & Pollo', desc:'Quinua, pollo grillado y vegetales de estación.', price:21.00, rating:3.8, reviews:51, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d3', category:'Comidas', name:'Wrap Vegetariano', desc:'Hummus, vegetales frescos y palta.', price:17.00, rating:4.3, reviews:78, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d4', category:'Bebidas', name:'Jugo Verde Detox', desc:'Apio, piña, espinaca y limón.', price:9.00, rating:3.9, reviews:133, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' },
      { id:'d5', category:'Bebidas', name:'Limonada de Hierbabuena', desc:'Refrescante, endulzada con miel.', price:8.00, rating:4.4, reviews:131, image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70&auto=format&fit=crop' }
    ]
  }
];
