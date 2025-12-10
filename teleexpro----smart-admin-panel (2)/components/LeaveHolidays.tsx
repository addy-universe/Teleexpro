import React, { useState } from 'react';
import { LeaveRequest, UserRole, User } from '../types';
import { CALENDAR_EVENTS_MOCK } from '../constants';
import { Check, X, Calendar as CalendarIcon, Plus, Filter, Shield } from 'lucide-react';

interface LeaveProps {
  requests: LeaveRequest[];
  role: UserRole;
  currentUserId: string;
  users: User[];
  setRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

export const LeaveHolidays: React.FC<LeaveProps> = ({ requests, role, currentUserId, users, setRequests }) => {
  const [showModal, setShowModal] = useState(false);
  
  const handleAction = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const holidays = CALENDAR_EVENTS_MOCK.filter(e => e.type === 'Holiday');

  // ACCESS LOGIC:
  // 1. Management (CEO, Admin, HR, Manager) can see all requests and approve.
  // 2. Others (TL, Executive) can only see their own.
  const isManagement = [UserRole.CEO, UserRole.ADMIN, UserRole.HR, UserRole.MANAGER].includes(role);
  
  const displayedRequests = isManagement 
    ? requests
    : requests.filter(req => req.userId === currentUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Main Leave Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Leave Management</h2>
                <p className="text-sm text-gray-500">
                    {isManagement ? 'All Employee Requests' : 'My Leave History'}
                </p>
            </div>
            {!isManagement && (
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Request
                </button>
            )}
            {isManagement && (
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-indigo-100">
                    <Shield className="w-3 h-3" /> Admin Access
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 font-medium">Employee</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Dates</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        {isManagement && <th className="px-6 py-4 font-medium">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayedRequests.length > 0 ? displayedRequests.map(req => {
                        const user = users.find(u => u.id === req.userId);
                        return (
                            <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400 max-w-[150px] truncate" title={req.reason}>{req.reason}</div>
                                </td>
                                <td className="px-6 py-4">{req.type}</td>
                                <td className="px-6 py-4">
                                    <div className="text-xs text-gray-500">From: {req.startDate}</div>
                                    <div className="text-xs text-gray-500">To: {req.endDate}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border
                                        ${req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                        ${req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                                        ${req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                                    `}>
                                        {req.status}
                                    </span>
                                </td>
                                {isManagement && (
                                    <td className="px-6 py-4">
                                        {req.status === 'Pending' ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleAction(req.id, 'Approved')} 
                                                    className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(req.id, 'Rejected')} 
                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                {req.status}
                                            </span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan={isManagement ? 5 : 4} className="px-6 py-8 text-center text-gray-400">
                                No leave requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
             </table>
        </div>
      </div>

      {/* Holidays Sidebar */}
      <div className="space-y-6">
         <h2 className="text-xl font-bold text-gray-800">Upcoming Holidays</h2>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="space-y-4">
                {holidays.length > 0 ? holidays.map(h => (
                    <div key={h.id} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{h.title}</p>
                            <p className="text-sm text-gray-500">{h.date}</p>
                        </div>
                    </div>
                )) : <div className="text-gray-400 text-sm">No upcoming holidays configured.</div>}
            </div>
         </div>
         
         <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-800">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2"><Filter className="w-4 h-4"/> Leave Policy</h3>
            <p className="text-xs opacity-80 leading-relaxed">
                Employees are entitled to 20 days of paid leave per year. Requests must be submitted at least 3 days in advance.
                Approvals are subject to manager review.
            </p>
         </div>
      </div>
      
      {/* Modal for New Request */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                        <h3 className="text-lg font-bold">Request Time Off</h3>
                        <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                          <select className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option>Vacation</option>
                              <option>Sick Leave</option>
                              <option>Personal</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                              <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                              <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                          <textarea className="w-full border border-gray-300 rounded-lg p-2.5 h-24 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Brief description..."></textarea>
                      </div>
                      <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
                          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                          <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200">Submit Request</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};