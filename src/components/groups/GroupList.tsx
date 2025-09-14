'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupCard } from './GroupCard';
import { useGroups } from '@/hooks/useGroups';
import { Search } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'sports', label: 'Sports' },
  { value: 'hobbies', label: 'Hobbies' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'social', label: 'Social' },
  { value: 'health', label: 'Health' },
  { value: 'arts', label: 'Arts' },
  { value: 'other', label: 'Other' },
];

export function GroupList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const { 
    groups, 
    loading, 
    error, 
    totalPages, 
    currentPage, 
    fetchGroups, 
    clearError 
  } = useGroups();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch groups when filters change
  useEffect(() => {
    fetchGroups(1, {
      category: selectedCategory,
      search: debouncedSearch || undefined,
    });
  }, [selectedCategory, debouncedSearch, fetchGroups]);

  const handleLoadMore = () => {
    fetchGroups(currentPage + 1, {
      category: selectedCategory,
      search: debouncedSearch || undefined,
    });
  };

  const handleRetry = () => {
    clearError();
    fetchGroups(1, {
      category: selectedCategory,
      search: debouncedSearch || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && groups.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* Groups Grid */}
      {!loading && groups.length === 0 && !error && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No groups found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search filters'
              : 'Be the first to create a group!'}
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="text-center">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More Groups'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}