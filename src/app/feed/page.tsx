'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UnifiedFeedList } from '@/components/feed/UnifiedFeedList';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Users, UserPlus, MessageSquare, Calendar } from 'lucide-react';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Your Feed</h1>
            <p className="text-gray-600">Latest posts from your groups and friends</p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/friends">
                <UserPlus className="h-4 w-4 mr-2" />
                Friends
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/events">
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/groups">
                <Users className="h-4 w-4 mr-2" />
                Groups
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Unified Feed */}
      <UnifiedFeedList />
    </div>
  );
}