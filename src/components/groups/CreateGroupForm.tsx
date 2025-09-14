'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGroups } from '@/hooks/useGroups';
import { CreateGroupData } from '@/types/group';

const CATEGORIES = [
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

export function CreateGroupForm() {
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    category: '',
    isPrivate: false,
    location: '',
    tags: [],
    rules: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { createGroup, loading, error } = useGroups();
  const router = useRouter();

  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(tag) && formData.tags.length < 5) {
        setFormData(prev => ({ 
          ...prev, 
          tags: [...prev.tags, tag] 
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.name.trim() || !formData.description.trim() || !formData.category) {
      setLocalError('Please fill in all required fields');
      return;
    }

    const group = await createGroup(formData);
    if (group) {
      router.push(`/groups/${group.id}`);
    }
  };

  const displayError = localError || error;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Group</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter group name"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what your group is about"
              required
              disabled={loading}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, Country"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tags (press Enter to add)"
              disabled={loading || formData.tags.length >= 5}
              maxLength={30}
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              {formData.tags.length}/5 tags
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Group Rules (Optional)</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => handleChange('rules', e.target.value)}
              placeholder="Set guidelines for your group"
              disabled={loading}
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => handleChange('isPrivate', e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="isPrivate">Make this group private</Label>
          </div>

          {displayError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {displayError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Group...' : 'Create Group'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}