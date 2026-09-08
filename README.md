# Moshaco 🐒

Landing + demo funcional de una app de delivery (comida, súper, farmacia) para Pucallpa, Perú. Sitio 100% estático (HTML/CSS/JS puro, sin frameworks ni build step), listo para publicarse en **GitHub Pages**.

## Estructura del proyecto

```
moshaco/
├── index.html              # Única página (single-page app, sin backend)
├── css/
│   └── styles.css          # Todos los estilos
├── js/
│   ├── data/
│   │   ├── promos.js       # Datos del carrusel de promociones
│   │   └── restaurants.js  # Datos de restaurantes y platos
│   ├── theme.js             # Tema claro/oscuro
│   ├── scroll-reveal.js     # Animaciones al hacer scroll
│   ├── promo-carousel.js    # Carrusel de promociones
│   ├── categories.js        # Chips de categorías
│   ├── delivery.js          # Cálculo de envío + grilla de restaurantes
│   ├── cart-core.js         # Estado del carrito (cantidades, totales)
│   ├── views.js             # Cambio de vistas (home / menú / etc.)
│   ├── dish-options.js      # Modal "Personaliza tu plato"
│   ├── search.js            # Buscador (overlay mobile/desktop)
│   ├── addresses.js         # Vista "Mis direcciones"
│   ├── geocoding.js         # Búsqueda de direcciones con reintento
│   ├── map-confirm.js       # Confirmar dirección con mapa (Leaflet)
│   ├── cart-modal.js        # Modal del carrito
│   ├── whatsapp-order.js    # Envío del pedido por WhatsApp
│   ├── order-history.js     # Historial de pedidos (localStorage)
│   ├── auth.js               # Login por celular + código OTP
│   └── session.js            # Sesión persistente + modal de ubicación
└── assets/
    ├── logo-light.png
    └── logo-dark.png
```

El proyecto **no usa módulos ES ni bundler**: cada archivo JS se carga con una etiqueta `<script>` normal, en un orden pensado a propósito (primero los datos, luego cada módulo). Todos comparten el mismo scope global del navegador, tal como funcionaba el `script.js` original — solo que ahora cada responsabilidad vive en su propio archivo, en vez de un solo archivo de ~2000 líneas.

Esto significa que **no hace falta ningún paso de compilación**: se puede abrir `index.html` directamente o subir la carpeta tal cual a cualquier hosting estático.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio en GitHub y sube el contenido de esta carpeta a la rama `main`.
2. Entra a **Settings → Pages** del repositorio.
3. En "Build and deployment" elige **Deploy from a branch**, selecciona la rama `main` y la carpeta `/ (root)`.
4. Guarda. En un par de minutos el sitio queda publicado en `https://<tu-usuario>.github.io/<tu-repo>/`.

El archivo `.nojekyll` incluido evita que GitHub Pages procese el sitio con Jekyll (no lo necesita, es HTML/CSS/JS puro), lo que hace el despliegue más rápido y evita conflictos con archivos/carpetas que empiecen con `_`.

## Datos de ejemplo

`js/data/restaurants.js` y `js/data/promos.js` contienen datos de ejemplo (restaurantes, platos, promociones) pensados para reemplazarse por una llamada real a un backend (por ejemplo Supabase, como sugieren los comentarios dentro de esos archivos).

## Notas técnicas

- El mapa de confirmación de dirección usa **Leaflet** + tiles de OpenStreetMap (vía CDN, no requiere API key).
- El pedido final se envía por **WhatsApp** (`js/whatsapp-order.js`) armando un mensaje con el detalle completo del carrito.
- El login es una simulación de OTP por WhatsApp (no envía SMS/WhatsApp real); la sesión y el historial de pedidos se guardan en `localStorage` del navegador.
- Las imágenes de platos/restaurantes se cargan desde Unsplash vía URL — para producción conviene alojarlas junto con el resto de los `assets/`.

## Próximas mejoras sugeridas

- Optimizar y comprimir `assets/logo-light.png` / `logo-dark.png` (pesan más de lo necesario para un logo).
- Reemplazar los datos de ejemplo por una API/backend real.
- Agregar un manifest (`site.webmanifest`) e íconos en varios tamaños si se quiere que funcione como PWA instalable.
