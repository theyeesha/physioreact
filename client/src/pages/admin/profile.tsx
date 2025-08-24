import { useState } from "react";
import { User, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin-layout";

export default function AdminProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    profileImageUrl: user?.profileImageUrl || ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, data);
      return response;
    },
    onSuccess: (response: any) => {
      // If response includes updated token and user data, update stored auth data
      if (response.token && response.user) {
        // Import AuthService dynamically to avoid circular imports
        import('@/lib/auth').then(({ AuthService }) => {
          AuthService.setToken(response.token);
          AuthService.setUser(response.user);
          // Trigger a page reload to update the UI with new user data
          window.location.reload();
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Settings</h2>
          <p className="text-gray-600">Manage your admin account information</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-6 mb-6">
              {formData.profileImageUrl ? (
                <img 
                  src={formData.profileImageUrl} 
                  alt="Admin Profile" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Dr. {formData.firstName} {formData.lastName}
                </h3>
                <p className="text-gray-600">System Administrator</p>
                <Button variant="ghost" size="sm" className="text-physio-blue hover:text-blue-700 mt-2">
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="focus:ring-physio-blue focus:border-physio-blue"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="focus:ring-physio-blue focus:border-physio-blue"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="focus:ring-physio-blue focus:border-physio-blue"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  className="focus:ring-physio-blue focus:border-physio-blue"
                />
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  className="bg-physio-blue hover:bg-blue-700"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
