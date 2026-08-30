-- ============================================================================
-- PROJECT TASK & FEATURE TRACKER — Supabase Schema
-- ============================================================================
-- Ejecuta este script completo en: Supabase Dashboard → SQL Editor → New query
-- ============================================================================

-- 1. EXTENSIONES ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- 2. TABLA: projects ---------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  color       text default '#4C9FE8',      -- color de acento del proyecto en la UI
  is_archived boolean default false,
  created_at  timestamptz not null default now()
);

comment on table public.projects is 'Proyectos del usuario. Cada usuario solo ve los suyos (RLS).';

-- 3. TABLA: tasks -------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  category    text default 'General',       -- ej: 'Diseño UI', 'API Supabase'
  status      text not null default 'pendiente'
              check (status in ('pendiente', 'en_proceso', 'revision', 'hecho')),
  target_date date,                          -- fecha objetivo/entrega (opcional)
  sort_order  integer default 0,             -- para drag-and-drop en el futuro
  created_at  timestamptz not null default now()
);

comment on table public.tasks is 'Tareas/funciones de un proyecto (filas de la matriz).';

-- 4. TABLA: task_logs ---------------------------------------------------------
-- Un registro por cada celda marcada en la matriz (tarea x día).
create table if not exists public.task_logs (
  id           uuid primary key default uuid_generate_v4(),
  task_id      uuid not null references public.tasks (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  log_date     date not null,
  value        smallint not null default 1,  -- 0 = sin avance, 1 = avance/completado
  completed_at timestamptz not null default now(),
  unique (task_id, log_date)                  -- una sola celda por tarea/día
);

comment on table public.task_logs is 'Avance diario por tarea. Una fila = una celda marcada en la matriz.';

-- 5. ÍNDICES --------------------------------------------------------------
create index if not exists idx_tasks_project_id      on public.tasks (project_id);
create index if not exists idx_task_logs_task_id      on public.task_logs (task_id);
create index if not exists idx_task_logs_log_date     on public.task_logs (log_date);
create index if not exists idx_projects_user_id       on public.projects (user_id);

-- 6. ROW LEVEL SECURITY (RLS) ------------------------------------------------
alter table public.projects  enable row level security;
alter table public.tasks     enable row level security;
alter table public.task_logs enable row level security;

-- Políticas: projects ---------------------------------------------------------
create policy "select_own_projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "insert_own_projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "update_own_projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "delete_own_projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Políticas: tasks --------------------------------------------------------
create policy "select_own_tasks" on public.tasks
  for select using (auth.uid() = user_id);

create policy "insert_own_tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "update_own_tasks" on public.tasks
  for update using (auth.uid() = user_id);

create policy "delete_own_tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Políticas: task_logs -----------------------------------------------------
create policy "select_own_task_logs" on public.task_logs
  for select using (auth.uid() = user_id);

create policy "insert_own_task_logs" on public.task_logs
  for insert with check (auth.uid() = user_id);

create policy "update_own_task_logs" on public.task_logs
  for update using (auth.uid() = user_id);

create policy "delete_own_task_logs" on public.task_logs
  for delete using (auth.uid() = user_id);

-- 7. FUNCIÓN AUXILIAR: progreso de un proyecto (opcional, útil para RPC) -----
create or replace function public.project_progress(p_project_id uuid)
returns table (total_tasks bigint, done_tasks bigint, percent numeric) as $$
  select
    count(distinct t.id) as total_tasks,
    count(distinct t.id) filter (where t.status = 'hecho') as done_tasks,
    case when count(distinct t.id) = 0 then 0
      else round(
        (count(distinct t.id) filter (where t.status = 'hecho')::numeric
        / count(distinct t.id)) * 100, 1)
    end as percent
  from public.tasks t
  where t.project_id = p_project_id;
$$ language sql stable security invoker;

-- ============================================================================
-- FIN. Después de ejecutar esto, ve a Authentication → Providers y activa
-- "Email" (con o sin confirmación) para permitir Login/Registro y Magic Link.
-- ============================================================================
