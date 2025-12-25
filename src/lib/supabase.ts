import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export interface DbContact {
  id: string;
  user_id: string;
  meno: string;
  priezvisko: string;
  telefon: string;
  email: string;
  ulica: string;
  mesto: string;
  psc: string;
  ico: string;
  ic_dph: string;
  dic: string;
  kontaktna_priezvisko: string;
  kontaktna_meno: string;
  kontaktna_telefon: string;
  kontaktna_email: string;
  popis: string;
  typ: 'zakaznik' | 'architekt' | 'fakturacna_firma';
  project_ids: string[];
  original_contact_id: string | null;
  date_added: string;
  updated_at: string;
}

export interface DbSpisEntry {
  id: string;
  user_id: string;
  stav: string;
  cislo_cp: string;
  cislo_zakazky: string;
  datum: string;
  kontaktna_osoba: string;
  architekt: string;
  realizator: string;
  popis: string;
  firma: string;
  spracovatel: string;
  kategoria: string;
  termin_dodania: string;
  color: string;
  full_form_data: any;
  created_at: string;
  updated_at: string;
}

export interface DbUserPreferences {
  id: string;
  user_id: string;
  phone: string;
  language: string;
  theme: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

export interface DbFirmaOption {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DbEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'offline';
  last_online: string | null;
  orders_created: number;
  projects_completed: number;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface DbPhoto {
  id: string;
  user_id: string;
  spis_entry_id: string | null;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  description: string;
  created_at: string;
  updated_at: string;
}
