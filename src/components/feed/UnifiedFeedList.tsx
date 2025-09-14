'use client';

import { useUnifiedFeed } from '@/hooks/useUnifiedFeed';
import { UnifiedPostCard } from './UnifiedPostCard';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Inbox } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

export function UnifiedFeedList() {
  const { user } = useAuthContext();
  const { posts, loading, error, pagination, likePost, loadMore, refresh } = useUnifiedFeed();

  const handleRefresh = async () => {
    await refresh();
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
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Error loading feed: {error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">Your feed is empty</h3>
              <div className="space-y-1 text-sm">
                <p>Join groups to see group posts</p>
                <p>Add friends to see personal posts</p>
                <p>Start posting to share with others!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
          
          {posts.map((post) => (
            <UnifiedPostCard
              key={`${post.type}-${post.id}`}
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