export interface RedditPost {
  reddit_id: string;
  subreddit: string;
  title: string;
  body: string;
  url: string;
  reddit_score: number;
}

interface RedditListingChild {
  data: {
    id: string;
    subreddit: string;
    title: string;
    selftext: string;
    url: string;
    created_utc: number;
    score: number;
    author: string;
  };
}

interface RedditListing {
  data: {
    children: RedditListingChild[];
  };
}

export async function fetchNewPosts(subreddit: string, limit: number): Promise<RedditPost[]> {
  const response = await fetch(
    `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`,
    {
      headers: {
        "User-Agent": "mighty-monitor/1.0",
      },
      next: { revalidate: 0 },
    }
  );

  if (!response.ok) {
    throw new Error(`Reddit fetch failed for r/${subreddit}: ${response.status}`);
  }

  const listing: RedditListing = await response.json();

  return listing.data.children.map((child) => ({
    reddit_id: child.data.id,
    subreddit: child.data.subreddit,
    title: child.data.title,
    body: child.data.selftext,
    url: child.data.url,
    reddit_score: child.data.score,
  }));
}
