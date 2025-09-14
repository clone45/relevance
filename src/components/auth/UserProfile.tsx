'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';

export function UserProfile() {
  const { user, logout, loading } = useAuthContext();

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Relevance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Please sign in to access your account.</p>
          <div className="flex space-x-2">
            <Button asChild className="flex-1">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back, {user.name}!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/messages">Messages</Link>
          </Button>
          
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}