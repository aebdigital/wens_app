import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Debug logs to verify environment variables are loaded
console.log('Supabase Config Check:', {
  urlPresent: !!supabaseUrl,
  keyPresent: !!supabaseAnonKey,
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Storage key for session persistence
    storageKey: 'wens-auth-token',
  },
});

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
  last_seen: string | null;
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

export interface DbDovolenka {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
  created_by: string;
  assigned_to: string;
  due_date: string | null;
  spis_id: string | null;
  spis_cislo: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  user_id: string;
  name: string;
  kod: string | null;
  supplier: string;
  supplier_ulica: string | null;
  supplier_mesto: string | null;
  supplier_tel: string | null;
  supplier_email: string | null;
  unit: string | null;
  price: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbDocumentLock {
  id: string;
  document_id: string;
  document_type: string;
  locked_by: string;
  locked_by_name: string;
  locked_at: string;
  last_heartbeat: string;
  queue_position: number;
}
