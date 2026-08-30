/* ============================================================================
   BITÁCORA — app.js
   SPA vanilla JS (ES6+) para seguimiento de proyectos, conectada a Supabase.
   ========================================================================== */

/* ----------------------------------------------------------------------
   0. CONFIGURACIÓN SUPABASE
   ------------------------------------------------------------------------
   Sustituye estos dos valores por los de tu proyecto Supabase:
   Dashboard → Project Settings → API → "Project URL" y "anon public" key.
   La clave "anon" es pública por diseño (se protege con RLS), así que es
   seguro dejarla en el código del cliente para GitHub Pages.
   ---------------------------------------------------------------------- */
const SUPABASE_URL = 'https://bggxquhuwviyjkbsnkoe.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ3hxdWh1d3ZpeWprYnNua29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTYwMjgsImV4cCI6MjEwMzY5MjAyOH0.PTGwIGk-WVTbL80Fqf_EDxyFvt4ep-nMhxj2BUUgAt0';

let supabase = null;

/* ----------------------------------------------------------------------
   1. ESTADO GLOBAL
   ---------------------------------------------------------------------- */
const state = {
  user: null,
  projects: [],
  currentProjectId: null,
  currentDate: new Date(),       // controla el mes/año visible
  tasks: [],                     // tareas del proyecto activo (todas, sin filtrar por mes)
  logs: new Map(),               // clave `${taskId}_${YYYY-MM-DD}` -> log row
  filters: { category: '', status: '' },
  currentView: 'matrix',
  weeklyChart: null,
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
  'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const STATUS_LABEL = { pendiente:'Pendiente', en_proceso:'En proceso', revision:'Revisión', hecho:'Hecho' };

/* ----------------------------------------------------------------------
   2. UTILIDADES
   ---------------------------------------------------------------------- */
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function pad2(n){ return String(n).padStart(2,'0'); }
function isoDate(y,m,d){ return `${y}-${pad2(m+1)}-${pad2(d)}`; }
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function todayIso(){ const t = new Date(); return isoDate(t.getFullYear(), t.getMonth(), t.getDate()); }

function showToast(msg, isError=false){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('is-error', isError);
  el.classList.remove('is-hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('is-hidden'), 2600);
}

function openModal(id){ $(id).classList.remove('is-hidden'); }
function closeModal(id){ $(id).classList.add('is-hidden'); }

/* ----------------------------------------------------------------------
   3. ARRANQUE
   ---------------------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  // Espera a que las libs con `defer` (supabase-js, chart.js) estén listas.
  waitForLibs().then(() => {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    bindAuthUI();
    bindAppUI();
    listenToAuthChanges();
  });
});

function waitForLibs(){
  return new Promise((resolve) => {
    (function check(){
      if (window.supabase && window.Chart) resolve();
      else setTimeout(check, 40);
    })();
  });
}

/* ----------------------------------------------------------------------
   4. AUTENTICACIÓN
   ---------------------------------------------------------------------- */
function listenToAuthChanges(){
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session && session.user){
      state.user = session.user;
      showApp();
    } else {
      state.user = null;
      showAuth();
    }
  });

  supabase.auth.getSession().then(({ data }) => {
    if (data.session && data.session.user){
      state.user = data.session.user;
      showApp();
    }
  });
}

function bindAuthUI(){
  $all('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $all('.auth-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const which = tab.dataset.authTab;
      $('#auth-form-login').classList.toggle('is-hidden', which !== 'login');
      $('#auth-form-signup').classList.toggle('is-hidden', which !== 'signup');
      $('#auth-message').textContent = '';
    });
  });

  $('#auth-form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setAuthMessage('Entrando…', false);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email'), password: fd.get('password'),
    });
    if (error) setAuthMessage(error.message, true);
  });

  $('#auth-form-signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setAuthMessage('Creando cuenta…', false);
    const { error } = await supabase.auth.signUp({
      email: fd.get('email'), password: fd.get('password'),
    });
    if (error) setAuthMessage(error.message, true);
    else setAuthMessage('Cuenta creada. Revisa tu correo si se requiere confirmación.', false, true);
  });

  $('#btn-magic-link').addEventListener('click', async () => {
    const email = $('#auth-form-login input[name="email"]').value.trim();
    if (!email) return setAuthMessage('Escribe tu correo primero.', true);
    setAuthMessage('Enviando enlace…', false);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setAuthMessage(error.message, true);
    else setAuthMessage('Enlace mágico enviado. Revisa tu correo.', false, true);
  });
}

