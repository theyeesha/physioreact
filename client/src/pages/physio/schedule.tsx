import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import PhysioLayout from "@/components/physio-layout";

export default function PhysioSchedule() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ['/api/schedules/user', user?.id],
    enabled: !!user?.id
  });

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

  const getScheduleForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find((schedule: any) => schedule.date === dateStr);
  };

  const thisWeekSchedules = schedules.filter((schedule: any) => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate >= weekStart && scheduleDate <= weekEnd;
  });

  const totalHours = thisWeekSchedules.reduce((total: number, schedule: any) => {
    const start = new Date(`2000-01-01T${schedule.startTime}`);
    const end = new Date(`2000-01-01T${schedule.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  const workingDays = thisWeekSchedules.length;
  const daysOff = 7 - workingDays;

  return (
    <PhysioLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">My Schedule</h2>
          <p className="text-gray-600">View your assigned schedules and shifts</p>
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
            <div className="grid grid-cols-7 gap-4 mb-6">
              {weekDates.map((date, index) => {
                const schedule = getScheduleForDate(date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      {dayName}
                      <div className="text-xs text-gray-500">{date.getDate()}</div>
                    </div>
                    <div className="min-h-[80px]">
                      {schedule ? (
                        <div 
                          className="bg-physio-blue text-white rounded-lg p-4 text-sm cursor-pointer hover:bg-blue-600 transition-colors"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <div className="font-medium">{schedule.startTime}-{schedule.endTime}</div>
                          <div className="text-xs opacity-75">
                            {schedule.location ? schedule.location : 'Full Shift'}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-500 rounded-lg p-4 text-sm">
                          <div className="font-medium">Off</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-6">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Schedule Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-physio-blue bg-opacity-10 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Hours</div>
                  <div className="text-2xl font-bold text-physio-blue">{totalHours}</div>
                </div>
                <div className="bg-emerald-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Working Days</div>
                  <div className="text-2xl font-bold text-emerald-600">{workingDays}</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Days Off</div>
                  <div className="text-2xl font-bold text-gray-600">{daysOff}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Detail Modal */}
        <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Details</DialogTitle>
            </DialogHeader>
            {selectedSchedule && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-physio-blue rounded-full w-10 h-10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {new Date(selectedSchedule.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">Work Schedule</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Shift Time</p>
                      <p className="text-sm text-gray-600">
                        {selectedSchedule.startTime} - {selectedSchedule.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-physio-blue" />
                    <div>
                      <p className="font-medium text-physio-blue">Location</p>
                      <p className="text-sm text-gray-800 font-semibold">{selectedSchedule.location || 'Not specified'}</p>
                    </div>
                  </div>

                  {selectedSchedule.notes && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">Notes</p>
                        <p className="text-sm text-gray-600">{selectedSchedule.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Status</p>
                      <p className="text-sm text-green-600">Scheduled</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <Badge variant="secondary" className="bg-physio-blue text-white">
                      {(() => {
                        const start = new Date(`2000-01-01T${selectedSchedule.startTime}`);
                        const end = new Date(`2000-01-01T${selectedSchedule.endTime}`);
                        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        return `${hours} hours`;
                      })()}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                    Close
                  </Button>
                  <Button className="bg-physio-blue hover:bg-blue-700">
                    Request Swap
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PhysioLayout>
  );
}
