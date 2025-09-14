'use client';

import { usePersonalPosts } from '@/hooks/usePersonalPosts';
import { PersonalPostCard } from './PersonalPostCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface PersonalPostListProps {
  targetUserId: string;
  onRefresh?: () => void;
}

export function PersonalPostList({ targetUserId, onRefresh }: PersonalPostListProps) {
  const { user } = useAuthContext();
  const { posts, loading, error, pagination, likePost, loadMore, fetchPosts } = usePersonalPosts(targetUserId);

  const handleRefresh = async () => {
    await fetchPosts();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading posts: {error}</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No posts yet on this feed.</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Posts ({posts.length})</h3>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {posts.map((post) => (
            <PersonalPostCard
              key={post.id}
              post={post}
              onLike={likePost}
              currentUserId={user?.id}
            />
          ))}
          
          {pagination && pagination.hasNext && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadMore}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}