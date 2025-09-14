'use client';

import { useState, useCallback } from 'react';
import { Post, CreatePostData, PostListResponse } from '@/types/post';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  createPost: (data: CreatePostData) => Promise<Post | null>;
  fetchPosts: (page?: number, groupId?: string) => Promise<void>;
  likePost: (postId: string) => Promise<boolean>;
  unlikePost: (postId: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  clearError: () => void;
}

export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createPost = useCallback(async (data: CreatePostData): Promise<Post | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return null;
      }

      // Add the new post to the beginning of the posts array
      setPosts(prev => [result.post, ...prev]);
      return result.post;
    } catch (err) {
      setError('Network error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async (
    page = 1, 
    groupId?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (groupId) {
        params.append('groupId', groupId);
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      const result: PostListResponse & { totalPages: number; page: number } = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch posts');
        return;
      }

      if (page === 1) {
        setPosts(result.posts);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
      }
      
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const likePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Update the post's like count locally
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likeCount: result.likeCount,
              likes: [...post.likes, 'current-user'] // Add current user to likes
            }
          : post
      ));

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, []);

  const unlikePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Update the post's like count locally
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likeCount: result.likeCount,
              likes: post.likes.filter(id => id !== 'current-user') // Remove current user from likes
            }
          : post
      ));

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, []);

  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Remove the post from the local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, []);

  return {
    posts,
    loading,
    error,
    totalPages,
    currentPage,
    createPost,
    fetchPosts,
    likePost,
    unlikePost,
    deletePost,
    clearError,
  };
}