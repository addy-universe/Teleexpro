import React, { useEffect, useState } from 'react';
import { UserRole, User, AttendanceRecord, PayrollEntry, LeaveRequest } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, IndianRupee, Clock, CheckCircle, ShieldAlert } from 'lucide-react';
import { getDashboardInsights } from '../services/geminiService';

interface DashboardProps {
  currentRole: UserRole;
  user: User;
  users: User[];
  attendanceRecords: AttendanceRecord[];
  payrollEntries: PayrollEntry[];
  leaveRequests: LeaveRequest[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentRole, 
  user,
  users,
  attendanceRecords,
  payrollEntries,
  leaveRequests
}) => {
  const [insight, setInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Helper to determine if user has High Level Privileges (CEO, Admin, Manager, HR)
  const isManagement = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER, UserRole.HR].includes(currentRole);

  // --- Company Wide Stats (Restricted) ---
  const totalEmployees = users.length; 
  const totalPayroll = payrollEntries.reduce((acc, curr) => acc + curr.netSalary, 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const presentToday = attendanceRecords.filter(a => a.date === todayStr && a.status === 'Present').length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;

  // --- Personal Stats (Employee/TL View) ---
  const myPendingLeaves = leaveRequests.filter(l => l.userId === user.id && l.status === 'Pending').length;
  const myTodayRecord = attendanceRecords.find(a => a.userId === user.id && a.date === todayStr);
  const myStatus = myTodayRecord ? myTodayRecord.status : 'Absent';

  // Chart Data Preparation
  
  // 1. Weekly Attendance (Last 5 Days)
  const getWeeklyAttendance = () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const data = [];
      for (let i = 4; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = days[d.getDay()];
          
          // Count present for this day
          const presentCount = attendanceRecords.filter(a => a.date === dateStr && ['Present', 'Late', 'Half-Day'].includes(a.status)).length;
          // Assume absent is total employees minus present (simplification)
          const absentCount = Math.max(0, users.length - presentCount);
          
          data.push({ name: dayName, present: presentCount, absent: absentCount });
      }
      return data;
  };
  const attendanceData = getWeeklyAttendance();

  // 2. Payroll by Department
  const getPayrollByDept = () => {
      const deptMap: Record<string, number> = {};
      payrollEntries.forEach(p => {
          const u = users.find(user => user.id === p.userId);
          if (u && u.department) {
              deptMap[u.department] = (deptMap[u.department] || 0) + p.netSalary;
          }
      });
      return Object.keys(deptMap).map(dept => ({ name: dept, value: deptMap[dept] }));
  };
  
  const payrollDataRaw = getPayrollByDept();
  const payrollData = payrollDataRaw.length > 0 ? payrollDataRaw : [{ name: 'No Data', value: 1 }]; 
  const isPayrollEmpty = payrollDataRaw.length === 0;

  useEffect(() => {
    // Only Management gets AI insights
    if (isManagement && (presentToday > 0 || totalPayroll > 0)) {
      setLoadingInsight(true);
      const attendanceSummary = `Avg attendance calculated from ${attendanceRecords.length} records. ${presentToday} present today.`;
      const payrollSummary = `Total monthly payroll ₹${totalPayroll}.`;
      
      getDashboardInsights(attendanceSummary, payrollSummary)
        .then(setInsight)
        .catch(() => setInsight("Unable to load insights."))
        .finally(() => setLoadingInsight(false));
    } else {
        setInsight("Not enough data generated for AI insights.");
    }
  }, [isManagement, presentToday, totalPayroll, attendanceRecords.length]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
           <p className="text-gray-500">Welcome back, {user.name} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full uppercase ml-1">{currentRole}</span></p>
        </div>
        {isManagement && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-lg shadow-lg max-w-md hidden md:block">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80 flex items-center gap-1">
                    ✨ AI Executive Insight
                </p>
                <p className="text-sm font-medium">
                    {loadingInsight ? "Analyzing company data..." : insight}
                </p>
            </div>
        )}
      </div>

      {/* Statistics Section - Strictly Role Based */}
      {isManagement ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="blue" />
            <StatCard title="Total Payroll" value={`₹${totalPayroll.toLocaleString()}`} icon={IndianRupee} color="green" />
            <StatCard title="Present Today" value={presentToday} icon={CheckCircle} color="indigo" />
            <StatCard title="Pending Approvals" value={pendingLeaves} icon={Clock} color="orange" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="My Current Status" value={myStatus} icon={CheckCircle} color="indigo" />
            <StatCard title="My Pending Requests" value={myPendingLeaves} icon={Clock} color="orange" />
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100 flex items-center">
                <div className="p-3 rounded-full mr-4 bg-blue-100 text-blue-600">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Access Level</p>
                    <p className="text-sm font-bold text-gray-800">{currentRole}</p>
                    <p className="text-xs text-gray-400">Company stats are restricted.</p>
                </div>
            </div>
        </div>
      )}

      {/* Charts Section - Hidden for Employee/TL */}
      {isManagement ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Attendance Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payroll Distribution by Dept</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {payrollData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={isPayrollEmpty ? '#e5e7eb' : COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  {!isPayrollEmpty && <Tooltip />}
                </PieChart>
              </ResponsiveContainer>
              {isPayrollEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-medium">
                      No Data
                  </div>
              )}
            </div>
            <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
                {!isPayrollEmpty && payrollData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                        {d.name}
                    </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">My Recent Attendance</h3>
              <div className="space-y-3">
                  {attendanceRecords.filter(a => a.userId === user.id).slice(0, 5).map(record => (
                      <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">{record.date}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {record.status}
                          </span>
                      </div>
                  ))}
                  {attendanceRecords.filter(a => a.userId === user.id).length === 0 && <p className="text-gray-500 italic">No recent attendance records found.</p>}
              </div>
          </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`p-3 rounded-full mr-4 ${colorClasses[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};