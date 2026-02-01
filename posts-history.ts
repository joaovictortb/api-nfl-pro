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
      return;
    }

    // POST
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
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: message });
  }
}
