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

const TWENTY_FOUR_HOURS_AGO = () => Math.floor(Date.now() / 1000) - 24 * 60 * 60;

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

  const cutoff = TWENTY_FOUR_HOURS_AGO();
  let inserted = 0;
  let skipped = 0;
  let tooOld = 0;

  for (const subreddit of SUBREDDITS) {
    try {
      const posts = await fetchNewPosts(subreddit, 100);

      for (const post of posts) {
        if (post.created_utc < cutoff) {
          tooOld++;
          continue;
        }

        if (!isRelevant(post.title, post.body)) {
          skipped++;
          continue;
        }

        try {
          await insertPost(post);
          inserted++;
        } catch (err) {
          console.error(`Failed to insert post ${post.reddit_id}:`, err);
          skipped++;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, err);
    }
  }

  return Response.json({ inserted, skipped, tooOld });
}
