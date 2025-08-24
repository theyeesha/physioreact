import { useState } from "react";
import { Key, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PhysioLayout from "@/components/physio-layout";

export default function PhysioSettings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    scheduleReminders: true,
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour'
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    });
  };

  return (
    <PhysioLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
          <p className="text-gray-600">Configure your app preferences</p>
        </div>

        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications" className="text-base font-medium text-gray-800">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications" className="text-base font-medium text-gray-800">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="scheduleReminders" className="text-base font-medium text-gray-800">
                    Schedule Reminders
                  </Label>
                  <p className="text-sm text-gray-600">Get reminded about upcoming shifts</p>
                </div>
                <Switch
                  id="scheduleReminders"
                  checked={settings.scheduleReminders}
                  onCheckedChange={(checked) => handleSettingChange('scheduleReminders', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger className="focus:ring-physio-blue focus:border-physio-blue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) => handleSettingChange('dateFormat', value)}
                >
                  <SelectTrigger className="focus:ring-physio-blue focus:border-physio-blue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select
                  value={settings.timeFormat}
                  onValueChange={(value) => handleSettingChange('timeFormat', value)}
                >
                  <SelectTrigger className="focus:ring-physio-blue focus:border-physio-blue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24-hour">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSaveSettings}
                className="bg-physio-blue hover:bg-blue-700"
              >
                Save Display Settings
              </Button>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full bg-physio-blue hover:bg-blue-700 text-left justify-start"
                onClick={() => {
                  toast({
                    title: "Change Password",
                    description: "Password change feature will be implemented soon",
                  });
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full text-left justify-start"
                onClick={() => {
                  toast({
                    title: "Download Data",
                    description: "Data download feature will be implemented soon",
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download My Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PhysioLayout>
  );
}
