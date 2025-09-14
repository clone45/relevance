'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PostCard } from './PostCard';
import { usePosts } from '@/hooks/usePosts';

interface PostListProps {
  groupId?: string;
  showGroup?: boolean;
}

export function PostList({ groupId, showGroup = true }: PostListProps) {
  const { 
    posts, 
    loading, 
    error, 
    totalPages, 
    currentPage, 
    fetchPosts, 
    clearError 
  } = usePosts();

  useEffect(() => {
    fetchPosts(1, groupId);
  }, [fetchPosts, groupId]);

  const handleLoadMore = () => {
    fetchPosts(currentPage + 1, groupId);
  };

  const handleRetry = () => {
    clearError();
    fetchPosts(1, groupId);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRetry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-gray-600">
          {groupId 
            ? 'Be the first to share something in this group!'
            : 'Join some groups to see posts in your feed!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          showGroup={showGroup}
        />
      ))}

      {/* Load More Button */}
      {currentPage < totalPages && (
        <div className="text-center py-6">
          <Button 
            onClick={handleLoadMore} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </Button>
        </div>
      )}

      {/* Loading indicator for additional posts */}
      {loading && posts.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
            <span>Loading more posts...</span>
          </div>
        </div>
      )}
    </div>
  );
}