function setAuthMessage(msg, isError, isSuccess=false){
  const el = $('#auth-message');
  el.textContent = msg;
  el.classList.toggle('is-success', isSuccess && !isError);
  el.style.color = isError ? 'var(--coral)' : (isSuccess ? 'var(--green)' : 'var(--text-mid)');
}

function showAuth(){
  $('#auth-screen').classList.remove('is-hidden');
  $('#app').classList.add('is-hidden');
}

async function showApp(){
  $('#auth-screen').classList.add('is-hidden');
  $('#app').classList.remove('is-hidden');
  $('#label-user-email').textContent = state.user.email || '';
  await loadProjects();
}

/* ----------------------------------------------------------------------
   5. UI GENERAL (nav, modales, mes)
   ---------------------------------------------------------------------- */
function bindAppUI(){
  $('#btn-signout').addEventListener('click', () => supabase.auth.signOut());

  // Navegación de vistas
  $all('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Mes
  $('#btn-prev-month').addEventListener('click', () => changeMonth(-1));
  $('#btn-next-month').addEventListener('click', () => changeMonth(1));

  // Proyecto
  $('#select-project').addEventListener('change', (e) => {
    state.currentProjectId = e.target.value;
    loadTasksAndLogs();
  });
  $('#btn-new-project').addEventListener('click', () => openModal('#modal-project'));
  $('#form-new-project').addEventListener('submit', onCreateProject);

  // Tarea
  $('#btn-add-task').addEventListener('click', () => openModal('#modal-task'));
  $('#form-new-task').addEventListener('submit', onCreateTask);

  // Cerrar modales
  $all('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.add('is-hidden'));
  });
  $all('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.add('is-hidden'); });
  });

  // Filtros
  $('#filter-category').addEventListener('change', (e) => { state.filters.category = e.target.value; renderAll(); });
  $('#filter-status').addEventListener('change', (e) => { state.filters.status = e.target.value; renderAll(); });
}

function switchView(view){
  state.currentView = view;
  $all('.nav-btn').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
  $all('.view').forEach(v => v.classList.remove('is-active'));
  $(`#view-${view}`).classList.add('is-active');
  renderAll();
}

function changeMonth(delta){
  const d = state.currentDate;
  state.currentDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  loadTasksAndLogs();
}

