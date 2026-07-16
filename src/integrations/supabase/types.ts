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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          reason: string | null
          requested_role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          reason?: string | null
          requested_role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          reason?: string | null
          requested_role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agri_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          created_at: string
          field_id: string
          id: string
          message: string
          severity: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          created_at?: string
          field_id: string
          id?: string
          message: string
          severity?: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          created_at?: string
          field_id?: string
          id?: string
          message?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "agri_alerts_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_type: string
          config: Json
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          run_count: number
          tech_project_id: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          run_count?: number
          tech_project_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          run_count?: number
          tech_project_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_tech_project_id_fkey"
            columns: ["tech_project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount_kobo: number
          created_at: string
          created_by: string
          currency: string
          description: string
          division: string | null
          id: string
          paid_at: string | null
          related_id: string | null
          related_table: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          created_by: string
          currency?: string
          description: string
          division?: string | null
          id?: string
          paid_at?: string | null
          related_id?: string | null
          related_table?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          division?: string | null
          id?: string
          paid_at?: string | null
          related_id?: string | null
          related_table?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          division: string | null
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          division?: string | null
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          company?: string | null
          created_at?: string
          division?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          notes: string | null
        }
        Insert: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          notes?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          rows_count: number
          size_mb: number
          source_division: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          rows_count?: number
          size_mb?: number
          source_division?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          rows_count?: number
          size_mb?: number
          source_division?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      demo_day_slots: {
        Row: {
          created_at: string
          demo_day_id: string
          id: string
          prototype_id: string
          slot_time: string | null
        }
        Insert: {
          created_at?: string
          demo_day_id: string
          id?: string
          prototype_id: string
          slot_time?: string | null
        }
        Update: {
          created_at?: string
          demo_day_id?: string
          id?: string
          prototype_id?: string
          slot_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_day_slots_demo_day_id_fkey"
            columns: ["demo_day_id"]
            isOneToOne: false
            referencedRelation: "demo_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_day_slots_prototype_id_fkey"
            columns: ["prototype_id"]
            isOneToOne: false
            referencedRelation: "prototypes"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_days: {
        Row: {
          created_at: string
          event_date: string
          id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          event_date: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          event_date?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          created_at: string
          deployed_by: string | null
          environment: string
          id: string
          notes: string | null
          status: string
          tech_project_id: string
          version: string
        }
        Insert: {
          created_at?: string
          deployed_by?: string | null
          environment?: string
          id?: string
          notes?: string | null
          status?: string
          tech_project_id: string
          version: string
        }
        Update: {
          created_at?: string
          deployed_by?: string | null
          environment?: string
          id?: string
          notes?: string | null
          status?: string
          tech_project_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_tech_project_id_fkey"
            columns: ["tech_project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          accent: string
          created_at: string
          name: string
          slug: string
          sort_order: number
          tagline: string | null
        }
        Insert: {
          accent?: string
          created_at?: string
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          accent?: string
          created_at?: string
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      document_library: {
        Row: {
          created_at: string
          description: string | null
          division: string | null
          file_path: string
          file_type: string | null
          id: string
          owner_id: string
          size_bytes: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          division?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          owner_id: string
          size_bytes?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          division?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          owner_id?: string
          size_bytes?: number | null
          title?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          division: string | null
          file_path: string
          id: string
          mime_type: string | null
          name: string
          project_id: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          division?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          name: string
          project_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          division?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          deliveries_completed: number
          full_name: string
          id: string
          license_expiry: string | null
          license_no: string | null
          phone: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          deliveries_completed?: number
          full_name: string
          id?: string
          license_expiry?: string | null
          license_no?: string | null
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          deliveries_completed?: number
          full_name?: string
          id?: string
          license_expiry?: string | null
          license_no?: string | null
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          confidence: number
          created_at: string
          hypothesis: string | null
          id: string
          idea_id: string | null
          owner_id: string | null
          result: string | null
          source_division: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          hypothesis?: string | null
          id?: string
          idea_id?: string | null
          owner_id?: string | null
          result?: string | null
          source_division?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          hypothesis?: string | null
          id?: string
          idea_id?: string | null
          owner_id?: string | null
          result?: string | null
          source_division?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          cooperative: string | null
          created_at: string
          full_name: string
          hectares: number
          id: string
          location: string | null
          org_id: string | null
          owner_id: string | null
          phone: string | null
          primary_crop: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cooperative?: string | null
          created_at?: string
          full_name: string
          hectares?: number
          id?: string
          location?: string | null
          org_id?: string | null
          owner_id?: string | null
          phone?: string | null
          primary_crop?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cooperative?: string | null
          created_at?: string
          full_name?: string
          hectares?: number
          id?: string
          location?: string | null
          org_id?: string | null
          owner_id?: string | null
          phone?: string | null
          primary_crop?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      field_images: {
        Row: {
          caption: string | null
          created_at: string
          field_id: string
          id: string
          source: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          field_id: string
          id?: string
          source?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          field_id?: string
          id?: string
          source?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_images_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string
          crop: string | null
          farmer_id: string
          health: number
          hectares: number
          id: string
          lat: number | null
          lng: number | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop?: string | null
          farmer_id: string
          health?: number
          hectares?: number
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop?: string | null
          farmer_id?: string
          health?: number
          hectares?: number
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          submitted_by: string | null
          tags: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          submitted_by?: string | null
          tags?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          submitted_by?: string | null
          tags?: Json | null
          title?: string
        }
        Relationships: []
      }
      innovation_submissions: {
        Row: {
          category: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          idea_description: string
          idea_title: string
          phone: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          idea_description: string
          idea_title: string
          phone?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          idea_description?: string
          idea_title?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          created_at: string
          id: string
          last_sync: string | null
          name: string
          org_id: string | null
          provider: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync?: string | null
          name: string
          org_id?: string | null
          provider?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync?: string | null
          name?: string
          org_id?: string | null
          provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          amount_invested: number
          created_at: string
          email: string | null
          expected_roi: number
          full_name: string
          id: string
          phone: string | null
          portfolio_value: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_invested?: number
          created_at?: string
          email?: string | null
          expected_roi?: number
          full_name: string
          id?: string
          phone?: string | null
          portfolio_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_invested?: number
          created_at?: string
          email?: string | null
          expected_roi?: number
          full_name?: string
          id?: string
          phone?: string | null
          portfolio_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget_max: number | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          next_follow_up_date: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          property_id: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          next_follow_up_date?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          property_id?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          next_follow_up_date?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          property_id?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          division: string
          id: string
          sender_id: string
          thread_key: string
        }
        Insert: {
          body: string
          created_at?: string
          division: string
          id?: string
          sender_id: string
          thread_key?: string
        }
        Update: {
          body?: string
          created_at?: string
          division?: string
          id?: string
          sender_id?: string
          thread_key?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          accuracy: number
          created_at: string
          dataset_id: string | null
          id: string
          model_type: string
          name: string
          owner_id: string | null
          status: string
          target_division: string
          updated_at: string
          version: string
        }
        Insert: {
          accuracy?: number
          created_at?: string
          dataset_id?: string | null
          id?: string
          model_type?: string
          name: string
          owner_id?: string | null
          status?: string
          target_division?: string
          updated_at?: string
          version?: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          dataset_id?: string | null
          id?: string
          model_type?: string
          name?: string
          owner_id?: string | null
          status?: string
          target_division?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_checklist_items: {
        Row: {
          created_at: string
          done: boolean
          id: string
          idea_id: string
          task: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          idea_id: string
          task: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          idea_id?: string
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_checklist_items_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          division: string | null
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          division?: string | null
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          division?: string | null
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          contact: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      portal_audit_log: {
        Row: {
          created_at: string
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          model_id: string | null
          owner_id: string | null
          prompt: string
          result: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          model_id?: string | null
          owner_id?: string | null
          prompt: string
          result?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          model_id?: string | null
          owner_id?: string | null
          prompt?: string
          result?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          issued_at: string
          milestone: string
          paid_at: string | null
          status: string
          tech_project_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          issued_at?: string
          milestone: string
          paid_at?: string | null
          status?: string
          tech_project_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          issued_at?: string
          milestone?: string
          paid_at?: string | null
          status?: string
          tech_project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_tech_project_id_fkey"
            columns: ["tech_project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          org_id: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          org_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          org_id?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json
          area_sqm: number
          bathrooms: number
          bedrooms: number
          city: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          land_title_type: string | null
          listing_type: string
          org_id: string | null
          owner_id: string | null
          price: number
          property_type: string
          state: string | null
          status: string
          title: string
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address?: string | null
          amenities?: Json
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          city?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          land_title_type?: string | null
          listing_type?: string
          org_id?: string | null
          owner_id?: string | null
          price?: number
          property_type?: string
          state?: string | null
          status?: string
          title: string
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string | null
          amenities?: Json
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          city?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          land_title_type?: string | null
          listing_type?: string
          org_id?: string | null
          owner_id?: string | null
          price?: number
          property_type?: string
          state?: string | null
          status?: string
          title?: string
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_render: boolean
          position: number
          property_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_render?: boolean
          position?: number
          property_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_render?: boolean
          position?: number
          property_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_units: {
        Row: {
          area_sqm: number
          bathrooms: number
          bedrooms: number
          created_at: string
          floor: number | null
          id: string
          property_id: string
          rent_amount: number
          status: string
          tenant_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          floor?: number | null
          id?: string
          property_id: string
          rent_amount?: number
          status?: string
          tenant_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          floor?: number | null
          id?: string
          property_id?: string
          rent_amount?: number
          status?: string
          tenant_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prototypes: {
        Row: {
          created_at: string | null
          demo_link: string | null
          id: string
          idea_id: string | null
          repo_link: string | null
          screenshots: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          demo_link?: string | null
          id?: string
          idea_id?: string | null
          repo_link?: string | null
          screenshots?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          demo_link?: string | null
          id?: string
          idea_id?: string | null
          repo_link?: string | null
          screenshots?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prototypes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          address: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          route_id: string
          sequence: number
          shipment_id: string | null
        }
        Insert: {
          address: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          route_id: string
          sequence?: number
          shipment_id?: string | null
        }
        Update: {
          address?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          route_id?: string
          sequence?: number
          shipment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          assigned_driver_id: string | null
          created_at: string
          destination: string
          distance_km: number
          est_hours: number
          id: string
          name: string
          origin: string
          status: string
          stops: number
          updated_at: string
          waypoints: Json
        }
        Insert: {
          assigned_driver_id?: string | null
          created_at?: string
          destination: string
          distance_km?: number
          est_hours?: number
          id?: string
          name: string
          origin: string
          status?: string
          stops?: number
          updated_at?: string
          waypoints?: Json
        }
        Update: {
          assigned_driver_id?: string | null
          created_at?: string
          destination?: string
          distance_km?: number
          est_hours?: number
          id?: string
          name?: string
          origin?: string
          status?: string
          stops?: number
          updated_at?: string
          waypoints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "routes_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_data: {
        Row: {
          field_id: string
          humidity: number | null
          id: string
          recorded_at: string
          soil_moisture: number | null
          temperature: number | null
        }
        Insert: {
          field_id: string
          humidity?: number | null
          id?: string
          recorded_at?: string
          soil_moisture?: number | null
          temperature?: number | null
        }
        Update: {
          field_id?: string
          humidity?: number | null
          id?: string
          recorded_at?: string
          soil_moisture?: number | null
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_data_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          shipment_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          shipment_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cargo: string | null
          created_at: string
          customer: string
          delivered_at: string | null
          driver_id: string | null
          dropoff_city: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          eta: string | null
          id: string
          owner_id: string | null
          pickup_city: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pod_notes: string | null
          pod_photo_url: string | null
          pod_signature_name: string | null
          priority: string
          reference: string
          route_id: string | null
          status: string
          tracking_code: string | null
          updated_at: string
          weight_kg: number
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          customer: string
          delivered_at?: string | null
          driver_id?: string | null
          dropoff_city?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          eta?: string | null
          id?: string
          owner_id?: string | null
          pickup_city?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pod_notes?: string | null
          pod_photo_url?: string | null
          pod_signature_name?: string | null
          priority?: string
          reference: string
          route_id?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          cargo?: string | null
          created_at?: string
          customer?: string
          delivered_at?: string | null
          driver_id?: string | null
          dropoff_city?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          eta?: string | null
          id?: string
          owner_id?: string | null
          pickup_city?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pod_notes?: string | null
          pod_photo_url?: string | null
          pod_signature_name?: string | null
          priority?: string
          reference?: string
          route_id?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      status_components: {
        Row: {
          description: string | null
          id: string
          name: string
          position: number
          status: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          position?: number
          status?: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          position?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      status_incidents: {
        Row: {
          body: string | null
          component_id: string | null
          created_at: string
          id: string
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          body?: string | null
          component_id?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          body?: string | null
          component_id?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_incidents_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "status_components"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_project_documents: {
        Row: {
          created_at: string
          file_path: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          tech_project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          tech_project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          tech_project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_project_documents_tech_project_id_fkey"
            columns: ["tech_project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_projects: {
        Row: {
          budget: number | null
          client_email: string | null
          client_name: string | null
          created_at: string
          due_date: string | null
          id: string
          metadata: Json
          org_id: string | null
          owner_id: string | null
          progress: number
          sla_hours: number | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          metadata?: Json
          org_id?: string | null
          owner_id?: string | null
          progress?: number
          sla_hours?: number | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          metadata?: Json
          org_id?: string | null
          owner_id?: string | null
          progress?: number
          sla_hours?: number | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_tasks: {
        Row: {
          assignee_email: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          tech_project_id: string
          title: string
        }
        Insert: {
          assignee_email?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          tech_project_id: string
          title: string
        }
        Update: {
          assignee_email?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          tech_project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_tasks_tech_project_id_fkey"
            columns: ["tech_project_id"]
            isOneToOne: false
            referencedRelation: "tech_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          lease_document_path: string | null
          lease_end: string | null
          lease_sent_at: string | null
          lease_signature_status: string
          lease_signed_at: string | null
          lease_signed_name: string | null
          lease_start: string | null
          payment_status: string
          phone: string | null
          property_id: string | null
          rent_amount: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          lease_document_path?: string | null
          lease_end?: string | null
          lease_sent_at?: string | null
          lease_signature_status?: string
          lease_signed_at?: string | null
          lease_signed_name?: string | null
          lease_start?: string | null
          payment_status?: string
          phone?: string | null
          property_id?: string | null
          rent_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          lease_document_path?: string | null
          lease_end?: string | null
          lease_sent_at?: string | null
          lease_signature_status?: string
          lease_signed_at?: string | null
          lease_signed_name?: string | null
          lease_start?: string | null
          payment_status?: string
          phone?: string | null
          property_id?: string | null
          rent_amount?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "property_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_divisions: {
        Row: {
          created_at: string
          division_slug: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          division_slug: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          division_slug?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_divisions_division_slug_fkey"
            columns: ["division_slug"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["slug"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          division_selection_completed: boolean | null
          notifications_enabled: boolean | null
          primary_division: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          division_selection_completed?: boolean | null
          notifications_enabled?: boolean | null
          primary_division?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          division_selection_completed?: boolean | null
          notifications_enabled?: boolean | null
          primary_division?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string
          created_by: string | null
          id: string
          next_due: string | null
          notes: string | null
          performed_at: string
          service_type: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_due?: string | null
          notes?: string | null
          performed_at?: string
          service_type: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_due?: string | null
          notes?: string | null
          performed_at?: string
          service_type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity_kg: number
          created_at: string
          fuel_level: number
          id: string
          insurance_expiry: string | null
          last_service: string | null
          next_service_due: string | null
          odometer_km: number
          plate: string
          status: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          capacity_kg?: number
          created_at?: string
          fuel_level?: number
          id?: string
          insurance_expiry?: string | null
          last_service?: string | null
          next_service_due?: string | null
          odometer_km?: number
          plate: string
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          capacity_kg?: number
          created_at?: string
          fuel_level?: number
          id?: string
          insurance_expiry?: string | null
          last_service?: string | null
          next_service_due?: string | null
          odometer_km?: number
          plate?: string
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      yield_predictions: {
        Row: {
          confidence: number
          created_at: string
          field_id: string
          id: string
          predicted_yield_tons: number
          season: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          field_id: string
          id?: string
          predicted_yield_tons?: number
          season: string
        }
        Update: {
          confidence?: number
          created_at?: string
          field_id?: string
          id?: string
          predicted_yield_tons?: number
          season?: string
        }
        Relationships: [
          {
            foreignKeyName: "yield_predictions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_shipment: {
        Args: { p_tracking_code: string }
        Returns: {
          delivered_at: string
          dropoff_city: string
          eta: string
          pickup_city: string
          pod_photo_url: string
          priority: string
          reference: string
          status: string
        }[]
      }
      track_shipment_events: {
        Args: { p_tracking_code: string }
        Returns: {
          created_at: string
          note: string
          status: string
        }[]
      }
      user_org: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "staff" | "client" | "investor" | "farmer" | "driver"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      project_type: "tech" | "real_estate" | "logistics" | "agritech" | "other"
      task_status: "todo" | "in_progress" | "done"
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
    Enums: {
      app_role: ["admin", "staff", "client", "investor", "farmer", "driver"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      project_type: ["tech", "real_estate", "logistics", "agritech", "other"],
      task_status: ["todo", "in_progress", "done"],
    },
  },
} as const
