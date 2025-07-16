import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      desks: {
        Row: {
          id: string;
          name: string;
          description: string;
          location: string;
          is_available: boolean;
          created_at: string;
          assigned_to_user_id?: string;
          assignment_note?: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          location: string;
          is_available?: boolean;
          created_at?: string;
          assigned_to_user_id?: string;
          assignment_note?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          location?: string;
          is_available?: boolean;
          created_at?: string;
          assigned_to_user_id?: string;
          assignment_note?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          desk_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          status: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          desk_id: string;
          booking_date: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          desk_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
