import { fetchNewPosts } from "@/lib/reddit";
import { insertPost } from "@/lib/supabase";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const SUBREDDITS = [
  "legaladvice",
  "Insurance",
  "personalfinance",
  "AskALawyer",
  "caraccidents",
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
  const headersList = await headers();
  const authorization = headersList.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authorization !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const subreddit of SUBREDDITS) {
    try {
      const posts = await fetchNewPosts(subreddit, 25);

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
