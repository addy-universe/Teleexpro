import React, { useState, useEffect } from 'react';
import { AttendanceRecord, User, UserRole, ActivityLog } from '../types';
import { MapPin, Clock, LogIn, LogOut, CheckCircle, Coffee, Users, Play, PauseCircle, Download, Utensils, AlertCircle, Timer } from 'lucide-react';

interface AttendanceProps {
  records: AttendanceRecord[];
  role: UserRole;
  currentUser: User;
  users: User[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export const Attendance: React.FC<AttendanceProps> = ({ records, role, currentUser, users, setRecords }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter records based on role
  const isManagement = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER, UserRole.HR].includes(role);

  const displayRecords = isManagement 
    ? records
    : records.filter(r => r.userId === currentUser.id);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  // Logic for Punch In/Out
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(r => r.userId === currentUser.id && r.date === todayStr);

  // Determine current status based on the last activity log
  const lastActivity = todayRecord?.activityLogs?.[todayRecord.activityLogs.length - 1];
  const currentStatus = todayRecord?.checkOut 
    ? 'Completed' 
    : lastActivity?.endTime === null || lastActivity?.endTime === undefined 
        ? lastActivity?.type || 'Work' // Default to 'Work' if no logs but checked in
        : 'Idle'; 

  // Helper to convert HH:MM to minutes
  const getMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Calculate Real-time Stats
  const calculateStats = (record: AttendanceRecord | undefined) => {
    if (!record || !record.activityLogs) return { workHours: 0, breakHours: 0, overtime: 0, totalLoginHours: 0 };

    let workMins = 0;
    let breakMins = 0;
    
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    record.activityLogs.forEach(log => {
        const start = getMinutes(log.startTime);
        const end = log.endTime ? getMinutes(log.endTime) : currentMins;
        const diff = Math.max(0, end - start);

        if (log.type === 'Work') {
            workMins += diff;
        } else {
            // Bio Break, Lunch Break, Meeting all count as Breaks for calculation
            breakMins += diff;
        }
    });

    const workHours = workMins / 60;
    const breakHours = breakMins / 60;
    const totalLoginHours = (workMins + breakMins) / 60;
    
    // Overtime logic: If total working hours exceed 9 hours
    const overtime = Math.max(0, workHours - 9);

    return { 
        workHours, 
        breakHours, 
        overtime,
        totalLoginHours
    };
  };

  const stats = calculateStats(todayRecord);

  const handlePunchIn = () => {
      const timeStr = new Date().toTimeString().slice(0, 5); // HH:MM
      const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          userId: currentUser.id,
          date: todayStr,
          checkIn: timeStr,
          checkOut: null,
          status: 'Present', // Default, will update on checkout
          activityLogs: [{
              id: Date.now().toString(),
              type: 'Work',
              startTime: timeStr,
              endTime: null
          }]
      };
      setRecords(prev => [newRecord, ...prev]);
  };

  const handleStateChange = (newType: 'Work' | 'Bio Break' | 'Lunch Break' | 'Meeting') => {
    if (!todayRecord) return;
    const timeStr = new Date().toTimeString().slice(0, 5); // HH:MM

    setRecords(prev => prev.map(r => {
        if (r.id === todayRecord.id) {
            const logs = r.activityLogs ? [...r.activityLogs] : [];
            
            // Close the last log if it exists and isn't closed
            if (logs.length > 0 && !logs[logs.length - 1].endTime) {
                logs[logs.length - 1].endTime = timeStr;
            } else if (logs.length === 0 && r.checkIn) {
                logs.push({
                    id: 'legacy-init',
                    type: 'Work',
                    startTime: r.checkIn,
                    endTime: timeStr
                });
            }

            // Start new log
            logs.push({
                id: Date.now().toString(),
                type: newType,
                startTime: timeStr,
                endTime: null
            });

            return { ...r, activityLogs: logs };
        }
        return r;
    }));
  };

