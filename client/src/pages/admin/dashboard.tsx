import { Users, Calendar, RefreshCw, Plus, Check, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users']
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['/api/schedules']
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['/api/swap-requests']
  });

  const pendingSwapRequests = swapRequests.filter((req: any) => req.status === 'pending');
  const activeUsers = users.filter((user: any) => user.isActive);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Overview of your physiotherapy clinic management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-3xl font-bold text-physio-blue">{activeUsers.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <Users className="h-6 w-6 text-physio-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Schedules</p>
                  <p className="text-3xl font-bold text-emerald-500">{schedules.length}</p>
                </div>
                <div className="bg-emerald-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Swaps</p>
                  <p className="text-3xl font-bold text-amber-500">{pendingSwapRequests.length}</p>
                </div>
                <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-amber-500" />
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
              {users.slice(0, 3).map((user: any) => (
                <div key={user.id} className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                  <div className="bg-physio-blue rounded-full w-8 h-8 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Staff member added</p>
                    <p className="text-xs text-gray-600">Dr. {user.firstName} {user.lastName} joined the team</p>
                  </div>
                </div>
              ))}
              
              {pendingSwapRequests.slice(0, 2).map((request: any) => (
                <div key={request.id} className="flex items-center space-x-4 p-3 bg-amber-50 rounded-lg">
                  <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Swap request submitted</p>
                    <p className="text-xs text-gray-600">A new shift swap request requires approval</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full bg-physio-blue hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Schedule
                </Button>
                <Button variant="outline" className="w-full border-physio-blue text-physio-blue hover:bg-physio-blue hover:text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Staff
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="text-sm text-emerald-500 font-medium">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notifications</span>
                  <span className="text-sm text-emerald-500 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Backup</span>
                  <span className="text-sm text-emerald-500 font-medium">Up to date</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
