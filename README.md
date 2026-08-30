# Bitácora — Project Task & Feature Tracker

SPA en HTML/CSS/JS vanilla + Supabase, pensada para desplegarse en GitHub Pages.

## Archivos

| Archivo | Contenido |
|---|---|
| `schema.sql` | DDL de `projects`, `tasks`, `task_logs`, índices y políticas RLS |
| `index.html` | Estructura: login, header, sidebar, vista Matriz, Kanban, Configuración |
| `style.css` | Identidad visual (tema "mesa de dibujo técnico": tinta azul, acentos dorado/azul/coral) |
| `app.js` | Cliente Supabase, autenticación, CRUD, render de la matriz/Kanban/gráfico |

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega el contenido de `schema.sql` completo y ejecútalo.
3. Ve a **Authentication → Providers → Email** y actívalo (puedes desactivar "Confirm email" mientras pruebas, para entrar de inmediato tras registrarte).
4. Ve a **Project Settings → API** y copia:
   - **Project URL** → es tu `SUPABASE_URL`
   - **anon public key** → es tu `SUPABASE_ANON_KEY`

## 2. Configurar las credenciales en el cliente

Este es el punto donde más dudas surgen con GitHub Pages, así que va con calma:

**GitHub Pages sirve archivos estáticos.** No existe un "servidor" que pueda ocultar variables de entorno en tiempo de ejecución — todo lo que llega al navegador es público, sin importar el método que uses. Por eso Supabase diseñó la `anon key` para ser expuesta: no da acceso a nada por sí sola, solo identifica tu proyecto. El acceso real a los datos lo controla **Row Level Security** (ya configurado en `schema.sql`), que solo deja a cada usuario ver y modificar sus propias filas. Poner la `anon key` en `app.js` es la práctica estándar y segura para este tipo de despliegue.

Lo que **nunca** debes exponer es la **service_role key** (esa sí salta todas las políticas RLS) — no la uses en este proyecto en absoluto.

### Opción A — Directo en `app.js` (la más simple)

Abre `app.js` y reemplaza las dos primeras constantes:

```js
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anon-publica';
```

Guarda, haz commit y despliega. Listo.

### Opción B — Inyectar los valores en el build con GitHub Actions

Si prefieres no dejar las claves "a la vista" en el historial de commits (aunque sean públicas por diseño), puedes inyectarlas durante el despliegue usando **GitHub Actions Secrets**:

1. En tu repositorio: **Settings → Secrets and variables → Actions → New repository secret**. Crea `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
2. Deja en `app.js` un marcador de posición, por ejemplo `__SUPABASE_URL__` y `__SUPABASE_ANON_KEY__`, en vez de los valores reales.
3. Añade `.github/workflows/deploy.yml` con un paso que sustituya los marcadores antes de publicar:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Inyectar variables de Supabase
        run: |
          sed -i "s|__SUPABASE_URL__|${{ secrets.SUPABASE_URL }}|g" app.js
          sed -i "s|__SUPABASE_ANON_KEY__|${{ secrets.SUPABASE_ANON_KEY }}|g" app.js
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - uses: actions/deploy-pages@v4
```

Con esto los valores nunca aparecen en tu rama `main`, solo en el artefacto publicado — aunque, de nuevo, siguen siendo visibles para cualquiera que inspeccione el sitio publicado, porque así funciona cualquier app 100% frontend.

## 3. Publicar en GitHub Pages

1. Sube `index.html`, `style.css` y `app.js` a la raíz de tu repositorio (o a `/docs` si prefieres esa carpeta).
2. **Settings → Pages → Source**: elige la rama y carpeta donde están los archivos.
3. Espera 1–2 minutos y tu app quedará disponible en `https://tu-usuario.github.io/tu-repo/`.

## 4. Primer uso

1. Abre la app, pestaña **Crear cuenta**, regístrate con correo y contraseña (o usa el enlace mágico).
2. Crea tu primer proyecto con el botón **+** junto al selector de proyecto.
3. Añade funciones/tareas desde el botón **+** del panel izquierdo.
4. Haz clic en las celdas de la matriz para marcar avance diario — el porcentaje y el gráfico superior se recalculan al instante.
5. Cambia a la vista **Kanban** para mover tareas entre estados arrastrando las tarjetas.

## Notas técnicas

- Sin frameworks: JS vanilla + `@supabase/supabase-js` v2 y `Chart.js` vía CDN.
- Las lecturas de `task_logs` se filtran por mes visible para mantener las consultas ligeras; cambiar de mes dispara una nueva consulta.
- Los checkboxes de la matriz actualizan el estado local de forma optimista y revierten si Supabase devuelve un error.
- El scroll horizontal de la matriz es nativo (`overflow:auto`), funciona con gesto táctil en móvil sin JS adicional.
