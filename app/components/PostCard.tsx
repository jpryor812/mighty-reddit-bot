"use client";

import { useState } from "react";
import type { Post } from "@/lib/supabase";

const SUBREDDIT_COLORS: Record<string, string> = {
  legaladvice: "bg-blue-100 text-blue-800",
  AskALawyer: "bg-purple-100 text-purple-800",
  personalinjury: "bg-red-100 text-red-800",
  Insurance: "bg-amber-100 text-amber-800",
  caraccidents: "bg-green-100 text-green-800",
  personalfinance: "bg-teal-100 text-teal-800",
  legaladviceofftopic: "bg-indigo-100 text-indigo-800",
};

function getSubredditColor(subreddit: string): string {
  return SUBREDDIT_COLORS[subreddit] ?? "bg-gray-100 text-gray-700";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState(post.reply_draft ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasReply = reply.length > 0;
  const hasBody = post.body.trim().length > 0;

  async function handleGenerateReply() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate reply");
      }

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSubredditColor(post.subreddit)}`}
          >
            r/{post.subreddit}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {relativeTime(post.created_at)}
          </span>
        </div>

        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-gray-900 font-semibold text-base leading-snug hover:text-orange-600 transition-colors mb-3"
        >
          {post.title}
        </a>

        {hasBody && (
          <div className="text-gray-600 text-sm">
            <p
              className={`leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}
            >
              {post.body}
            </p>
            {post.body.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-orange-500 hover:text-orange-600 text-xs font-medium mt-1 transition-colors"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Score: <span className="font-medium text-gray-600">{post.reddit_score}</span>
          </span>

          {!hasReply && (
            <button
              onClick={handleGenerateReply}
              disabled={loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate Reply"
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {hasReply && (
        <div className="border-t border-gray-100 bg-green-50 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Draft Reply
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateReply}
                disabled={loading}
                className="text-xs text-gray-500 hover:text-gray-700 underline disabled:no-underline disabled:text-gray-300 transition-colors"
              >
                {loading ? "Regenerating…" : "Regenerate"}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? "Copied ✓" : "Copy Reply"}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={reply}
            rows={6}
            className="w-full text-sm text-gray-700 bg-transparent resize-none border-none outline-none leading-relaxed"
          />
        </div>
      )}
    </article>
  );
}
