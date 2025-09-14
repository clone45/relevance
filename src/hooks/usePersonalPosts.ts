import { useState, useEffect } from 'react';
import { PersonalPost } from '@/types/friend';

interface PersonalPostsResponse {
  posts: PersonalPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function usePersonalPosts(targetUserId: string) {
  const [posts, setPosts] = useState<PersonalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PersonalPostsResponse['pagination'] | null>(null);

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/personal?targetUserId=${targetUserId}&page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch personal posts');
      }

      const data: PersonalPostsResponse = await response.json();
      
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

  const createPost = async (content: string) => {
    try {
      const response = await fetch('/api/posts/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = await response.json();
      setPosts(prev => [data.post, ...prev]);
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const likePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/personal/${postId}/like`, {
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
      fetchPosts(pagination.page + 1);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchPosts();
    }
  }, [targetUserId]);

  return {
    posts,
    loading,
    error,
    pagination,
    fetchPosts,
    createPost,
    likePost,
    loadMore,
  };
}