"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SUBREDDITS = [
  "legaladvice",
  "Insurance",
  "personalfinance",
  "AskALawyer",
  "caraccidents",
  "legaladviceofftopic",
];

const UI_REFRESH_INTERVAL = 60;
const REDDIT_POLL_INTERVAL = 10 * 60;

interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  score: number;
  created_utc: number;
}

async function fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/new.json?limit=25`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.data.children.map((c: { data: RedditPost }) => c.data);
}

async function fetchAndSave(): Promise<{ inserted: number; errors: string[] }> {
  const allPosts: Array<{
    reddit_id: string;
    subreddit: string;
    title: string;
    body: string;
    url: string;
    reddit_score: number;
    created_utc: number;
  }> = [];

  const fetchErrors: string[] = [];

  for (const subreddit of SUBREDDITS) {
    try {
      const posts = await fetchSubreddit(subreddit);
      for (const p of posts) {
        allPosts.push({
          reddit_id: p.id,
          subreddit: p.subreddit,
          title: p.title,
          body: p.selftext,
          url: p.url,
          reddit_score: p.score,
          created_utc: p.created_utc,
        });
      }
    } catch (err) {
      fetchErrors.push(`r/${subreddit}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const res = await fetch("/api/save-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(allPosts),
  });

  const result = await res.json();
  return { inserted: result.inserted ?? 0, errors: [...fetchErrors, ...(result.errors ?? [])] };
}

export default function RefreshFeed() {
  const router = useRouter();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);
  const redditPollSeconds = useRef(0);

  const runFetch = async () => {
    if (fetching) return;
    setFetching(true);
    setFetchResult(null);
    try {
      const { inserted, errors } = await fetchAndSave();
      if (errors.length > 0) {
        console.warn("Fetch errors:", errors);
      }
      setFetchResult(`+${inserted} new posts`);
      setSecondsAgo(0);
      redditPollSeconds.current = 0;
      try { router.refresh(); } catch { /* ignore refresh errors */ }
    } catch (err) {
      console.error("Fetch failed:", err);
      setFetchResult("Fetch failed");
    } finally {
      setFetching(false);
      setTimeout(() => setFetchResult(null), 4000);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    runFetch();

    const interval = setInterval(() => {
      setSecondsAgo((prev) => {
        if (prev + 1 >= UI_REFRESH_INTERVAL) {
          router.refresh();
          return 0;
        }
        return prev + 1;
      });

      redditPollSeconds.current += 1;
      if (redditPollSeconds.current >= REDDIT_POLL_INTERVAL) {
        redditPollSeconds.current = 0;
        runFetch();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatTime(seconds: number): string {
    if (seconds === 0) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }

  return (
    <div className="flex items-center gap-3">
      {fetchResult && (
        <span className="text-xs text-green-400 font-medium">{fetchResult}</span>
      )}
      <button
        onClick={runFetch}
        disabled={fetching}
        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        {fetching ? (
          <>
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching…
          </>
        ) : (
          "Fetch Posts"
        )}
      </button>
      <p className="text-xs text-gray-400">
        Updated{" "}
        <span className="text-gray-300 font-medium">{formatTime(secondsAgo)}</span>
      </p>
    </div>
  );
}
