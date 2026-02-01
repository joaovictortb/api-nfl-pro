import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export function requireSupabase(): NonNullable<typeof supabase> {
  if (!supabase) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados"
    );
  }
  return supabase;
}
