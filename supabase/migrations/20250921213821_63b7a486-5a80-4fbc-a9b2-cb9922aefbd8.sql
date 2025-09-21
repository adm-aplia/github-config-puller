-- Alterar valor padrão de max_assistentes para 0 na função initialize_user_data
CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := COALESCE(p_user_id, auth.uid());
    v_user_email text;
    v_user_name text;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;

    -- Get user info from auth.users
    SELECT email, COALESCE(raw_user_meta_data->>'full_name', email) 
    INTO v_user_email, v_user_name
    FROM auth.users 
    WHERE id = v_user_id;

    -- Create user settings if not exists
    INSERT INTO public.user_settings (user_id) 
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create client record if not exists
    INSERT INTO public.clientes (user_id, nome, email) 
    VALUES (v_user_id, v_user_name, v_user_email)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create user limits if not exists - changed max_assistentes to 0 for free plan
    INSERT INTO public.usuario_limites (user_id, max_assistentes, max_instancias_whatsapp, max_conversas_mes, max_agendamentos_mes) 
    VALUES (v_user_id, 0, 1, 100, 50)
    ON CONFLICT (user_id) DO NOTHING;
END;
$function$;