
-- RPC: Retorna contagem de agendamentos por status (total, confirmados, remarcados, cancelados)
-- Respeita o usuário autenticado, intervalo de datas (inclusivo) e filtro opcional por profissional.
create or replace function public.get_appointment_status_counts(
  p_from date,
  p_to date,
  p_professional_id uuid default null
)
returns json
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_result json;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  /*
    Intervalo inclusivo de data:
      - appointment_date >= p_from 00:00:00
      - appointment_date < (p_to + 1 dia) 00:00:00
    Assim cobrimos o dia inteiro de p_to respeitando timestamps.
  */

  select json_build_object(
    'total', count(*)::int,
    'confirmed', count(*) filter (where ap.status = 'confirmed')::int,
    'rescheduled', count(*) filter (where ap.status = 'rescheduled')::int,
    'cancelled', count(*) filter (where ap.status = 'cancelled')::int
  )
  into v_result
  from public.appointments ap
  where ap.user_id = v_user_id
    and ap.appointment_date >= p_from::timestamptz
    and ap.appointment_date < (p_to::date + 1)::timestamptz
    and coalesce(ap.appointment_type, '') <> 'blocked'
    and (p_professional_id is null or ap.professional_profile_id = p_professional_id);

  return v_result;
end;
$function$;

-- Permissões: permitir execução pela role "authenticated".
grant execute on function public.get_appointment_status_counts(date, date, uuid) to authenticated;