function updateMonthLabel(){
  const d = state.currentDate;
  $('#label-month').textContent = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/* ----------------------------------------------------------------------
   6. PROYECTOS
   ---------------------------------------------------------------------- */
async function loadProjects(){
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (error) return showToast('Error cargando proyectos: ' + error.message, true);

  state.projects = data || [];
  renderProjectSelect();

  if (!state.currentProjectId && state.projects.length){
    state.currentProjectId = state.projects[0].id;
  }
  if (state.currentProjectId){
    await loadTasksAndLogs();
  } else {
    renderAll(); // sin proyectos aún
  }
  renderSettingsProjects();
}

function renderProjectSelect(){
  const sel = $('#select-project');
  sel.innerHTML = '';
  if (!state.projects.length){
    const opt = document.createElement('option');
    opt.textContent = 'Sin proyectos — crea uno';
    sel.appendChild(opt);
    return;
  }
  state.projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.title;
    if (p.id === state.currentProjectId) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function onCreateProject(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const { data, error } = await supabase.from('projects').insert({
    user_id: state.user.id,
    title: fd.get('title'),
    description: fd.get('description') || null,
    color: fd.get('color'),
  }).select().single();

  if (error) return showToast('Error creando proyecto: ' + error.message, true);

  state.projects.push(data);
  state.currentProjectId = data.id;
  renderProjectSelect();
  renderSettingsProjects();
  closeModal('#modal-project');
  e.target.reset();
  showToast('Proyecto creado.');
  loadTasksAndLogs();
}

function renderSettingsProjects(){
  const ul = $('#settings-project-list');
  ul.innerHTML = '';
  if (!state.projects.length){
    ul.innerHTML = '<li class="settings-hint">Aún no tienes proyectos.</li>';
    return;
  }
  state.projects.forEach(p => {
    const li = document.createElement('li');
    li.className = 'settings-project-item';
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(p.title)}</strong><br/>
        <span>${escapeHtml(p.description || 'Sin descripción')}</span>
      </div>
      <button class="btn btn-ghost btn-small" data-archive="${p.id}">Archivar</button>
    `;
    ul.appendChild(li);
  });
  $all('[data-archive]', ul).forEach(btn => {
    btn.addEventListener('click', () => archiveProject(btn.dataset.archive));
  });
}

async function archiveProject(id){
  const { error } = await supabase.from('projects').update({ is_archived: true }).eq('id', id);
  if (error) return showToast('Error: ' + error.message, true);
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.currentProjectId === id){
    state.currentProjectId = state.projects[0]?.id || null;
  }
  renderProjectSelect();
  renderSettingsProjects();
  loadTasksAndLogs();
  showToast('Proyecto archivado.');
}

/* ----------------------------------------------------------------------
   7. TAREAS Y REGISTROS DE AVANCE
   ---------------------------------------------------------------------- */
async function loadTasksAndLogs(){
  updateMonthLabel();

  if (!state.currentProjectId){
    state.tasks = [];
    state.logs = new Map();
    return renderAll();
  }

  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', state.currentProjectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (taskErr) return showToast('Error cargando tareas: ' + taskErr.message, true);
  state.tasks = tasks || [];

  const y = state.currentDate.getFullYear();
  const m = state.currentDate.getMonth();
  const from = isoDate(y, m, 1);
  const to = isoDate(y, m, daysInMonth(y, m));

  state.logs = new Map();
  if (state.tasks.length){
    const taskIds = state.tasks.map(t => t.id);
    const { data: logs, error: logErr } = await supabase
      .from('task_logs')
      .select('*')
      .in('task_id', taskIds)
      .gte('log_date', from)
      .lte('log_date', to);

    if (logErr) return showToast('Error cargando avance: ' + logErr.message, true);
    (logs || []).forEach(l => state.logs.set(`${l.task_id}_${l.log_date}`, l));
  }

  renderCategoryFilter();
  renderAll();
}

function renderCategoryFilter(){
  const sel = $('#filter-category');
  const current = state.filters.category;
  const cats = [...new Set(state.tasks.map(t => t.category).filter(Boolean))];
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = cats.includes(current) ? current : '';
  state.filters.category = sel.value;

  const datalist = $('#category-suggestions');
  if (datalist) datalist.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
}

function getFilteredTasks(){
  return state.tasks.filter(t => {
    if (state.filters.category && t.category !== state.filters.category) return false;
    if (state.filters.status && t.status !== state.filters.status) return false;
    return true;
  });
}

async function onCreateTask(e){
  e.preventDefault();
  if (!state.currentProjectId) return showToast('Crea un proyecto primero.', true);
  const fd = new FormData(e.target);
  const { data, error } = await supabase.from('tasks').insert({
    project_id: state.currentProjectId,
    user_id: state.user.id,
    title: fd.get('title'),
    category: fd.get('category') || 'General',
    target_date: fd.get('target_date') || null,
    sort_order: state.tasks.length,
  }).select().single();

  if (error) return showToast('Error creando tarea: ' + error.message, true);

  state.tasks.push(data);
  renderCategoryFilter();
  renderAll();
  closeModal('#modal-task');
  e.target.reset();
  showToast('Función añadida.');
}

async function deleteTask(taskId){
  if (!confirm('¿Eliminar esta función y todo su avance registrado?')) return;
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) return showToast('Error: ' + error.message, true);
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  renderCategoryFilter();
  renderAll();
  showToast('Función eliminada.');
}

async function updateTaskStatus(taskId, status){
  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
  if (error) return showToast('Error: ' + error.message, true);
  const t = state.tasks.find(t => t.id === taskId);
  if (t) t.status = status;
  renderAll();
}

/* Marca / desmarca una celda de avance diario (optimista + Supabase). */
async function toggleCell(taskId, dateIso, btnEl){
  const key = `${taskId}_${dateIso}`;
  const existing = state.logs.get(key);

  if (existing){
    state.logs.delete(key);
    btnEl.classList.remove('is-done');
    updateStatsAndCounters();
    const { error } = await supabase.from('task_logs').delete().eq('id', existing.id);
    if (error){
      state.logs.set(key, existing);
      btnEl.classList.add('is-done');
      updateStatsAndCounters();
      showToast('Error al desmarcar: ' + error.message, true);
    }
  } else {
    const optimistic = { id: 'tmp_' + Date.now(), task_id: taskId, log_date: dateIso, value: 1 };
    state.logs.set(key, optimistic);
    btnEl.classList.add('is-done');
    updateStatsAndCounters();
    const { data, error } = await supabase.from('task_logs')
      .insert({ task_id: taskId, user_id: state.user.id, log_date: dateIso, value: 1 })
      .select().single();
    if (error){
      state.logs.delete(key);
      btnEl.classList.remove('is-done');
      updateStatsAndCounters();
      showToast('Error al marcar: ' + error.message, true);
    } else {
      state.logs.set(key, data);
    }
  }
}

/* ----------------------------------------------------------------------
   8. RENDER: orquestador
   ---------------------------------------------------------------------- */
function renderAll(){
  renderTaskList();
  if (state.currentView === 'matrix') renderMatrix();
  if (state.currentView === 'kanban') renderKanban();
  if (state.currentView === 'settings') renderSettingsProjects();
  updateStatsAndCounters();
}

/* ----------------------------------------------------------------------
   9. RENDER: panel lateral de tareas
   ---------------------------------------------------------------------- */
function renderTaskList(){
  const ul = $('#task-list');
  ul.innerHTML = '';
  const tasks = getFilteredTasks();

  if (!tasks.length){
    ul.innerHTML = '<li class="settings-hint" style="padding:8px;">Sin funciones que coincidan.</li>';
    return;
  }

  tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <div class="task-item-top">
        <span class="task-item-title">${escapeHtml(t.title)}</span>
        <span class="task-status-dot ${t.status}" title="${STATUS_LABEL[t.status]}"></span>
      </div>
      <div class="task-item-cat">${escapeHtml(t.category || 'General')}</div>
      <div class="task-item-actions">
        <select data-status-for="${t.id}">
          ${Object.entries(STATUS_LABEL).map(([v,l]) =>
            `<option value="${v}" ${t.status===v?'selected':''}>${l}</option>`).join('')}
        </select>
        <button class="task-item-delete" data-delete="${t.id}" title="Eliminar">✕</button>
      </div>
    `;
    ul.appendChild(li);
  });

  $all('[data-status-for]', ul).forEach(sel => {
    sel.addEventListener('change', () => updateTaskStatus(sel.dataset.statusFor, sel.value));
  });
  $all('[data-delete]', ul).forEach(btn => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.delete));
  });
}

