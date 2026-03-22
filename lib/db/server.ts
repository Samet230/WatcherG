import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL tanimli degil");
    }
    return supabaseUrl;
}

function getSupabaseAnonKey(): string {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY tanimli degil");
    }
    return anonKey;
}

export function createAuthenticatedServerClient(authHeader: string) {
    return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        global: {
            headers: {
                Authorization: authHeader,
            },
        },
    });
}

export function createServiceServerClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY tanimli degil");
    }

    return createClient(getSupabaseUrl(), serviceRoleKey);
}

export async function getAuthenticatedUser(authHeader: string) {
    const supabase = createAuthenticatedServerClient(authHeader);
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    return { supabase, user, error };
}
