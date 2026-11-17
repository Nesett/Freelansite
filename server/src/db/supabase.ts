import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// public bucket for logos
export const LOGO_BUCKET = process.env.SUPABASE_LOGO_BUCKET || "brand-logos"

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
    if (!client) {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !key) {
            throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to upload logos.")
        }

        client = createClient(url, key, { auth: { persistSession: false } })
    }

    return client
}
