import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Attendance } from './components/Attendance';
import { Payroll } from './components/Payroll';
import { LeaveHolidays } from './components/LeaveHolidays';
import { Announcements } from './components/Announcements';
import { RoleManagement } from './components/RoleManagement';
import { Settings } from './components/Settings';
import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { Leads } from './components/Leads';
import { CalendarView } from './components/CalendarView'; 
import { USERS, ATTENDANCE_MOCK, PAYROLL_MOCK, LEAVE_REQUESTS_MOCK, ANNOUNCEMENTS_MOCK, MESSAGES_MOCK, LEADS_MOCK, CALENDAR_EVENTS_MOCK, NAV_ITEMS, GROUPS_MOCK } from './constants';
import { UserRole, User } from './types';
import { Menu, Bell, Search, LogOut, FileText, User as UserIcon, Target, ChevronRight } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // App Configuration State (Theme & Company Info)
  const [theme, setTheme] = useState('indigo'); 
  const [companyName, setCompanyName] = useState('Teleexpro');

  // App Global State
  const [users, setUsers] = useState(USERS);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_MOCK);
  const [leaveRequests, setLeaveRequests] = useState(LEAVE_REQUESTS_MOCK);
  const [attendanceRecords, setAttendanceRecords] = useState(ATTENDANCE_MOCK);
  const [payrollEntries, setPayrollEntries] = useState(PAYROLL_MOCK);
  const [messages, setMessages] = useState(MESSAGES_MOCK);
  const [leads, setLeads] = useState(LEADS_MOCK);
  const [groups, setGroups] = useState(GROUPS_MOCK);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Authentication Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Search Logic
  useEffect(() => {
    if (!currentUser) return;
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    const results = [
      // Navigation
      ...NAV_ITEMS.filter(item => 
        item.roles.includes(currentUser.role) && item.label.toLowerCase().includes(query)
      ).map(item => ({ type: 'Page', id: item.id, title: item.label, sub: 'Navigation', icon: FileText })),

      // Users
      ...users.filter(u => 
        u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      ).map(u => ({ type: 'User', id: u.id, title: u.name, sub: u.role, icon: UserIcon })),

      // Leads
      ...leads.filter(l => 
        l.name.toLowerCase().includes(query) || l.email.toLowerCase().includes(query)
      ).map(l => ({ type: 'Lead', id: l.id, title: l.name, sub: l.status, icon: Target }))
    ];

    setSearchResults(results.slice(0, 8)); 
  }, [searchQuery, users, leads, currentUser]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (result: any) => {
    if (result.type === 'Page') {
      setActiveTab(result.id);
    } else if (result.type === 'User') {
      setActiveTab('chat');
    } else if (result.type === 'Lead') {
      setActiveTab('leads');
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  // If not logged in, render Login screen
  if (!currentUser) {
    return <Login onLogin={handleLogin} users={users} />;
  }

  // Define current role helper for cleaner code access
  const currentRole = currentUser.role;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  currentRole={currentRole} 
                  user={currentUser} 
                  users={users}
                  attendanceRecords={attendanceRecords}
                  payrollEntries={payrollEntries}
                  leaveRequests={leaveRequests}
               />;
      case 'attendance':
        return <Attendance 
                  records={attendanceRecords} 
                  setRecords={setAttendanceRecords}
                  role={currentRole} 
                  currentUser={currentUser}
                  users={users}
               />;
      case 'payroll':
        return <Payroll 
                  entries={payrollEntries} 
                  setEntries={setPayrollEntries}
                  role={currentRole} 
                  currentUser={currentUser}
                  users={users}
               />;
      case 'leave':
        return <LeaveHolidays 
                  requests={leaveRequests} 
                  role={currentRole} 
                  currentUserId={currentUser.id}
                  users={users}
                  setRequests={setLeaveRequests} 
                />;
      case 'calendar':
        return <CalendarView 
                  currentUser={currentUser}
                  users={users}
                  role={currentRole}
                  attendanceRecords={attendanceRecords}
                  leaveRequests={leaveRequests}
                  holidays={CALENDAR_EVENTS_MOCK} 
               />;
      case 'announcements':
        return <Announcements announcements={announcements} role={currentRole} setAnnouncements={setAnnouncements} />;
      case 'chat':
        return <Chat 
                  currentUser={currentUser} 
                  users={users} 
                  messages={messages} 
                  setMessages={setMessages}
                  groups={groups}
                  setGroups={setGroups}
               />;
      case 'leads':
        return <Leads 
                  leads={leads}
                  setLeads={setLeads}
                  users={users}
                  currentUser={currentUser}
               />;
      case 'roles':
        // Protected route: CEO, Admin, HR
        if (![UserRole.CEO, UserRole.ADMIN, UserRole.HR].includes(currentRole)) return <div className="text-center p-10 text-gray-500">Access Denied</div>;
        return <RoleManagement users={users} setUsers={setUsers} theme={theme} currentUserRole={currentRole} />;
      case 'settings':
        return <Settings 
                  role={currentRole} 
                  theme={theme} 
                  setTheme={setTheme} 
                  companyName={companyName}
                  setCompanyName={setCompanyName}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  users={users}
                  setUsers={setUsers}
               />;
      default:
        return <Dashboard 
                  currentRole={currentRole} 
                  user={currentUser} 
                  users={users}
                  attendanceRecords={attendanceRecords}
                  payrollEntries={payrollEntries}
                  leaveRequests={leaveRequests}
               />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar 
        currentRole={currentRole} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        theme={theme}
        companyName={companyName}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm relative">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-end md:justify-between items-center ml-4">
            {/* Search Bar */}
            <div className="relative hidden md:block w-full max-w-md" ref={searchRef}>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search pages, employees, leads..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showSearch && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((result, idx) => {
                          const Icon = result.icon;
                          return (
                            <button
                              key={`${result.type}-${result.id}-${idx}`}
                              onClick={() => handleSearchResultClick(result)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors group"
                            >
                              <div className={`p-2 rounded-lg ${
                                result.type === 'Page' ? 'bg-blue-100 text-blue-600' :
                                result.type === 'User' ? 'bg-purple-100 text-purple-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">{result.title}</p>
                                <p className="text-xs text-gray-500 capitalize">{result.type} • {result.sub}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button 
                  className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  onClick={() => setActiveTab('chat')}
                >
                    <Bell className="w-5 h-5" />
                    {messages.some(m => !m.read && m.receiverId === currentUser.id) && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                </button>
                <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                      onClick={() => setActiveTab('settings')}
                      title="Edit Profile"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.role}</p>
                        </div>
                        <div className={`w-9 h-9 rounded-full bg-${theme}-100 flex items-center justify-center overflow-hidden border border-${theme}-200 group-hover:ring-2 ring-${theme}-300 transition-all`}>
                            <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
             {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}