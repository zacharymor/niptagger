import { Tagger } from "@/components/tagger";
import { listLevels } from "@/lib/levels";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const levels = await listLevels();
  return <Tagger initialLevels={levels} databaseReady={Boolean(supabaseAdmin())} />;
}
