'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FriendsList from '@/components/friends/FriendsList';
import FriendRequests from '@/components/friends/FriendRequests';
import AddFriend from '@/components/friends/AddFriend';
import FriendSuggestions from '@/components/friends/FriendSuggestions';
import { Users, UserPlus, Mail, Sparkles } from 'lucide-react';

export default function FriendsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Users className="h-8 w-8 mr-3" />
        <h1 className="text-3xl font-bold">Friends</h1>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Friends
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <FriendsList />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <FriendRequests />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <FriendSuggestions />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <AddFriend />
        </TabsContent>
      </Tabs>
    </div>
  );
}