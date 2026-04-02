import { createClient } from "@supabase/supabase-js";

export interface Post {
  id: string;
  reddit_id: string;
  subreddit: string;
  title: string;
  body: string;
  url: string;
  reddit_score: number;
  reply_draft: string | null;
  created_at: string;
}

interface NewPost {
  reddit_id: string;
  subreddit: string;
  title: string;
  body: string;
  url: string;
  reddit_score: number;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function insertPost(post: NewPost): Promise<void> {
  const { reddit_id, subreddit, title, body, url, reddit_score } = post;
  const { error } = await supabase
    .from("posts")
    .upsert({ reddit_id, subreddit, title, body, url, reddit_score }, { onConflict: "reddit_id" });

  if (error) {
    throw new Error(`Failed to insert post: ${error.message}`);
  }
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  return data ?? [];
}

export async function updateReplyDraft(id: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .update({ reply_draft: reply })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update reply draft: ${error.message}`);
  }
}
