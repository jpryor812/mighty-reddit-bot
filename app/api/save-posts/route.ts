import { classifyPost } from "@/lib/claude";
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

// Pre-filter to reduce Claude Haiku calls. At least one of these must appear
// in the title or body before Claude is consulted.
const PRE_FILTER_KEYWORDS = [
  "injury",
  "injured",
  "pain",
  "lawyer",
  "attorney",
  "settlement",
  "insurance claim",
  "at fault",
  "liable",
  "liability",
  "medical bills",
  "adjuster",
  "demand letter",
  "personal injury",
  "PI claim",
  "uninsured",
  "underinsured",
  "sue",
  "lawsuit",
  "negotiate",
  "workers comp",
  "workers compensation",
];

function passesPreFilter(title: string, body: string): boolean {
  const text = `${title} ${body}`.toLowerCase();
  return PRE_FILTER_KEYWORDS.some((kw) => text.includes(kw));
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
    if (!passesPreFilter(post.title, post.body)) {
      skipped++;
      continue;
    }

    try {
      const relevant = await classifyPost(post.title, post.body);
      if (!relevant) {
        skipped++;
        continue;
      }
    } catch (err) {
      console.error(`Classification failed for ${post.reddit_id}:`, err);
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
