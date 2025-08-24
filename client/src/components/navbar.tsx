import { Bell, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-3 p-2"
                onClick={onMenuClick}
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </Button>
            )}
            <div className="bg-physio-blue rounded-lg w-10 h-10 flex items-center justify-center mr-3">
              <User className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 sm:text-xl">Physio Scheduler</h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    recentNotifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <Link 
                    href={user?.role === 'admin' ? '/admin/notifications' : '/physio/notifications'}
                    className="text-sm text-physio-blue hover:text-blue-700 font-medium"
                  >
                    View all notifications →
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Dr. {user?.firstName} {user?.lastName}
              </span>
              <span className="text-sm font-medium text-gray-700 sm:hidden">
                {user?.role === 'admin' ? 'Admin' : 'Dr.'}
              </span>
            </div>
            
            <Button variant="ghost" size="sm" onClick={logout} className="p-2">
              <LogOut className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
