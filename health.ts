import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./_supabase";

/**
 * GET /api/health - Testa se a API está conectada ao Supabase.
 * Retorna { ok: true } ou { ok: false, error: "mensagem" }.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  try {
    if (!supabase) {
      res.status(503).json({
        ok: false,
        error: "Supabase não configurado (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)",
      });
      return;
    }

    // Query mínima para validar conexão (não altera dados)
    const { error } = await supabase
      .from("automation_config")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error) {
      // Tabela pode não existir ainda; mesmo assim confirmamos que a conexão funciona
      if (error.code === "42P01") {
        // undefined_table
        res.status(200).json({
          ok: true,
          message: "Conectado ao Supabase. Execute a migration 001_automation_tables.sql para criar as tabelas.",
        });
        return;
      }
      res.status(500).json({
        ok: false,
        error: error.message,
      });
      return;
    }

    res.status(200).json({ ok: true, message: "Conectado ao Supabase corretamente." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao testar conexão";
    res.status(500).json({ ok: false, error: message });
  }
}
