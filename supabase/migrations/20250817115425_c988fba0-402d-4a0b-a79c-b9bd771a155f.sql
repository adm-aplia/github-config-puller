
-- 1) Remover duplicados por (user_id, instance_name), mantendo o mais recente
WITH ranked AS (
  SELECT
    id,
    user_id,
    instance_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, instance_name
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.whatsapp_instances
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.whatsapp_instances
WHERE id IN (SELECT id FROM dupes);

-- 2) Remover duplicados por (user_id, evolution_instance_id) quando não nulo, mantendo o mais recente
WITH ranked_evo AS (
  SELECT
    id,
    user_id,
    evolution_instance_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, evolution_instance_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.whatsapp_instances
  WHERE evolution_instance_id IS NOT NULL
),
dupes_evo AS (
  SELECT id FROM ranked_evo WHERE rn > 1
)
DELETE FROM public.whatsapp_instances
WHERE id IN (SELECT id FROM dupes_evo);

-- 3) Índice único para garantir que não haja duplicidade do instance_name por usuário
CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_instances_user_instance_name
  ON public.whatsapp_instances(user_id, instance_name);

-- 4) Índice único (parcial) para evolution_instance_id por usuário quando não for nulo
CREATE UNIQUE INDEX IF NOT EXISTS ux_whatsapp_instances_user_evolution_id
  ON public.whatsapp_instances(user_id, evolution_instance_id)
  WHERE evolution_instance_id IS NOT NULL;
