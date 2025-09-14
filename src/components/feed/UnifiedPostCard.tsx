'use client';

import { useState } from 'react';
import { UnifiedPost } from '@/types/unified-feed';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreVertical, Users, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UnifiedPostCardProps {
  post: UnifiedPost;
  onLike?: (postId: string, postType: 'group' | 'personal') => Promise<void>;
  currentUserId?: string;
}

export function UnifiedPostCard({ post, onLike, currentUserId }: UnifiedPostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!onLike) return;
    
    try {
      setIsLiking(true);
      await onLike(post.id, post.type);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const isOwnPost = currentUserId === post.author.id;
  const timeAgo = new Date(post.createdAt).toLocaleDateString();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" className="p-0 h-auto">
              <Link href={`/profile/${post.author.id}`}>
                <Avatar>
                  <AvatarFallback>
                    {post.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" className="p-0 h-auto">
                  <Link href={`/profile/${post.author.id}`}>
                    <h3 className="font-semibold text-sm hover:underline">{post.author.name}</h3>
                  </Link>
                </Button>
                
                {post.type === 'group' ? (
                  <>
                    <span className="text-muted-foreground text-sm">in</span>
                    <Button asChild variant="ghost" className="p-0 h-auto">
                      <Link href={`/groups/${post.group.id}`}>
                        <Badge variant="secondary" className="hover:bg-secondary/80">
                          <Users className="h-3 w-3 mr-1" />
                          {post.group.name}
                        </Badge>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground text-sm">→</span>
                    <Button asChild variant="ghost" className="p-0 h-auto">
                      <Link href={`/profile/${post.targetUser.id}`}>
                        <Badge variant="outline" className="hover:bg-accent">
                          <User className="h-3 w-3 mr-1" />
                          {post.targetUser.name}
                        </Badge>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {timeAgo}
                {post.isEdited && ' (edited)'}
              </p>
            </div>
          </div>
          
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit post</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`h-8 ${post.liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${post.liked ? 'fill-current' : ''}`} />
              {post.likeCount}
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-blue-500">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.commentCount}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}