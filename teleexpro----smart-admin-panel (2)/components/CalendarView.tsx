import React, { useState, useMemo } from 'react';
import { User, UserRole, AttendanceRecord, LeaveRequest, CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, User as UserIcon, Clock, Calendar as CalendarIcon, Filter, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  currentUser: User;
  users: User[];
  role: UserRole;
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays: CalendarEvent[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  currentUser, 
  users, 
  role, 
  attendanceRecords, 
  leaveRequests, 
  holidays 
}) => {
  // State for Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for Admin/CEO Selection (Defaults to current user)
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);

  // Access Control: 
  // - Executive & Team Leader: Can only view themselves.
  // - Others: Can view anyone.
  const canViewOthers = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER, UserRole.HR].includes(role);
  
  const targetUserId = canViewOthers ? selectedUserId : currentUser.id;
  const targetUser = users.find(u => u.id === targetUserId);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Helper to calculate work hours from logs
  const calculateHours = (record: AttendanceRecord) => {
      if (!record.activityLogs) return '0.0';
      let workMins = 0;
      record.activityLogs.forEach(log => {
          if (log.type === 'Work' && log.startTime) {
              const start = parseInt(log.startTime.split(':')[0]) * 60 + parseInt(log.startTime.split(':')[1]);
              // If no end time, assume current time if today, or skip if past day (incomplete data)
              // For simplicity in history, we rely on checkOut or last log end
              const endStr = log.endTime || record.checkOut; 
              if (endStr) {
                  const end = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
                  workMins += Math.max(0, end - start);
              }
          }
      });
      return (workMins / 60).toFixed(1);
  };

  // Generate Calendar Grid Data
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Padding for empty days before start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null });
    }

    // Actual Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // 1. Find Holiday
      const holiday = holidays.find(h => h.date === dateStr && h.type === 'Holiday');
      
      // 2. Find Leave
      const leave = leaveRequests.find(l => 
        l.userId === targetUserId && 
        l.status === 'Approved' && 
        dateStr >= l.startDate && 
        dateStr <= l.endDate
      );

      // 3. Find Attendance
      const attendance = attendanceRecords.find(a => a.userId === targetUserId && a.date === dateStr);
      
      let status = '';
      let hours = '0.0';
      let type = ''; // 'work', 'holiday', 'leave', 'absent', 'weekend'
      let info = '';

      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (holiday) {
          type = 'holiday';
          info = holiday.title;
      } else if (leave) {
          type = 'leave';
          status = leave.type;
          info = leave.reason;
      } else if (attendance) {
          type = 'work';
          status = attendance.status;
          hours = calculateHours(attendance);
          if (attendance.status === 'Half-Day') type = 'half-day';
          if (attendance.status === 'Absent') type = 'absent';
          if (attendance.status === 'Late') type = 'late';
      } else if (isWeekend) {
          type = 'weekend';
      } else {
          // If date is in the past and no record, it's Absent
          const today = new Date();
          const checkDate = new Date(year, month, d);
          if (checkDate < today && today.getDate() !== d) {
               type = 'absent';
               status = 'Absent';
          } else {
              type = 'future';
          }
      }

      days.push({ day: d, dateStr, type, status, hours, info });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, holidays, leaveRequests, attendanceRecords, targetUserId]);

  // Color mappings
  const getDayStyle = (type: string) => {
      switch (type) {
          case 'work': return 'bg-white border-green-200 hover:border-green-400';
          case 'late': return 'bg-white border-yellow-200 hover:border-yellow-400';
          case 'half-day': return 'bg-orange-50 border-orange-200';
          case 'absent': return 'bg-red-50 border-red-200';
          case 'leave': return 'bg-purple-50 border-purple-200';
          case 'holiday': return 'bg-blue-50 border-blue-200';
          case 'weekend': return 'bg-gray-50/50 border-transparent';
          case 'future': return 'bg-white border-gray-100 opacity-50';
          default: return 'bg-white border-gray-100';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Attendance Calendar</h2>
            <p className="text-sm text-gray-500">
                Viewing data for: <span className="font-semibold text-indigo-600">{targetUser?.name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              {/* Admin/CEO User Selection */}
              {canViewOthers && (
                  <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select 
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                      >
                          {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                      </select>
                  </div>
              )}

              {/* Month Navigation */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 border-r border-gray-200 text-gray-600">
                      <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 py-2 font-semibold text-gray-800 min-w-[140px] text-center">
                      {monthNames[month]} {year}
                  </div>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 border-l border-gray-200 text-gray-600">
                      <ChevronRight className="w-5 h-5" />
                  </button>
              </div>
              
              <button onClick={goToToday} className="px-3 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                  Today
              </button>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {d}
                  </div>
              ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
              {calendarDays.map((item, idx) => {
                  if (!item.day) return <div key={idx} className="bg-gray-50/30 min-h-[120px]"></div>;

                  const isToday = new Date().toDateString() === new Date(year, month, item.day).toDateString();

                  return (
                      <div 
                        key={idx} 
                        className={`min-h-[120px] p-3 border-b-0 relative transition-all group ${getDayStyle(item.type)}`}
                      >
                          {/* Date Number */}
                          <div className={`
                             text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full
                             ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700'}
                          `}>
                              {item.day}
                          </div>

                          {/* Content based on type */}
                          <div className="space-y-1.5">
                              {/* Work Hours */}
                              {(item.type === 'work' || item.type === 'late' || item.type === 'half-day') && (
                                  <>
                                    <div className={`text-xs font-bold flex items-center gap-1 ${item.type === 'late' ? 'text-yellow-700' : 'text-green-700'}`}>
                                        <Clock className="w-3 h-3" /> {item.hours}h
                                    </div>
                                    <div className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                        ${item.type === 'late' ? 'bg-yellow-100 text-yellow-800' : 
                                          item.type === 'half-day' ? 'bg-orange-100 text-orange-800' : 
                                          'bg-green-100 text-green-800'}
                                    `}>
                                        {item.status}
                                    </div>
                                  </>
                              )}

                              {/* Absence */}
                              {item.type === 'absent' && (
                                  <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Absent
                                  </div>
                              )}

                              {/* Leave */}
                              {item.type === 'leave' && (
                                  <div className="bg-purple-100 text-purple-700 p-1.5 rounded text-[10px] font-medium leading-tight">
                                      {item.status} Leave
                                  </div>
                              )}

                              {/* Holiday */}
                              {item.type === 'holiday' && (
                                  <div className="bg-blue-100 text-blue-700 p-1.5 rounded text-[10px] font-medium leading-tight">
                                      🎉 {item.info}
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> Present</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div> Late Login</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div> Half Day</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Absent</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div> On Leave</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div> Holiday</div>
      </div>
    </div>
  );
};