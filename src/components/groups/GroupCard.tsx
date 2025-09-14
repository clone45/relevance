'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Group } from '@/types/group';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import { Users, MapPin, Lock } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  showJoinButton?: boolean;
}

export function GroupCard({ group, showJoinButton = true }: GroupCardProps) {
  const { user } = useAuthContext();
  const { joinGroup, leaveGroup, loading } = useGroups();

  const handleJoinGroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    await joinGroup(group.id);
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

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                {group.name}
                {group.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCategoryColor(group.category)}>
                  {group.category}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {group.description}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group.memberCount} members</span>
            </div>
            
            {group.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-20">{group.location}</span>
              </div>
            )}
          </div>

          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {group.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
              {group.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{group.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>

        {showJoinButton && user && (
          <CardFooter className="pt-0">
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleJoinGroup}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Group'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}