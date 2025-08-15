export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          agent_id: string | null
          appointment_date: string
          appointment_type: string | null
          conversation_id: string | null
          created_at: string | null
          duration_minutes: number | null
          google_event_id: string | null
          id: string
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          appointment_date: string
          appointment_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          appointment_date?: string
          appointment_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_professional_profile"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          asaas_subscription_id: string | null
          cliente_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          id: string
          plano_id: string
          proxima_cobranca: string | null
          status: string
          ultimo_reset_uso: string | null
          updated_at: string | null
          uso_agendamentos_mes: number | null
          uso_assistentes: number | null
          uso_conversas_mes: number | null
          uso_instancias: number | null
        }
        Insert: {
          asaas_subscription_id?: string | null
          cliente_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          id?: string
          plano_id: string
          proxima_cobranca?: string | null
          status?: string
          ultimo_reset_uso?: string | null
          updated_at?: string | null
          uso_agendamentos_mes?: number | null
          uso_assistentes?: number | null
          uso_conversas_mes?: number | null
          uso_instancias?: number | null
        }
        Update: {
          asaas_subscription_id?: string | null
          cliente_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id?: string
          plano_id?: string
          proxima_cobranca?: string | null
          status?: string
          ultimo_reset_uso?: string | null
          updated_at?: string | null
          uso_agendamentos_mes?: number | null
          uso_assistentes?: number | null
          uso_conversas_mes?: number | null
          uso_instancias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          asaas_customer_id: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cobrancas: {
        Row: {
          asaas_payment_id: string | null
          assinatura_id: string | null
          cliente_id: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          id: string
          link_pagamento: string | null
          status: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          asaas_payment_id?: string | null
          assinatura_id?: string | null
          cliente_id: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          link_pagamento?: string | null
          status?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          asaas_payment_id?: string | null
          assinatura_id?: string | null
          cliente_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          link_pagamento?: string | null
          status?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cobrancas_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobrancas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          summary_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          summary_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          summary_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string | null
          id: string
          instance_id: string | null
          last_message_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      google_credentials: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          name: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          name?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          name?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_profile_links: {
        Row: {
          created_at: string | null
          google_credential_id: string
          id: string
          professional_profile_id: string
        }
        Insert: {
          created_at?: string | null
          google_credential_id: string
          id?: string
          professional_profile_id: string
        }
        Update: {
          created_at?: string | null
          google_credential_id?: string
          id?: string
          professional_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_profile_links_google_credential_id_fkey"
            columns: ["google_credential_id"]
            isOneToOne: false
            referencedRelation: "google_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_profile_links_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_uso: {
        Row: {
          assinatura_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          recurso_id: string | null
          tipo_uso: string
          user_id: string
        }
        Insert: {
          assinatura_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recurso_id?: string | null
          tipo_uso: string
          user_id: string
        }
        Update: {
          assinatura_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recurso_id?: string | null
          tipo_uso?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_uso_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_active: boolean | null
          max_agendamentos_mes: number | null
          max_assistentes: number | null
          max_conversas_mes: number | null
          max_instancias_whatsapp: number | null
          nome: string
          periodo: string
          preco: number
          recursos: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          max_agendamentos_mes?: number | null
          max_assistentes?: number | null
          max_conversas_mes?: number | null
          max_instancias_whatsapp?: number | null
          nome: string
          periodo?: string
          preco: number
          recursos?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          max_agendamentos_mes?: number | null
          max_assistentes?: number | null
          max_conversas_mes?: number | null
          max_instancias_whatsapp?: number | null
          nome?: string
          periodo?: string
          preco?: number
          recursos?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          additionalinfo: string | null
          agerequirements: string | null
          appointmentconditions: string | null
          avatar_url: string | null
          cancellationpolicy: string | null
          communicationchannels: string | null
          consultationduration: string | null
          consultationfees: string | null
          created_at: string | null
          education: string | null
          email: string | null
          fullname: string
          healthinsurance: string | null
          id: string
          locations: string | null
          medicalhistoryrequirements: string | null
          onlineconsultations: string | null
          paymentmethods: string | null
          phonenumber: string | null
          preappointmentinfo: string | null
          procedures: string | null
          professionalid: string | null
          reminderpreferences: string | null
          requireddocuments: string | null
          requiredpatientinfo: string | null
          reschedulingpolicy: string | null
          specialty: string
          timebetweenconsultations: string | null
          updated_at: string | null
          user_id: string
          workinghours: string | null
        }
        Insert: {
          additionalinfo?: string | null
          agerequirements?: string | null
          appointmentconditions?: string | null
          avatar_url?: string | null
          cancellationpolicy?: string | null
          communicationchannels?: string | null
          consultationduration?: string | null
          consultationfees?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          fullname: string
          healthinsurance?: string | null
          id?: string
          locations?: string | null
          medicalhistoryrequirements?: string | null
          onlineconsultations?: string | null
          paymentmethods?: string | null
          phonenumber?: string | null
          preappointmentinfo?: string | null
          procedures?: string | null
          professionalid?: string | null
          reminderpreferences?: string | null
          requireddocuments?: string | null
          requiredpatientinfo?: string | null
          reschedulingpolicy?: string | null
          specialty: string
          timebetweenconsultations?: string | null
          updated_at?: string | null
          user_id: string
          workinghours?: string | null
        }
        Update: {
          additionalinfo?: string | null
          agerequirements?: string | null
          appointmentconditions?: string | null
          avatar_url?: string | null
          cancellationpolicy?: string | null
          communicationchannels?: string | null
          consultationduration?: string | null
          consultationfees?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          fullname?: string
          healthinsurance?: string | null
          id?: string
          locations?: string | null
          medicalhistoryrequirements?: string | null
          onlineconsultations?: string | null
          paymentmethods?: string | null
          phonenumber?: string | null
          preappointmentinfo?: string | null
          procedures?: string | null
          professionalid?: string | null
          reminderpreferences?: string | null
          requireddocuments?: string | null
          requiredpatientinfo?: string | null
          reschedulingpolicy?: string | null
          specialty?: string
          timebetweenconsultations?: string | null
          updated_at?: string | null
          user_id?: string
          workinghours?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          appointment_response: string | null
          created_at: string | null
          description: string | null
          emergency_response: string | null
          escalation_criteria: string | null
          followup_response: string | null
          id: string
          instance_ids: string[] | null
          medical_advice_policy: string | null
          name: string
          personal_info_policy: string | null
          specialty: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_response?: string | null
          created_at?: string | null
          description?: string | null
          emergency_response?: string | null
          escalation_criteria?: string | null
          followup_response?: string | null
          id?: string
          instance_ids?: string[] | null
          medical_advice_policy?: string | null
          name: string
          personal_info_policy?: string | null
          specialty?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_response?: string | null
          created_at?: string | null
          description?: string | null
          emergency_response?: string | null
          escalation_criteria?: string | null
          followup_response?: string | null
          id?: string
          instance_ids?: string[] | null
          medical_advice_policy?: string | null
          name?: string
          personal_info_policy?: string | null
          specialty?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_text: string
          prompt_type: string
          questionnaire_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text: string
          prompt_type: string
          questionnaire_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text?: string
          prompt_type?: string
          questionnaire_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuario_limites: {
        Row: {
          assinatura_id: string | null
          id: string
          max_agendamentos_mes: number | null
          max_assistentes: number | null
          max_conversas_mes: number | null
          max_instancias_whatsapp: number | null
          ultimo_reset_uso: string | null
          updated_at: string | null
          user_id: string
          uso_agendamentos_mes: number | null
          uso_assistentes: number | null
          uso_conversas_mes: number | null
          uso_instancias: number | null
        }
        Insert: {
          assinatura_id?: string | null
          id?: string
          max_agendamentos_mes?: number | null
          max_assistentes?: number | null
          max_conversas_mes?: number | null
          max_instancias_whatsapp?: number | null
          ultimo_reset_uso?: string | null
          updated_at?: string | null
          user_id: string
          uso_agendamentos_mes?: number | null
          uso_assistentes?: number | null
          uso_conversas_mes?: number | null
          uso_instancias?: number | null
        }
        Update: {
          assinatura_id?: string | null
          id?: string
          max_agendamentos_mes?: number | null
          max_assistentes?: number | null
          max_conversas_mes?: number | null
          max_instancias_whatsapp?: number | null
          ultimo_reset_uso?: string | null
          updated_at?: string | null
          user_id?: string
          uso_agendamentos_mes?: number | null
          uso_assistentes?: number | null
          uso_conversas_mes?: number | null
          uso_instancias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_limites_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string | null
          display_name: string | null
          evolution_instance_id: string | null
          evolution_instance_key: string | null
          groups_ignore: boolean | null
          id: string
          instance_name: string
          integration_provider: string | null
          last_connected_at: string | null
          phone_number: string | null
          professional_profile_id: string | null
          profile_name: string | null
          profile_picture_url: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          webhook_enabled: boolean | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          evolution_instance_id?: string | null
          evolution_instance_key?: string | null
          groups_ignore?: boolean | null
          id?: string
          instance_name: string
          integration_provider?: string | null
          last_connected_at?: string | null
          phone_number?: string | null
          professional_profile_id?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          webhook_enabled?: boolean | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          evolution_instance_id?: string | null
          evolution_instance_key?: string | null
          groups_ignore?: boolean | null
          id?: string
          instance_name?: string
          integration_provider?: string | null
          last_connected_at?: string | null
          phone_number?: string | null
          professional_profile_id?: string | null
          profile_name?: string | null
          profile_picture_url?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_enabled?: boolean | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_limits: {
        Args: { p_resource_type: string; p_user_id: string }
        Returns: boolean
      }
      ensure_user_initialized: {
        Args: { p_user_id?: string }
        Returns: undefined
      }
      get_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_real_user_usage_summary: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      get_user_subscription_info: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      get_user_usage_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      increment_usage: {
        Args: { p_resource_type: string; p_user_id: string }
        Returns: undefined
      }
      initialize_user_data: {
        Args: { p_user_id?: string }
        Returns: undefined
      }
      update_user_limits_from_subscription: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
