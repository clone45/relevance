'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePosts } from '@/hooks/usePosts';
import { useAuthContext } from '@/contexts/AuthContext';
import { Send, X } from 'lucide-react';

interface CreatePostFormProps {
  groupId: string;
  groupName: string;
  onCancel?: () => void;
  compact?: boolean;
}

export function CreatePostForm({ groupId, groupName, onCancel, compact = false }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const { createPost, loading, error, clearError } = usePosts();
  const { user } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    const post = await createPost({
      content: content.trim(),
      groupId,
    });

    if (post) {
      setContent('');
      setIsExpanded(compact ? false : true);
      onCancel?.();
    }
  };

  const handleCancel = () => {
    setContent('');
    setIsExpanded(false);
    clearError();
    onCancel?.();
  };

  const handleFocus = () => {
    if (compact) {
      setIsExpanded(true);
    }
  };

  if (!user) {
    return null;
  }

  if (compact && !isExpanded) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div 
            className="w-full p-3 border rounded-lg bg-gray-50 cursor-text text-gray-500"
            onClick={handleFocus}
          >
            What's on your mind, {user.name}?
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          Share something with {groupName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's happening in ${groupName}?`}
            className="min-h-24 resize-none"
            maxLength={2000}
            disabled={loading}
            autoFocus={isExpanded && compact}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {content.length}/2000 characters
            </span>
            
            <div className="flex gap-2">
              {compact && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              
              <Button 
                type="submit" 
                disabled={!content.trim() || loading}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}