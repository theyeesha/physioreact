import { Clock, RefreshCw, Bell, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import PhysioLayout from "@/components/physio-layout";

export default function PhysioDashboard() {
  const { user } = useAuth();

  const { data: schedules = [] } = useQuery({
    queryKey: ['/api/schedules/user', user?.id],
    enabled: !!user?.id
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['/api/swap-requests'],
    enabled: !!user?.id
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user?.id
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter((schedule: any) => schedule.date === today);
  const thisWeekSchedules = schedules.filter((schedule: any) => {
    const scheduleDate = new Date(schedule.date);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return scheduleDate >= weekStart && scheduleDate <= weekEnd;
  });

  const totalHoursThisWeek = thisWeekSchedules.reduce((total: number, schedule: any) => {
    const start = new Date(`2000-01-01T${schedule.startTime}`);
    const end = new Date(`2000-01-01T${schedule.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  const mySwapRequests = swapRequests.filter((request: any) => request.requesterId === user?.id);
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <PhysioLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, Dr. {user?.firstName}!</h2>
          <p className="text-gray-600">Here's your schedule overview for today</p>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No scheduled shifts for today</p>
                </div>
              ) : (
                todaySchedules.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-physio-blue bg-opacity-10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-physio-blue rounded-full w-3 h-3"></div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                        <p className="text-sm text-gray-600">Full Shift</p>
                      </div>
                    </div>
                    <span className="text-sm text-physio-blue font-medium">Active</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-physio-blue">{totalHoursThisWeek} hrs</p>
                </div>
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-physio-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Swap Requests</p>
                  <p className="text-2xl font-bold text-amber-500">{mySwapRequests.length}</p>
                </div>
                <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Notifications</p>
                  <p className="text-2xl font-bold text-emerald-500">{unreadNotifications.length}</p>
                </div>
                <div className="bg-emerald-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.slice(0, 3).map((notification: any) => (
                <div key={notification.id} className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                  <div className="bg-emerald-500 rounded-full w-8 h-8 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                  </div>
                </div>
              ))}
              
              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PhysioLayout>
  );
}
