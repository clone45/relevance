import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreateGroupForm } from '@/components/groups/CreateGroupForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateGroupPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/groups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Create a New Group</h1>
        <p className="text-gray-600 mt-2">Start a community around your interests</p>
      </div>

      <CreateGroupForm />
    </div>
  );
}