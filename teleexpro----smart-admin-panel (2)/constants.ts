
import { User, UserRole, AttendanceRecord, LeaveRequest, PayrollEntry, Announcement, CalendarEvent, Message, Lead, Group } from './types';
import { Home, Calendar, IndianRupee, Users, Bell, FileText, Settings, Clock, Briefcase, MessageSquare, Target } from 'lucide-react';

// Default Admin User for initial access
export const USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Admin', 
    role: UserRole.CEO, 
    email: 'admin@teleexpro.com', 
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff', 
    department: 'Administration',
    password: 'password'
  }
];

export const GROUPS_MOCK: Group[] = [];
export const ATTENDANCE_MOCK: AttendanceRecord[] = [];
export const PAYROLL_MOCK: PayrollEntry[] = [];
export const LEAVE_REQUESTS_MOCK: LeaveRequest[] = [];
export const ANNOUNCEMENTS_MOCK: Announcement[] = [];
export const CALENDAR_EVENTS_MOCK: CalendarEvent[] = [];
export const MESSAGES_MOCK: Message[] = [];
export const LEADS_MOCK: Lead[] = [];

// Helper to include all roles
const ALL_ROLES = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER, UserRole.HR, UserRole.TEAM_LEADER, UserRole.EXECUTIVE];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ALL_ROLES },
  { id: 'attendance', label: 'Attendance', icon: Clock, roles: ALL_ROLES },
  { id: 'leads', label: 'Leads', icon: Target, roles: ALL_ROLES },
  { id: 'calendar', label: 'Calendar', icon: Calendar, roles: ALL_ROLES },
  { id: 'payroll', label: 'Payroll', icon: IndianRupee, roles: ALL_ROLES },
  { id: 'leave', label: 'Leave/Holidays', icon: Briefcase, roles: ALL_ROLES },
  { id: 'announcements', label: 'Announcements', icon: Bell, roles: ALL_ROLES },
  { id: 'chat', label: 'Messages', icon: MessageSquare, roles: ALL_ROLES },
  { id: 'roles', label: 'User Roles', icon: Users, roles: [UserRole.CEO, UserRole.ADMIN, UserRole.HR] }, 
  { id: 'settings', label: 'Settings', icon: Settings, roles: ALL_ROLES },
];
