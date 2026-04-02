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
          console.error(`Failed to insert post ${post.reddit_id}:`, err);
          skipped++;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, err);
    }
  }

  return Response.json({ inserted, skipped });
}
