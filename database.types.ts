export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string
          development: Json
          id: string
          materials: Json
          name: string
          objective: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          development: Json
          id?: string
          materials?: Json
          name: string
          objective: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          development?: Json
          id?: string
          materials?: Json
          name?: string
          objective?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_barriers: {
        Row: {
          activity_id: string
          barrier_id: string
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          activity_id: string
          barrier_id: string
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          activity_id?: string
          barrier_id?: string
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_barriers_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_barriers_barrier_id_fkey"
            columns: ["barrier_id"]
            isOneToOne: false
            referencedRelation: "barriers"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_learning_styles: {
        Row: {
          activity_id: string
          created_at: string | null
          created_by: string | null
          learning_style_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          created_by?: string | null
          learning_style_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          created_by?: string | null
          learning_style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_learning_styles_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_learning_styles_learning_style_id_fkey"
            columns: ["learning_style_id"]
            isOneToOne: false
            referencedRelation: "learning_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      barriers: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      intervention_barriers: {
        Row: {
          barrier_id: string
          intervention_id: string
        }
        Insert: {
          barrier_id: string
          intervention_id: string
        }
        Update: {
          barrier_id?: string
          intervention_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_barriers_barrier_id_fkey"
            columns: ["barrier_id"]
            isOneToOne: false
            referencedRelation: "barriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_barriers_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          intervention_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          intervention_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          intervention_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_comments_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_learning_styles: {
        Row: {
          intervention_id: string
          learning_style_id: string
        }
        Insert: {
          intervention_id: string
          learning_style_id: string
        }
        Update: {
          intervention_id?: string
          learning_style_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_learning_styles_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_learning_styles_learning_style_id_fkey"
            columns: ["learning_style_id"]
            isOneToOne: false
            referencedRelation: "learning_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          activity_id: string
          created_at: string
          date: string
          id: string
          observations: string | null
          student_id: string
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          date?: string
          id?: string
          observations?: string | null
          student_id: string
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          date?: string
          id?: string
          observations?: string | null
          student_id?: string
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_styles: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          lastname: string | null
          name: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          lastname?: string | null
          name?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lastname?: string | null
          name?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          created_by: string
          grade: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          grade: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          grade?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_subjects: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const 