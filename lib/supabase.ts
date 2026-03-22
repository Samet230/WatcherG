// WatcherG — Supabase istemci bağlantısı
// Tüm Supabase erişimi bu dosya üzerinden yapılır

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL ve Anon Key .env.local dosyasında tanımlı olmalı");
}

// İstemci tarafında kullanılan Supabase bağlantısı
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
