import { fetchNewPosts } from "@/lib/reddit";
import { insertPost } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SUBREDDITS = [
  "legaladvice",
  "Insurance",
  "personalfinance",
  "AskALawyer",
  "caraccidents",
  "personalinjury",
  "legaladviceofftopic",
];

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

export async function GET() {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const subreddit of SUBREDDITS) {
    try {
      const posts = await fetchNewPosts(subreddit, 5);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`fetch r/${subreddit}: ${msg}`);
    }
  }

  return Response.json({ inserted, skipped, errors });
}