/* ----------------------------------------------------------------------
   10. RENDER: matriz temporal
   ---------------------------------------------------------------------- */
function renderMatrix(){
  const tasks = getFilteredTasks();
  const y = state.currentDate.getFullYear();
  const m = state.currentDate.getMonth();
  const nDays = daysInMonth(y, m);
  const today = todayIso();

  $('#matrix-empty').classList.toggle('is-hidden', tasks.length > 0);
  $('#matrix-table').classList.toggle('is-hidden', tasks.length === 0);
  if (!tasks.length) return;

  // Cabecera
  const headRow = $('#matrix-head-days');
  headRow.innerHTML = '<th class="th-task">Función</th>';
  for (let d = 1; d <= nDays; d++){
    const dow = new Date(y, m, d).getDay(); // 0 domingo, 6 sábado
    const th = document.createElement('th');
    th.textContent = d;
    if (dow === 0 || dow === 6) th.classList.add('is-weekend');
    headRow.appendChild(th);
  }
  const thProgress = document.createElement('th');
  thProgress.textContent = '%';
  headRow.appendChild(thProgress);

  // Cuerpo
  const body = $('#matrix-body');
  body.innerHTML = '';
  tasks.forEach(t => {
    const tr = document.createElement('tr');
    const tdTask = document.createElement('td');
    tdTask.className = 'td-task';
    tdTask.textContent = t.title;
    tr.appendChild(tdTask);

    let doneCount = 0;
    for (let d = 1; d <= nDays; d++){
      const dateIso = isoDate(y, m, d);
      const td = document.createElement('td');
      td.className = 'td-cell';
      const btn = document.createElement('button');
      btn.className = 'cell-btn';
      btn.setAttribute('aria-label', `${t.title} — día ${d}`);
      if (dateIso === today) btn.classList.add('is-today');
      const key = `${t.id}_${dateIso}`;
      if (state.logs.has(key)){
        btn.classList.add('is-done');
        doneCount++;
      }
      btn.addEventListener('click', () => toggleCell(t.id, dateIso, btn));
      td.appendChild(btn);
      tr.appendChild(td);
    }

    const tdProgress = document.createElement('td');
    tdProgress.className = 'task-progress-cell';
    tdProgress.textContent = Math.round((doneCount / nDays) * 100) + '%';
    tr.appendChild(tdProgress);

    body.appendChild(tr);
  });
}

