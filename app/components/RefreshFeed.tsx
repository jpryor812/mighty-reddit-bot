"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REFRESH_INTERVAL = 60;

export default function RefreshFeed() {
  const router = useRouter();
  const [secondsAgo, setSecondsAgo] = useState(0);

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

  function formatTime(seconds: number): string {
    if (seconds === 0) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }

  return (
    <p className="text-xs text-gray-400">
      Updated{" "}
      <span className="text-gray-300 font-medium">{formatTime(secondsAgo)}</span>
    </p>
  );
}
