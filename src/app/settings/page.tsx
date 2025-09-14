'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthContext();

  if (!user) {
    return null;
  }

  const settingsSections = [
    {
      title: 'Profile Settings',
      description: 'Manage your personal information and profile',
      icon: User,
      items: ['Edit Profile', 'Change Avatar', 'Privacy Settings'],
    },
    {
      title: 'Notifications',
      description: 'Control how you receive notifications',
      icon: Bell,
      items: ['Email Notifications', 'Push Notifications', 'Activity Alerts'],
    },
    {
      title: 'Security',
      description: 'Manage your account security and privacy',
      icon: Shield,
      items: ['Change Password', 'Two-Factor Authentication', 'Login History'],
    },
    {
      title: 'Appearance',
      description: 'Customize how the app looks and feels',
      icon: Palette,
      items: ['Theme Settings', 'Display Preferences', 'Accessibility'],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="h-8 w-8 mr-3 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and settings</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <IconComponent className="h-5 w-5 mr-2 text-blue-600" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <Button
                      key={item}
                      variant="ghost"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon</h3>
        <p className="text-blue-800 text-sm">
          These settings pages are currently under development. Full functionality will be available in a future update.
        </p>
      </div>
    </div>
  );
}