/* ----------------------------------------------------------------------
   11. RENDER: Kanban (con drag-and-drop)
   ---------------------------------------------------------------------- */
function renderKanban(){
  const tasks = getFilteredTasks();
  $all('.kanban-col-body').forEach(col => { col.innerHTML = ''; });

  tasks.forEach(t => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.taskId = t.id;
    card.innerHTML = `
      <div>${escapeHtml(t.title)}</div>
      <div class="kanban-card-cat">${escapeHtml(t.category || 'General')}</div>
    `;
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', t.id);
      setTimeout(() => card.style.opacity = '0.4', 0);
    });
    card.addEventListener('dragend', () => { card.style.opacity = '1'; });

    const zone = $(`.kanban-col-body[data-dropzone="${t.status}"]`);
    (zone || $('.kanban-col-body[data-dropzone="pendiente"]')).appendChild(card);
  });

  $all('.kanban-col-body').forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('is-dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      const taskId = e.dataTransfer.getData('text/plain');
      updateTaskStatus(taskId, zone.dataset.dropzone);
    });
  });
}

/* ----------------------------------------------------------------------
   12. ESTADÍSTICAS Y GRÁFICO
   ---------------------------------------------------------------------- */
function updateStatsAndCounters(){
  const tasks = state.tasks;
  const doneTasks = tasks.filter(t => t.status === 'hecho').length;
  const pendingTasks = tasks.length - doneTasks;

  const y = state.currentDate.getFullYear();
  const m = state.currentDate.getMonth();
  const nDays = daysInMonth(y, m);
  const totalCells = tasks.length * nDays;
  const doneCells = state.logs.size;
  const percent = totalCells ? Math.round((doneCells / totalCells) * 100) : 0;

  $('#stat-percent').textContent = percent + '%';
  $('#stat-done').textContent = doneTasks;
  $('#stat-pending').textContent = pendingTasks;

  renderWeeklyChart();
}

function renderWeeklyChart(){
  const y = state.currentDate.getFullYear();
  const m = state.currentDate.getMonth();
  const nDays = daysInMonth(y, m);
  const tasks = state.tasks;

  // Agrupa el avance diario (celdas marcadas / celdas posibles) en 4-5 semanas.
  const weeks = [];
  let cursor = 1;
  while (cursor <= nDays){
    const end = Math.min(cursor + 6, nDays);
    let done = 0, possible = 0;
    for (let d = cursor; d <= end; d++){
      const dateIso = isoDate(y, m, d);
      tasks.forEach(t => {
        possible++;
        if (state.logs.has(`${t.id}_${dateIso}`)) done++;
      });
    }
    weeks.push(possible ? Math.round((done / possible) * 100) : 0);
    cursor = end + 1;
  }

  const ctx = $('#chart-weekly');
  if (!ctx) return;

  if (state.weeklyChart) state.weeklyChart.destroy();
  state.weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map((_, i) => `S${i+1}`),
      datasets: [{
        data: weeks,
        backgroundColor: '#E8B04B',
        borderRadius: 2,
        barThickness: 14,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: (ctx) => `${ctx.parsed.y}% de avance`,
      }}},
      scales: {
        x: { grid: { display: false }, ticks: { color: '#6B7793', font: { size: 10 } } },
        y: { display: false, min: 0, max: 100 },
      },
    },
  });
}

/* ----------------------------------------------------------------------
   13. HELPERS
   ---------------------------------------------------------------------- */
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
