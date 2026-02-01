import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSupabase } from "./_supabase";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "PUT") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  try {
    const db = requireSupabase();
    const igAccountId =
      (req.method === "GET"
        ? (req.query.ig_account_id as string)
        : (req.body?.ig_account_id as string)) || "default";

    if (req.method === "GET") {
      const { data, error } = await db
        .from("automation_config")
        .select("config, updated_at")
        .eq("ig_account_id", igAccountId)
        .maybeSingle();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(200).json(data ?? { config: null, updated_at: null });
      return;
    }

    // PUT
    const config = req.body?.config;
    if (config === undefined) {
      res.status(400).json({ error: "Body deve conter 'config'" });
      return;
    }

    const { data, error } = await db
      .from("automation_config")
      .upsert(
        {
          ig_account_id: igAccountId,
          config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "ig_account_id" }
      )
      .select("config, updated_at")
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: message });
  }
}
