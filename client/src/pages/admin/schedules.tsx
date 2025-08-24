import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin-layout";

const scheduleFormSchema = z.object({
  userId: z.string().min(1, "Please select a staff member"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional()
});

export default function AdminSchedules() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['/api/schedules']
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users']
  });

  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      userId: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      notes: ""
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scheduleFormSchema>) => {
      await apiRequest('POST', '/api/schedules', {
        ...data,
        userId: parseInt(data.userId)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scheduleFormSchema>) => {
      await apiRequest('PUT', `/api/schedules/${editingSchedule.id}`, {
        ...data,
        userId: parseInt(data.userId)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
      setEditingSchedule(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      await apiRequest('DELETE', `/api/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: z.infer<typeof scheduleFormSchema>) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate(data);
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    form.setValue('userId', schedule.userId.toString());
    form.setValue('date', schedule.date);
    form.setValue('startTime', schedule.startTime);
    form.setValue('endTime', schedule.endTime);
    form.setValue('location', schedule.location || '');
    form.setValue('notes', schedule.notes || '');
  };

  const handleDelete = (scheduleId: number) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getScheduleForUserAndDate = (userId: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find((schedule: any) => 
      schedule.userId === userId && schedule.date === dateStr
    );
  };

  const physiotherapists = users.filter((user: any) => user.role === 'physiotherapist');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Schedule Management</h2>
            <p className="text-gray-600">Manage all staff schedules and assignments</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-physio-blue hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Schedule</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff Member</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a staff member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {physiotherapists.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                Dr. {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Main Clinic - Room 101" 
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createScheduleMutation.isPending}>
                      {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Schedule Modal */}
          <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Schedule</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff Member</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a staff member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {physiotherapists.map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                Dr. {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Main Clinic - Room 101" 
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setEditingSchedule(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateScheduleMutation.isPending}>
                      {updateScheduleMutation.isPending ? "Updating..." : "Update Schedule"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Weekly Schedule</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-gray-700">
                  {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 gap-2 text-sm min-w-[800px]">
                {/* Header */}
                <div className="font-medium text-gray-700 p-2"></div>
                {weekDates.map((date, index) => (
                  <div key={index} className="font-medium text-gray-700 p-2 text-center">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    <div className="text-xs text-gray-500">
                      {date.getDate()}
                    </div>
                  </div>
                ))}
                
                {/* Schedule rows */}
                {physiotherapists.map((user: any) => (
                  <div key={user.id} className="contents">
                    <div className="font-medium text-gray-700 p-2">
                      Dr. {user.firstName} {user.lastName}
                    </div>
                    {weekDates.map((date, dateIndex) => {
                      const schedule = getScheduleForUserAndDate(user.id, date);
                      
                      return (
                        <div key={dateIndex} className="p-2">
                          {schedule ? (
                            <div className="bg-physio-blue text-white rounded text-xs p-2 group relative hover:bg-blue-600 transition-colors">
                              <div className="text-center">
                                {schedule.startTime}-{schedule.endTime}
                                {schedule.location && (
                                  <div className="text-xs opacity-75 mt-1">
                                    {schedule.location}
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-white hover:bg-blue-600"
                                  onClick={() => handleEdit(schedule)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-white hover:bg-red-600"
                                  onClick={() => handleDelete(schedule.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-100 rounded text-xs text-center p-2 text-gray-500">
                              Off
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
