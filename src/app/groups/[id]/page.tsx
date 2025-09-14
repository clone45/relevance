'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGroup } from '@/hooks/useGroup';
import { useAuthContext } from '@/contexts/AuthContext';
import { ArrowLeft, Users, MapPin, Calendar, Lock, Settings, Plus } from 'lucide-react';
import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { PostList } from '@/components/posts/PostList';
import { EventList } from '@/components/events/EventList';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  
  const { user } = useAuthContext();
  const { group, loading, error, fetchGroup, joinGroup, leaveGroup } = useGroup();

  useEffect(() => {
    if (groupId) {
      fetchGroup(groupId);
    }
  }, [groupId, fetchGroup]);

  const handleJoinGroup = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    await joinGroup(groupId);
  };

  const handleLeaveGroup = async () => {
    const success = await leaveGroup(groupId);
    if (success) {
      router.push('/groups');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technology: 'bg-blue-100 text-blue-800',
      sports: 'bg-green-100 text-green-800',
      hobbies: 'bg-purple-100 text-purple-800',
      education: 'bg-orange-100 text-orange-800',
      business: 'bg-gray-100 text-gray-800',
      social: 'bg-pink-100 text-pink-800',
      health: 'bg-red-100 text-red-800',
      arts: 'bg-indigo-100 text-indigo-800',
      other: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || colors.other;
  };

  if (loading && !group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Error Loading Group</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchGroup(groupId)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Group Not Found</h2>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/groups">Browse Groups</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = group.userMembership?.role === 'owner';
  const isAdmin = group.userMembership?.role === 'admin';
  const isMember = !!group.userMembership;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/groups">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Group Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {group.name}
                    {group.isPrivate && <Lock className="h-5 w-5 text-gray-500" />}
                  </CardTitle>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getCategoryColor(group.category)}>
                    {group.category}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{group.memberCount} members</span>
                  </div>

                  {group.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{group.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{group.description}</p>

                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {isMember && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/events/create?groupId=${groupId}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Link>
                  </Button>
                )}

                {(isOwner || isAdmin) && (
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                )}

                {!isMember && user && (
                  <Button onClick={handleJoinGroup} disabled={loading}>
                    {loading ? 'Joining...' : 'Join Group'}
                  </Button>
                )}

                {isMember && !isOwner && (
                  <Button 
                    variant="destructive" 
                    onClick={handleLeaveGroup} 
                    disabled={loading}
                  >
                    {loading ? 'Leaving...' : 'Leave Group'}
                  </Button>
                )}

                {!user && (
                  <Button asChild>
                    <Link href="/login">Sign In to Join</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Group Rules */}
        {group.rules && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{group.rules}</p>
            </CardContent>
          </Card>
        )}

        {/* Member Status */}
        {isMember && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">You are a {group.userMembership?.role} of this group</p>
                  <p className="text-sm text-gray-600">
                    Joined on {new Date(group.userMembership!.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            {isMember && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/events/create?groupId=${groupId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
          <EventList groupId={groupId} showGroup={false} />
        </div>

        {/* Posts Section */}
        {isMember ? (
          <div className="space-y-6">
            <CreatePostForm 
              groupId={groupId} 
              groupName={group.name}
              compact={true}
            />
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
              <PostList groupId={groupId} showGroup={false} />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                Join this group to see posts and share your own content!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}