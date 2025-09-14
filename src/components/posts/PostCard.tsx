'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Post } from '@/types/post';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageIconButton } from '@/components/messages/MessageButton';

interface PostCardProps {
  post: Post;
  showGroup?: boolean;
}

export function PostCard({ post, showGroup = true }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuthContext();
  const { likePost, unlikePost, deletePost, loading } = usePosts();

  const isAuthor = user?.id === post.author.id;
  const hasLiked = user ? post.likes.includes(user.id) : false;
  const timeAgo = getTimeAgo(post.createdAt);

  const handleLike = async () => {
    if (!user) return;
    
    if (hasLiked) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
  };

  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-500 text-white">
                {getAuthorInitials(post.author.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-sm">{post.author.name}</h4>
                {!isAuthor && (
                  <MessageIconButton userId={post.author.id} />
                )}
                {showGroup && (
                  <>
                    <span className="text-gray-400">→</span>
                    <Link href={`/groups/${post.groupId}`}>
                      <Badge variant="secondary" className="hover:bg-gray-200 cursor-pointer">
                        {post.group.name}
                      </Badge>
                    </Link>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <span>{timeAgo}</span>
                {post.isEdited && <span>• Edited</span>}
              </div>
            </div>
          </div>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Interaction buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={!user || loading}
              className={`h-8 px-2 ${hasLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600'}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="h-8 px-2 text-gray-600"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{post.commentCount}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {post.likeCount > 0 && (
              <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
            )}
          </div>
        </div>

        {/* Comments section (placeholder) */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-center text-gray-500 py-4">
              Comments feature coming soon!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}