import express from "express";
import cors from "cors";
import { supabase, requireSupabase } from "./supabase.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const router = express.Router();

// --- GET /api/health ---
router.get("/health", async (_req, res) => {
  try {
    if (!supabase) {
      res.status(503).json({
        ok: false,
        error:
          "Supabase não configurado (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)",
      });
      return;
    }
    const { error } = await supabase
      .from("automation_config")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (error) {
      if (error.code === "42P01") {
        res.status(200).json({
          ok: true,
          message:
            "Conectado ao Supabase. Execute a migration 001_automation_tables.sql para criar as tabelas.",
        });
        return;
      }
      res.status(500).json({ ok: false, error: error.message });
      return;
    }
    res.status(200).json({
      ok: true,
      message: "Conectado ao Supabase corretamente.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao testar conexão";
    res.status(500).json({ ok: false, error: msg });
  }
});

// --- GET/PUT /api/automation-config ---
router
  .route("/automation-config")
  .get(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.query.ig_account_id as string) || "default";
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .put(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.body?.ig_account_id as string) || "default";
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
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .all((_req, res) => res.status(405).json({ error: "Método não permitido" }));

// --- GET/POST /api/posts-history ---
router
  .route("/posts-history")
  .get(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.query.ig_account_id as string) || "default";
      const limit = Math.min(
        parseInt(String(req.query.limit), 10) || 100,
        500
      );
      const { data, error } = await db
        .from("posts_history")
        .select("*")
        .eq("ig_account_id", igAccountId)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(200).json(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .post(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.body?.ig_account_id as string) || "default";
      const body = req.body as {
        media_id?: string;
        original_headline: string;
        title_pt: string;
        summary_pt: string;
        instagram_caption: string;
        image_url: string;
        article_url?: string;
        post_type?: "image" | "carousel" | "reel" | "story";
      };
      if (
        !body?.original_headline ||
        !body?.title_pt ||
        !body?.summary_pt ||
        !body?.instagram_caption ||
        !body?.image_url
      ) {
        res.status(400).json({
          error:
            "Body deve conter original_headline, title_pt, summary_pt, instagram_caption, image_url",
        });
        return;
      }
      const postType =
        body.post_type && ["image", "carousel", "reel", "story"].includes(body.post_type)
          ? body.post_type
          : "image";
      const { data, error } = await db
        .from("posts_history")
        .insert({
          ig_account_id: igAccountId,
          media_id: body.media_id ?? null,
          original_headline: body.original_headline,
          title_pt: body.title_pt,
          summary_pt: body.summary_pt,
          instagram_caption: body.instagram_caption,
          image_url: body.image_url,
          article_url: body.article_url ?? null,
          post_type: postType,
        })
        .select()
        .single();
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(201).json(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .all((_req, res) => res.status(405).json({ error: "Método não permitido" }));

// --- GET/POST /api/automation-logs ---
router
  .route("/automation-logs")
  .get(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.query.ig_account_id as string) || "default";
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .post(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.body?.ig_account_id as string) || "default";
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
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .all((_req, res) => res.status(405).json({ error: "Método não permitido" }));

// --- GET/PUT /api/settings (todos os dados do localStorage: tokens, Cloudinary, Meta, Replicate, monitor) ---
router
  .route("/settings")
  .get(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.query.ig_account_id as string) || "default";
      const { data, error } = await db
        .from("app_settings")
        .select("settings, updated_at")
        .eq("ig_account_id", igAccountId)
        .maybeSingle();
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(200).json(data ?? { settings: {}, updated_at: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .put(async (req, res) => {
    try {
      const db = requireSupabase();
      const igAccountId = (req.body?.ig_account_id as string) || "default";
      const settings = req.body?.settings;
      if (settings === undefined) {
        res.status(400).json({ error: "Body deve conter 'settings'" });
        return;
      }
      const { data, error } = await db
        .from("app_settings")
        .upsert(
          {
            ig_account_id: igAccountId,
            settings: typeof settings === "object" ? settings : {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ig_account_id" }
        )
        .select("settings, updated_at")
        .single();
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(200).json(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  })
  .all((_req, res) => res.status(405).json({ error: "Método não permitido" }));

app.use("/api", router);

// Raiz
app.get("/", (_req, res) => {
  res.json({
    name: "nfl-pro-instagram-api",
    version: "1.0.0",
    endpoints: [
      "GET /api/health",
      "GET|PUT /api/automation-config",
      "GET|PUT /api/settings",
      "GET|POST /api/posts-history",
      "GET|POST /api/automation-logs",
    ],
  });
});

export default app;
