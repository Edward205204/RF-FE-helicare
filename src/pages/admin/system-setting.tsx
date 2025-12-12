import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';

const SystemSettings: React.FC = () => {
  const [systemName, setSystemName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('');
  const [timezone, setTimezone] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [enable2FA, setEnable2FA] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('');

  const handleSave = () => {
    // Implement save logic
    console.log('Settings saved');
  };

  const handleCancel = () => {
    // Implement cancel logic
    console.log('Settings cancelled');
  };

  const handleResetAPIKeys = () => {
    // Implement reset API keys logic
    console.log('API keys reset');
  };

  const handleTriggerBackup = () => {
    // Implement trigger backup logic
    console.log('Manual backup triggered');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 rounded-xl to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General System Settings */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>General System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  value={systemName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSystemName(e.target.value)}
                  placeholder="Enter system name"
                />
              </div>
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupportEmail(e.target.value)}
                  placeholder="Enter support email"
                />
              </div>
              <div>
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <Switch
                  id="smsNotifications"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <Switch
                  id="pushNotifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={maxLoginAttempts}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxLoginAttempts(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enable2FA">Enable Two-Factor Authentication (2FA)</Label>
                <Switch
                  id="enable2FA"
                  checked={enable2FA}
                  onCheckedChange={setEnable2FA}
                />
              </div>
              <Button onClick={handleResetAPIKeys} variant="outline">
                Reset All API Keys
              </Button>
            </CardContent>
          </Card>

          {/* Backup Settings */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTriggerBackup} variant="outline">
                Trigger Manual Backup
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="flex justify-end space-x-4">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} className='bg-blue-500 text-white'>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
