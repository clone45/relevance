import { useState, useEffect } from 'react';
import { UnifiedPost, UnifiedFeedResponse } from '@/types/unified-feed';

export function useUnifiedFeed() {
  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UnifiedFeedResponse['pagination'] | null>(null);

  const fetchFeed = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feed/unified?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch unified feed');
      }

      const data: UnifiedFeedResponse = await response.json();
      
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setPagination(data.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string, postType: 'group' | 'personal') => {
    try {
      const endpoint = postType === 'group' 
        ? `/api/posts/${postId}/like`
        : `/api/posts/personal/${postId}/like`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to like post');
      }

      const data = await response.json();
      
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likeCount: data.likeCount, liked: data.liked }
            : post
        )
      );

      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const loadMore = () => {
    if (pagination && pagination.hasNext) {
      fetchFeed(pagination.page + 1);
    }
  };

  const refresh = async () => {
    await fetchFeed(1);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return {
    posts,
    loading,
    error,
    pagination,
    fetchFeed,
    likePost,
    loadMore,
    refresh,
  };
}