'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreatePersonalPostForm } from '@/components/posts/CreatePersonalPostForm';
import { PersonalPostList } from '@/components/posts/PersonalPostList';
import { Loader2, UserPlus, UserCheck, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
}

interface PageProps {
  params: { id: string };
}

export default function ProfilePage({ params }: PageProps) {
  const { user: currentUser, loading: authLoading } = useAuthContext();
  const { friends, sendFriendRequest } = useFriends();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${params.id}`);
      
      if (!response.ok) {
        throw new Error('User not found');
      }

      const userData = await response.json();
      setProfileUser(userData.user);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }

    if (params.id) {
      fetchProfile();
    }
  }, [params.id, authLoading, currentUser, router]);

  const isFriend = friends.some(friend => friend.id === params.id);
  const isOwnProfile = currentUser?.id === params.id;

  const handleSendFriendRequest = async () => {
    if (!profileUser) return;

    try {
      setSendingRequest(true);
      await sendFriendRequest(profileUser.id);
      toast({
        title: 'Friend request sent',
        description: `Friend request sent to ${profileUser.name}`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSendingRequest(false);
    }
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profileUser || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error || 'User not found'}
            </p>
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline">
                <Link href="/feed">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Feed
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button asChild variant="ghost" size="sm" className="mr-4">
          <Link href="/feed">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {profileUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profileUser.name}</h2>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-1" />
                  {profileUser.email}
                </div>
              </div>
            </div>
            
            {!isOwnProfile && (
              <div>
                {isFriend ? (
                  <Button disabled className="bg-green-500 hover:bg-green-600">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Friends
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendFriendRequest}
                    disabled={sendingRequest}
                  >
                    {sendingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Create Post Form - Only show if user is a friend or own profile */}
      {(isFriend || isOwnProfile) && (
        <div className="mb-6">
          <CreatePersonalPostForm
            targetUser={profileUser}
            currentUser={currentUser}
            onPostCreated={handlePostCreated}
          />
        </div>
      )}

      {/* Posts Feed */}
      <PersonalPostList 
        key={refreshKey}
        targetUserId={profileUser.id}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}