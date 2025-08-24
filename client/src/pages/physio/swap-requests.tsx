import { useState } from "react";
import { Send, RefreshCw, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PhysioLayout from "@/components/physio-layout";

export default function PhysioSwapRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    requesterScheduleId: '',
    targetUserId: '',
    targetScheduleId: '',
    swapType: 'shift_to_shift', // Default to shift-to-shift swap
    reason: ''
  });

  const { data: mySchedules = [] } = useQuery({
    queryKey: ['/api/schedules/user', user?.id],
    enabled: !!user?.id
  });

  const { data: colleagues = [] } = useQuery({
    queryKey: ['/api/users/colleagues']
  });

  const { data: allSchedules = [] } = useQuery({
    queryKey: ['/api/schedules']
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['/api/swap-requests'],
    enabled: !!user?.id
  });

  const createSwapRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/swap-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      toast({
        title: "Success",
        description: "Swap request submitted successfully",
      });
      setFormData({
        requesterScheduleId: '',
        targetUserId: '',
        targetScheduleId: '',
        swapType: 'shift_to_shift',
        reason: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit swap request",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.requesterScheduleId || !formData.targetUserId || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // For shift-to-shift swaps, target schedule is required
    if (formData.swapType === 'shift_to_shift' && !formData.targetScheduleId) {
      toast({
        title: "Error",
        description: "Please select a target shift for shift-to-shift swaps",
        variant: "destructive",
      });
      return;
    }
    
    const requestData: any = {
      requesterScheduleId: parseInt(formData.requesterScheduleId),
      targetUserId: parseInt(formData.targetUserId),
      swapType: formData.swapType,
      reason: formData.reason
    };
    
    // Only include targetScheduleId for shift-to-shift swaps
    if (formData.swapType === 'shift_to_shift' && formData.targetScheduleId) {
      requestData.targetScheduleId = parseInt(formData.targetScheduleId);
    }
    
    createSwapRequestMutation.mutate(requestData);
  };

  // Use the colleagues from the dedicated endpoint
  const physiotherapists = colleagues;
  
  // Filter target user schedules to exclude past dates and already requested swaps
  const targetUserSchedules = formData.targetUserId 
    ? allSchedules.filter((s: any) => {
        const isTargetUser = s.userId === parseInt(formData.targetUserId);
        const scheduleDate = new Date(s.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isFuture = scheduleDate >= today;
        
        // Check if this schedule is already part of a pending swap request
        const isAlreadyRequested = swapRequests.some((request: any) => 
          request.targetScheduleId === s.id && request.status === 'pending'
        );
        
        return isTargetUser && isFuture && !isAlreadyRequested;
      })
    : [];

  const mySwapRequests = swapRequests.filter((request: any) => request.requesterId === user?.id);

  const getUserById = (id: number) => {
    return colleagues.find((u: any) => u.id === id);
  };

  const getScheduleById = (id: number) => {
    return allSchedules.find((s: any) => s.id === id);
  };

  return (
    <PhysioLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Swap</h2>
          <p className="text-gray-600">Request to swap your shift with another physiotherapist</p>
        </div>

        {/* New Swap Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Swap Request</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Only future shifts and colleagues with available schedules are shown
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="requesterSchedule">Your Shift to Swap</Label>
                  <Select
                    value={formData.requesterScheduleId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, requesterScheduleId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {mySchedules.filter((schedule: any) => {
                        const scheduleDate = new Date(schedule.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isFuture = scheduleDate >= today;
                        
                        // Check if this schedule is already part of a pending swap request
                        const isAlreadyRequested = swapRequests.some((request: any) => 
                          request.requesterScheduleId === schedule.id && request.status === 'pending'
                        );
                        
                        return isFuture && !isAlreadyRequested;
                      }).map((schedule: any) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          {schedule.date} - {schedule.startTime} to {schedule.endTime} ({schedule.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetUser">Swap With</Label>
                  <Select
                    value={formData.targetUserId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetUserId: value, targetScheduleId: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select colleague" />
                    </SelectTrigger>
                    <SelectContent>
                      {physiotherapists.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">
                          No colleagues available
                        </div>
                      ) : (
                        physiotherapists.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            Dr. {user.firstName} {user.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="swapType">Swap Type</Label>
                <Select
                  value={formData.swapType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, swapType: value, targetScheduleId: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select swap type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift_to_shift">Swap with their existing shift</SelectItem>
                    <SelectItem value="shift_to_open">Request they cover my shift (they have no duty that day)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.swapType === 'shift_to_shift' 
                    ? 'Both staff will exchange their scheduled shifts'
                    : 'The colleague will cover your shift, and you will have that day off'
                  }
                </p>
              </div>

              {formData.swapType === 'shift_to_shift' && (
                <div>
                  <Label htmlFor="targetSchedule">Their Shift to Swap With</Label>
                  <Select
                    value={formData.targetScheduleId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetScheduleId: value }))}
                    disabled={!formData.targetUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select their shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetUserSchedules.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">
                          {formData.targetUserId ? "No available shifts for this colleague" : "Select a colleague first"}
                        </div>
                      ) : (
                        targetUserSchedules.map((schedule: any) => (
                          <SelectItem key={schedule.id} value={schedule.id.toString()}>
                            {schedule.date} - {schedule.startTime} to {schedule.endTime} ({schedule.location})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reason for Swap</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for the swap request..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="bg-physio-blue hover:bg-blue-700"
                disabled={createSwapRequestMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {createSwapRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Swap Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mySwapRequests.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Swap Requests</h3>
                  <p className="text-gray-600">You haven't submitted any swap requests yet.</p>
                </div>
              ) : (
                mySwapRequests.map((request: any) => {
                  const targetUser = getUserById(request.targetUserId);
                  const requesterSchedule = getScheduleById(request.requesterScheduleId);
                  const targetSchedule = getScheduleById(request.targetScheduleId);

                  return (
                    <div key={request.id} className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {targetUser?.profileImageUrl ? (
                              <img 
                                src={targetUser.profileImageUrl} 
                                alt={`Dr. ${targetUser.firstName} ${targetUser.lastName}`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">
                                Swap with Dr. {targetUser?.firstName} {targetUser?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Requested {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <p className="text-sm text-gray-700">
                              <strong>Your shift:</strong> {requesterSchedule?.date} ({requesterSchedule?.startTime}-{requesterSchedule?.endTime}) at {requesterSchedule?.location}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Swap type:</strong> {request.swapType === 'shift_to_shift' ? 'Shift exchange' : 'Coverage request (they have no duty)'}
                            </p>
                            {request.swapType === 'shift_to_shift' && targetSchedule && (
                              <p className="text-sm text-gray-700">
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
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PhysioLayout>
  );
}
