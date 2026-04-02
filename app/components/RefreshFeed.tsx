"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REFRESH_INTERVAL = 60;

export default function RefreshFeed() {
  const router = useRouter();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((prev) => {
        if (prev + 1 >= REFRESH_INTERVAL) {
          router.refresh();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  async function handleFetch() {
    setFetching(true);
    setFetchResult(null);

    try {
      const res = await fetch("/api/backfill");
      const data = await res.json();
      setFetchResult(`+${data.inserted} new posts`);
      setSecondsAgo(0);
      router.refresh();
    } catch {
      setFetchResult("Failed to fetch");
    } finally {
      setFetching(false);
      setTimeout(() => setFetchResult(null), 4000);
    }
  }

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
        onClick={handleFetch}
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
