'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreateEventForm } from '@/components/events/CreateEventForm';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

function CreateEventContent() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [groupInfo, setGroupInfo] = useState<{ id: string; name: string } | null>(null);

  const groupId = searchParams.get('groupId');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (groupId) {
      // Fetch group info
      fetch(`/api/groups/${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.group) {
            setGroupInfo({
              id: data.group._id,
              name: data.group.name,
            });
          }
        })
        .catch(err => {
          console.error('Failed to fetch group info:', err);
          router.push('/groups');
        });
    } else {
      // No group specified, redirect to groups page
      router.push('/groups');
    }
  }, [groupId, router]);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (!groupInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Getting group information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/groups/${groupInfo.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {groupInfo.name}
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Create Event</h1>
        <p className="text-gray-600 mt-2">
          Organize an event for your group members
        </p>
      </div>

      <CreateEventForm 
        groupId={groupInfo.id} 
        groupName={groupInfo.name} 
      />
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <CreateEventContent />
    </Suspense>
  );
}