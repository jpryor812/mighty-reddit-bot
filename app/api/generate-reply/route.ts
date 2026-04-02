import { generateReply } from "@/lib/claude";
import { getPosts, updateReplyDraft } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let postId: string;

  try {
    const body = await request.json();
    postId = body.postId;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!postId) {
    return Response.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const posts = await getPosts();
    const post = posts.find((p) => p.id === postId);

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const reply = await generateReply(post.title, post.body);
    await updateReplyDraft(postId, reply);

    return Response.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("generate-reply error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
