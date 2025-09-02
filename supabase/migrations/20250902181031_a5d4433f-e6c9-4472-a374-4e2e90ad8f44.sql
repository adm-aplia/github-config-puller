
-- 1) Remover a FK antiga (profiles)
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey;

-- 2) Sanitizar dados: limpar agent_id inválidos
UPDATE public.conversations c
SET agent_id = NULL
WHERE agent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.professional_profiles p WHERE p.id = c.agent_id
  );

-- 3) Criar a nova FK para professional_profiles
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_agent_id_fkey
FOREIGN KEY (agent_id)
REFERENCES public.professional_profiles(id)
ON DELETE SET NULL;

-- 4) Atualizar a função que ainda dependia de public.profiles
CREATE OR REPLACE FUNCTION public.get_user_usage_summary(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_limits RECORD;
    v_usage JSON;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Garantir limites
    SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = v_user_id;
    IF NOT FOUND THEN
        INSERT INTO public.usuario_limites (user_id) VALUES (v_user_id);
        SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = v_user_id;
    END IF;

    -- Calcular uso atual
    SELECT json_build_object(
        'assistentes', json_build_object(
            'usado', (SELECT COUNT(*) FROM public.professional_profiles WHERE user_id = v_user_id),
            'limite', v_limits.max_assistentes
        ),
        'instancias', json_build_object(
            'usado', (SELECT COUNT(*) FROM public.whatsapp_instances WHERE user_id = v_user_id),
            'limite', v_limits.max_instancias_whatsapp
        ),
        'conversas_mes', json_build_object(
            'usado', v_limits.uso_conversas_mes,
            'limite', v_limits.max_conversas_mes
        ),
        'agendamentos_mes', json_build_object(
            'usado', v_limits.uso_agendamentos_mes,
            'limite', v_limits.max_agendamentos_mes
        )
    ) INTO v_usage;

    RETURN v_usage;
END;
$function$;

-- 5) Remover a tabela legacy 'profiles'
DROP TABLE IF EXISTS public.profiles;
