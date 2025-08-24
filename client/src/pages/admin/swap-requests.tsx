import { Check, X, RefreshCw, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin-layout";

export default function AdminSwapRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: swapRequests = [], isLoading } = useQuery({
    queryKey: ['/api/swap-requests']
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users']
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['/api/schedules']
  });

  const updateSwapRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminResponse }: { id: number; status: string; adminResponse?: string }) => {
      await apiRequest('PUT', `/api/swap-requests/${id}`, { status, adminResponse });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      toast({
        title: "Success",
        description: "Swap request updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update swap request",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (id: number) => {
    updateSwapRequestMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: number) => {
    updateSwapRequestMutation.mutate({ id, status: 'rejected' });
  };

  const getUserById = (id: number) => {
    return users.find((user: any) => user.id === id);
  };

  const getScheduleById = (id: number) => {
    return schedules.find((schedule: any) => schedule.id === id);
  };

  const pendingRequests = swapRequests.filter((request: any) => request.status === 'pending');

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-physio-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading swap requests...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Swap Requests</h2>
          <p className="text-gray-600">Review and approve shift swap requests</p>
        </div>

        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">There are no pending swap requests at this time.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request: any) => {
              const requester = getUserById(request.requesterId);
              const targetUser = getUserById(request.targetUserId);
              const requesterSchedule = getScheduleById(request.requesterScheduleId);
              const targetSchedule = getScheduleById(request.targetScheduleId);

              return (
                <Card key={request.id} className="border-l-4 border-amber-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {requester?.profileImageUrl ? (
                            <img 
                              src={requester.profileImageUrl} 
                              alt={`Dr. ${requester.firstName} ${requester.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              Dr. {requester?.firstName} {requester?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-700">
                            <strong>Requester's shift:</strong> {requesterSchedule?.date} ({requesterSchedule?.startTime}-{requesterSchedule?.endTime}) at {requesterSchedule?.location}
                          </p>
                          <p className="text-gray-700">
                            <strong>Swap type:</strong> {request.swapType === 'shift_to_shift' ? 'Shift exchange' : 'Coverage request (they have no duty)'}
                          </p>
                          <p className="text-gray-700">
                            <strong>Target colleague:</strong> Dr. {targetUser?.firstName} {targetUser?.lastName}
                          </p>
                          {request.swapType === 'shift_to_shift' && targetSchedule && (
                            <p className="text-gray-700">
                              <strong>Their shift:</strong> {targetSchedule.date} ({targetSchedule.startTime}-{targetSchedule.endTime}) at {targetSchedule.location}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handleApprove(request.id)}
                          disabled={updateSwapRequestMutation.isPending}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          disabled={updateSwapRequestMutation.isPending}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* All Requests History */}
        <Card>
          <CardHeader>
            <CardTitle>All Swap Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {swapRequests.map((request: any) => {
                const requester = getUserById(request.requesterId);
                const targetUser = getUserById(request.targetUserId);
                
                return (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        Dr. {requester?.firstName} {requester?.lastName} → Dr. {targetUser?.firstName} {targetUser?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.swapType === 'shift_to_shift' ? 'Shift exchange' : 'Coverage request'} • {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        request.status === 'approved' ? 'default' : 
                        request.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                      className={
                        request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        request.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''
                      }
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
