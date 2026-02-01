import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireSupabase } from "./_supabase";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
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
      const limit = Math.min(
        parseInt(String(req.query.limit), 10) || 50,
        200
      );
      const { data, error } = await db
        .from("automation_logs")
        .select("id, level, source, message, created_at")
        .eq("ig_account_id", igAccountId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(200).json(data ?? []);
      return;
    }

    // POST
    const body = req.body as {
      level: "info" | "error" | "warn";
      source?: string;
      message: string;
    };
    if (!body?.message) {
      res.status(400).json({ error: "Body deve conter 'message'" });
      return;
    }
    const level =
      body.level === "info" || body.level === "error" || body.level === "warn"
        ? body.level
        : "info";

    const { data, error } = await db
      .from("automation_logs")
      .insert({
        ig_account_id: igAccountId,
        level,
        source: body.source ?? "Automation",
        message: body.message,
      })
      .select("id, created_at")
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: message });
  }
}
