import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GroupList } from '@/components/groups/GroupList';
import { Plus } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Discover Groups</h1>
          <p className="text-gray-600 mt-2">Find communities that match your interests</p>
        </div>
        
        <Button asChild>
          <Link href="/groups/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Link>
        </Button>
      </div>

      <GroupList />
    </div>
  );
}