import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface N8NWebhookPayload {
  response: string; // JSON string containing events array
  count: number;
  professionalProfileId: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  organizer: string;
  attendees: any[];
  htmlLink: string;
  location?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== N8N Webhook - Eventos Google Agenda ===');
    
    const payload: N8NWebhookPayload = await req.json();
    console.log('Payload recebido:', JSON.stringify(payload, null, 2));

    // Validate payload structure
    if (!payload.response || !payload.professionalProfileId) {
      console.error('Payload inválido - campos obrigatórios ausentes');
      return new Response('Invalid payload', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Parse the JSON string from response field
    let events: GoogleCalendarEvent[];
    try {
      events = JSON.parse(payload.response);
      console.log(`Eventos parseados: ${events.length} eventos`);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return new Response('Invalid JSON in response field', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get user_id from professional profile
    const { data: profile, error: profileError } = await supabase
      .from('professional_profiles')
      .select('user_id')
      .eq('id', payload.professionalProfileId)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil profissional:', profileError);
      return new Response('Professional profile not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const userId = profile.user_id;
    console.log(`User ID encontrado: ${userId}`);

    // Process each event and create appointments
    const appointments = [];
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        // Calculate duration in minutes
        const startTime = new Date(event.start);
        const endTime = new Date(event.end);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

        // Check if appointment already exists
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('id')
          .eq('google_event_id', event.id)
          .eq('user_id', userId)
          .single();

        if (existingAppointment) {
          console.log(`Agendamento já existe para evento: ${event.id}`);
          continue;
        }

        // Create appointment data
        const appointmentData = {
          user_id: userId,
          professional_profile_id: payload.professionalProfileId,
          google_event_id: event.id,
          patient_name: event.summary || 'Evento do Google Calendar',
          patient_phone: '',
          patient_email: '',
          appointment_date: event.start,
          duration_minutes: durationMinutes,
          status: 'confirmed',
          notes: event.location || '',
          appointment_type: 'google_calendar',
          timezone: 'America/Sao_Paulo'
        };

        appointments.push(appointmentData);
        
      } catch (eventError) {
        console.error(`Erro ao processar evento ${event.id}:`, eventError);
        errorCount++;
      }
    }

    console.log(`Preparados ${appointments.length} agendamentos para inserção`);

    // Insert appointments in batches
    if (appointments.length > 0) {
      const { data: insertedAppointments, error: insertError } = await supabase
        .from('appointments')
        .insert(appointments)
        .select('id');

      if (insertError) {
        console.error('Erro ao inserir agendamentos:', insertError);
        return new Response('Error inserting appointments', { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      successCount = insertedAppointments?.length || 0;
      console.log(`${successCount} agendamentos inseridos com sucesso`);
    }

    const response = {
      success: true,
      message: 'Eventos processados com sucesso',
      summary: {
        totalEvents: events.length,
        appointmentsCreated: successCount,
        errors: errorCount,
        skipped: events.length - successCount - errorCount
      }
    };

    console.log('Resposta final:', response);

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Erro geral no webhook:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});