  const handlePunchOut = () => {
      if (!todayRecord) return;
      const timeStr = new Date().toTimeString().slice(0, 5); // HH:MM
      
      setRecords(prev => prev.map(r => {
          if (r.id === todayRecord.id) {
               const logs = r.activityLogs ? [...r.activityLogs] : [];
               // Close last log
               if (logs.length > 0 && !logs[logs.length - 1].endTime) {
                   logs[logs.length - 1].endTime = timeStr;
               }

               // Recalculate stats with finalized logs (simulated locally for status logic)
               let workMins = 0;
               logs.forEach(log => {
                   const start = getMinutes(log.startTime);
                   const end = log.endTime ? getMinutes(log.endTime) : getMinutes(timeStr);
                   const diff = Math.max(0, end - start);
                   if (log.type === 'Work') workMins += diff;
               });
               const workHours = workMins / 60;

               // Determine Status based on Logic
               let status: 'Present' | 'Half-Day' | 'Absent' = 'Absent';
               
               if (workHours >= 9) {
                   status = 'Present';
               } else if (workHours >= 5) {
                   status = 'Half-Day';
               } else {
                   status = 'Absent'; // Below minimum hours
               }

              return { ...r, checkOut: timeStr, activityLogs: logs, status: status };
          }
          return r;
      }));
  };

