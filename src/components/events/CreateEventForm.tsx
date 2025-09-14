'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useEvents } from '@/hooks/useEvents';
import { CreateEventData } from '@/types/event';

interface CreateEventFormProps {
  groupId: string;
  groupName: string;
}

export function CreateEventForm({ groupId, groupName }: CreateEventFormProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    location: '',
    isVirtual: false,
    virtualLink: '',
    maxAttendees: undefined,
    groupId,
  });
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { createEvent, loading, error } = useEvents();
  const router = useRouter();

  const handleChange = (name: string, value: string | boolean | number | Date) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleDateChange = (name: 'startDate' | 'endDate', value: string) => {
    const date = new Date(value);
    setFormData(prev => ({ ...prev, [name]: date }));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.title.trim() || !formData.description.trim()) {
      setLocalError('Title and description are required');
      return;
    }

    if (formData.endDate <= formData.startDate) {
      setLocalError('End date must be after start date');
      return;
    }

    if (formData.startDate < new Date()) {
      setLocalError('Start date must be in the future');
      return;
    }

    if (formData.isVirtual && !formData.virtualLink?.trim()) {
      setLocalError('Virtual link is required for virtual events');
      return;
    }

    if (!formData.isVirtual && !formData.location?.trim()) {
      setLocalError('Location is required for in-person events');
      return;
    }

    const event = await createEvent(formData);
    if (event) {
      router.push(`/events/${event.id}`);
    }
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const displayError = localError || error;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Event for {groupName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter event title"
              required
              disabled={loading}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your event"
              required
              disabled={loading}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formatDateForInput(formData.startDate)}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date & Time *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isVirtual"
              checked={formData.isVirtual}
              onCheckedChange={(checked) => handleChange('isVirtual', checked)}
              disabled={loading}
            />
            <Label htmlFor="isVirtual">This is a virtual event</Label>
          </div>

          {formData.isVirtual ? (
            <div className="space-y-2">
              <Label htmlFor="virtualLink">Virtual Meeting Link *</Label>
              <Input
                id="virtualLink"
                type="url"
                value={formData.virtualLink || ''}
                onChange={(e) => handleChange('virtualLink', e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                required={formData.isVirtual}
                disabled={loading}
                maxLength={500}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter event location"
                required={!formData.isVirtual}
                disabled={loading}
                maxLength={200}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
            <Input
              id="maxAttendees"
              type="number"
              value={formData.maxAttendees || ''}
              onChange={(e) => handleChange('maxAttendees', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty for unlimited"
              disabled={loading}
              min={1}
              max={10000}
            />
          </div>

          {displayError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {displayError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Event...' : 'Create Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}