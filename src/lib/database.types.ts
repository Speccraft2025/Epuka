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
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["audit_entity"]
          id: string
          new_value: Json | null
          previous_value: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["audit_entity"]
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["audit_entity"]
          id?: string
          new_value?: Json | null
          previous_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          collection_method: Database["public"]["Enums"]["collection_method"]
          created_at: string
          home_address: string | null
          id: string
          lab_id: string | null
          lab_name: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          price: number
          status: Database["public"]["Enums"]["booking_status"]
          test_id: string | null
          test_name: string
          transaction_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          collection_method: Database["public"]["Enums"]["collection_method"]
          created_at?: string
          home_address?: string | null
          id?: string
          lab_id?: string | null
          lab_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price: number
          status?: Database["public"]["Enums"]["booking_status"]
          test_id?: string | null
          test_name: string
          transaction_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          collection_method?: Database["public"]["Enums"]["collection_method"]
          created_at?: string
          home_address?: string | null
          id?: string
          lab_id?: string | null
          lab_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: number
          status?: Database["public"]["Enums"]["booking_status"]
          test_id?: string | null
          test_name?: string
          transaction_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          active: boolean
          address: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          neighborhood: string
        }
        Insert: {
          active?: boolean
          address: string
          created_at?: string
          id: string
          lat: number
          lng: number
          name: string
          neighborhood: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          neighborhood?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          alcohol: boolean | null
          created_at: string
          display_name: string | null
          email: string
          exercise: string | null
          gender: string | null
          height_cm: number | null
          id: string
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          smoker: boolean | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          alcohol?: boolean | null
          created_at?: string
          display_name?: string | null
          email: string
          exercise?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          smoker?: boolean | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          alcohol?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string
          exercise?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          smoker?: boolean | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          created_at: string
          doctor_notes: string | null
          flag: Database["public"]["Enums"]["medical_flag"]
          follow_up_action: string | null
          id: string
          medical_approval_status: Database["public"]["Enums"]["approval_status"]
          raw_results: Json
          status: Database["public"]["Enums"]["result_review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          created_at?: string
          doctor_notes?: string | null
          flag?: Database["public"]["Enums"]["medical_flag"]
          follow_up_action?: string | null
          id?: string
          medical_approval_status?: Database["public"]["Enums"]["approval_status"]
          raw_results?: Json
          status?: Database["public"]["Enums"]["result_review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          created_at?: string
          doctor_notes?: string | null
          flag?: Database["public"]["Enums"]["medical_flag"]
          follow_up_action?: string | null
          id?: string
          medical_approval_status?: Database["public"]["Enums"]["approval_status"]
          raw_results?: Json
          status?: Database["public"]["Enums"]["result_review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          active: boolean
          created_at: string
          description: string
          icon: string | null
          id: string
          included_tests: string[]
          name: string
          popular: boolean
          price: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          icon?: string | null
          id: string
          included_tests?: string[]
          name: string
          popular?: boolean
          price: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          included_tests?: string[]
          name?: string
          popular?: boolean
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      approval_status: "PENDING" | "APPROVED" | "REJECTED"
      audit_entity: "booking" | "result" | "user" | "payment"
      booking_status:
        | "BOOKED"
        | "PAYMENT_PENDING"
        | "PAYMENT_CONFIRMED"
        | "ASSIGNED_TO_LAB"
        | "SAMPLE_COLLECTED"
        | "IN_ANALYSIS"
        | "VERIFIED"
        | "DELIVERED"
        | "CLOSED"
      collection_method: "lab" | "home"
      medical_flag: "NORMAL" | "ATTENTION" | "URGENT"
      metric_status: "normal" | "attention" | "critical"
      payment_status: "unpaid" | "paid"
      result_review_status: "pending" | "reviewed"
      user_role: "SUPER_ADMIN" | "MEDICAL_ADMIN" | "OPS" | "PATIENT"
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
      approval_status: ["PENDING", "APPROVED", "REJECTED"],
      audit_entity: ["booking", "result", "user", "payment"],
      booking_status: [
        "BOOKED",
        "PAYMENT_PENDING",
        "PAYMENT_CONFIRMED",
        "ASSIGNED_TO_LAB",
        "SAMPLE_COLLECTED",
        "IN_ANALYSIS",
        "VERIFIED",
        "DELIVERED",
        "CLOSED",
      ],
      collection_method: ["lab", "home"],
      medical_flag: ["NORMAL", "ATTENTION", "URGENT"],
      metric_status: ["normal", "attention", "critical"],
      payment_status: ["unpaid", "paid"],
      result_review_status: ["pending", "reviewed"],
      user_role: ["SUPER_ADMIN", "MEDICAL_ADMIN", "OPS", "PATIENT"],
    },
  },
} as const
