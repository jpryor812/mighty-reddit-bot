import { insertPost } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface IncomingPost {
  reddit_id: string;
  subreddit: string;
  title: string;
  body: string;
  url: string;
  reddit_score: number;
  created_utc: number;
}

const RELEVANCE_KEYWORDS = [
  "settlement",
  "offer",
  "should I hire",
  "do I need a lawyer",
  "insurance claim",
  "injury",
  "accident",
  "negotiate",
  "is this fair",
  "attorney",
  "PI claim",
  "personal injury",
];

function isRelevant(title: string, body: string): boolean {
  const text = `${title} ${body}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

export async function POST(request: Request) {
  let posts: IncomingPost[];

  try {
    posts = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const post of posts) {
    if (!isRelevant(post.title, post.body)) {
      skipped++;
      continue;
    }

    try {
      await insertPost(post);
      inserted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`insert ${post.reddit_id}: ${msg}`);
      skipped++;
    }
  }

  return Response.json({ inserted, skipped, errors });
}
