"use server";

import { supabaseAdmin } from "@/lib/supabase";

const MAX_BYTES = 8 * 1024 * 1024;

export type SaveResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveLevel(formData: FormData): Promise<SaveResult> {
  const admin = supabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      error: "Supabase is not connected yet. Accept the marketplace terms, then retry.",
    };
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: "Choose a picture first." };
  }
  if (image.size > MAX_BYTES) {
    return { ok: false, error: "Use a picture smaller than 8 MB." };
  }
  if (!image.type.startsWith("image/")) {
    return { ok: false, error: "That file is not an image." };
  }

  const gridLeft = Number(formData.get("gridLeft"));
  const gridTop = Number(formData.get("gridTop"));
  const gridSize = Number(formData.get("gridSize"));
  if (
    ![gridLeft, gridTop, gridSize].every((value) => Number.isFinite(value)) ||
    gridSize < 0.08 ||
    gridSize > 1 ||
    gridLeft < 0 ||
    gridTop < 0 ||
    gridLeft + gridSize > 1.001
  ) {
    return { ok: false, error: "Place the grid fully on the picture." };
  }

  let winningSquares: number[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("winningSquares") ?? "[]"));
    if (!Array.isArray(parsed)) {
      throw new Error("squares");
    }
    winningSquares = [...new Set(parsed.map(Number))]
      .filter((square) => Number.isInteger(square) && square >= 1 && square <= 100)
      .sort((a, b) => a - b);
  } catch {
    return { ok: false, error: "Pick the winning squares again." };
  }
  if (winningSquares.length === 0) {
    return { ok: false, error: "Select at least one winning square." };
  }

  const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await image.arrayBuffer());
  const uploaded = await admin.storage.from("level-images").upload(path, bytes, {
    contentType: image.type,
    upsert: false,
  });
  if (uploaded.error) {
    return { ok: false, error: uploaded.error.message };
  }

  const { data: publicUrl } = admin.storage.from("level-images").getPublicUrl(path);
  const inserted = await admin.from("levels").insert({
    image_url: publicUrl.publicUrl,
    grid_left: gridLeft,
    grid_top: gridTop,
    grid_size: gridSize,
    winning_squares: winningSquares,
  });
  if (inserted.error) {
    return { ok: false, error: inserted.error.message };
  }

  return { ok: true };
}
