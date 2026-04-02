import { getPosts } from "@/lib/supabase";
import PostCard from "@/app/components/PostCard";
import RefreshFeed from "@/app/components/RefreshFeed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-sm">
              M
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Mighty Reddit Monitor
            </h1>
          </div>
          <RefreshFeed />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">No posts yet</p>
            <p className="text-sm">
              The cron job will read posts from Reddit every 5 minutes and surface relevant posts here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