  const exportReport = () => {
    // CSV Header
    const headers = ['Employee Name', 'Date', 'Check In', 'Check Out', 'Status', 'Work Duration (Hours)', 'Break Duration (Hours)'];
    
    // CSV Rows
    const rows = displayRecords.map(record => {
      const userName = getUserName(record.userId);
      
      // Calculate specific record stats
      let workMins = 0;
      let breakMins = 0;
      record.activityLogs?.forEach(log => {
          if(log.startTime && log.endTime) {
            const start = getMinutes(log.startTime);
            const end = getMinutes(log.endTime);
            const diff = Math.max(0, end - start);
            if(log.type === 'Work') workMins += diff;
            else breakMins += diff;
          }
      });

      return [
        `"${userName}"`,
        record.date,
        record.checkIn,
        record.checkOut || 'N/A',
        record.status,
        (workMins/60).toFixed(2),
        (breakMins/60).toFixed(2)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Teleexpro_Attendance_Report_${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Employee Punch Card System - Hide for CEO */}
      {role !== UserRole.CEO && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                <div className="w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Mark Attendance</h2>
                            <p className="text-indigo-100 opacity-90 mb-4">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-mono text-xl font-semibold tracking-wider">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    
                    {/* Live Stats Display */}
                    {todayRecord && !todayRecord.checkOut && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-white/10 p-4 rounded-xl border border-white/10">
                                <div>
                                    <p className="text-xs uppercase opacity-70 mb-1">Work Hours</p>
                                    <p className="text-xl font-bold">{stats.workHours.toFixed(2)} hrs</p>
                                    <p className="text-[10px] opacity-60">Target: 9.0 hrs</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase opacity-70 mb-1">Break Time</p>
                                    <p className={`text-xl font-bold ${stats.breakHours > 2 ? 'text-red-300' : ''}`}>{stats.breakHours.toFixed(2)} hrs</p>
                                    <p className="text-[10px] opacity-60">Max: 2.0 hrs</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase opacity-70 mb-1">Overtime</p>
                                    <p className="text-xl font-bold text-green-300">{stats.overtime.toFixed(2)} hrs</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase opacity-70 mb-1">Total Login</p>
                                    <p className="text-xl font-bold">{stats.totalLoginHours.toFixed(2)} hrs</p>
                                </div>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                            <div className={`
                                backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors
                                ${currentStatus === 'Work' ? 'bg-green-400/30 text-green-50 border border-green-400/30' : ''}
                                ${['Bio Break', 'Lunch Break', 'Meeting'].includes(currentStatus) ? 'bg-yellow-400/30 text-yellow-50 border border-yellow-400/30' : ''}
                                ${currentStatus === 'Completed' || !todayRecord ? 'bg-white/20' : ''}
                            `}>
                            {currentStatus === 'Work' && <MapPin className="w-4 h-4 animate-pulse" />}
                            {(currentStatus === 'Bio Break' || currentStatus === 'Lunch Break') && <Coffee className="w-4 h-4 animate-bounce" />}
                            {currentStatus === 'Meeting' && <Users className="w-4 h-4" />}
                            {currentStatus === 'Completed' ? 'Day Completed' : !todayRecord ? 'Ready to Start' : `${currentStatus}`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center">
                    {!todayRecord ? (
                        <button 
                            onClick={handlePunchIn}
                            className="group relative flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-xl hover:scale-105 transition-transform duration-200 cursor-pointer text-indigo-600"
                        >
                            <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping"></div>
                            <div className="flex flex-col items-center">
                                <LogIn className="w-8 h-8 mb-1" />
                                <span className="font-bold">Punch In</span>
                            </div>
                        </button>
                    ) : !todayRecord.checkOut ? (
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full border border-white/20">
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                {currentStatus === 'Work' ? (
                                    <>
                                        <button 
                                            onClick={() => handleStateChange('Bio Break')}
                                            className="bg-yellow-500/80 hover:bg-yellow-500 text-white px-3 py-3 rounded-lg font-semibold transition-colors flex flex-col items-center justify-center gap-1 text-xs"
                                        >
                                            <Coffee className="w-5 h-5" /> Bio Break
                                        </button>
                                        <button 
                                            onClick={() => handleStateChange('Lunch Break')}
                                            className="bg-orange-500/80 hover:bg-orange-500 text-white px-3 py-3 rounded-lg font-semibold transition-colors flex flex-col items-center justify-center gap-1 text-xs"
                                        >
                                            <Utensils className="w-5 h-5" /> Lunch
                                        </button>
                                        <button 
                                            onClick={() => handleStateChange('Meeting')}
                                            className="bg-blue-500/80 hover:bg-blue-500 text-white px-3 py-3 rounded-lg font-semibold transition-colors flex flex-col items-center justify-center gap-1 text-xs"
                                        >
                                            <Users className="w-5 h-5" /> Meeting
                                        </button>
                                        <button 
                                            onClick={handlePunchOut}
                                            className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-3 rounded-lg font-bold shadow-md transition-colors flex flex-col items-center justify-center gap-1 text-xs"
                                        >
                                            <LogOut className="w-5 h-5" /> Punch Out
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => handleStateChange('Work')}
                                        className="col-span-4 bg-green-500 hover:bg-green-600 text-white px-4 py-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg animate-pulse"
                                    >
                                        <Play className="w-5 h-5 fill-current" /> Resume Work
                                    </button>
                                )}
                                </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center bg-white/10 p-6 rounded-xl border border-white/20 w-full max-w-md">
                            <CheckCircle className="w-12 h-12 text-green-300 mb-2" />
                            <h3 className="font-bold text-xl">Work Day Complete</h3>
                            <div className="mt-4 grid grid-cols-2 gap-4 w-full text-center">
                                <div className="bg-white/10 p-2 rounded">
                                    <p className="text-xs opacity-70">Total Login</p>
                                    <p className="font-bold">{stats.totalLoginHours.toFixed(2)} hrs</p>
                                </div>
                                <div className="bg-white/10 p-2 rounded">
                                    <p className="text-xs opacity-70">Work Done</p>
                                    <p className="font-bold">{stats.workHours.toFixed(2)} hrs</p>
                                </div>
                            </div>
                            
                            {stats.workHours < 5 && (
                                <div className="mt-4 text-xs bg-red-500/30 p-2 rounded w-full flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Below Minimum Hours (5h)
                                </div>
                            )}
                        </div>
                    )}
            </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
              {isManagement ? "All Employee Records" : "My Attendance History"}
          </h2>
          {isManagement && (
              <button 
                onClick={exportReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                  <Download className="w-4 h-4" /> Export Report
              </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-100">
              <tr>
                {isManagement && <th className="px-6 py-4">Employee</th>}
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Work Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.map((record) => {
                  let workMins = 0;
                  record.activityLogs?.forEach(log => {
                      if(log.startTime && log.endTime) {
                          const start = getMinutes(log.startTime);
                          const end = getMinutes(log.endTime);
                          if(log.type === 'Work') workMins += Math.max(0, end - start);
                      }
                  });
                  const recordWorkHours = (workMins / 60).toFixed(2);
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      {isManagement && (
                          <td className="px-6 py-4 font-medium text-gray-900">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                      {getUserName(record.userId).charAt(0)}
                                  </div>
                                  {getUserName(record.userId)}
                              </div>
                          </td>
                      )}
                      <td className="px-6 py-4">{record.date}</td>
                      <td className="px-6 py-4">{record.checkIn}</td>
                      <td className="px-6 py-4">{record.checkOut || '--:--'}</td>
                      <td className="px-6 py-4 font-mono font-medium">{record.checkOut ? recordWorkHours : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${record.status === 'Present' ? 'bg-green-100 text-green-700' : ''}
                          ${record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${record.status === 'Absent' ? 'bg-red-100 text-red-700' : ''}
                          ${record.status === 'Half-Day' ? 'bg-orange-100 text-orange-700' : ''}
                        `}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
              })}
              {displayRecords.length === 0 && (
                  <tr>
                      <td colSpan={isManagement ? 6 : 5} className="px-6 py-8 text-center text-gray-400">
                          No attendance records found.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};