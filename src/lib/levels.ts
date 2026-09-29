import { supabaseAnon } from "@/lib/supabase";

export type SavedLevel = {
  id: string;
  imageUrl: string;
  gridLeft: number;
  gridTop: number;
  gridSize: number;
  winningSquares: number[];
};

export async function listLevels(): Promise<SavedLevel[]> {
  const supabase = supabaseAnon();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("levels")
    .select("id, image_url, grid_left, grid_top, grid_size, winning_squares")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    imageUrl: String(row.image_url),
    gridLeft: Number(row.grid_left),
    gridTop: Number(row.grid_top),
    gridSize: Number(row.grid_size),
    winningSquares: (row.winning_squares as number[]).map(Number),
  }));
}
