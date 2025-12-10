
export enum UserRole {
  CEO = 'CEO',
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  HR = 'HR',
  TEAM_LEADER = 'Team Leader',
  EXECUTIVE = 'Executive',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  department: string;
  password?: string;
}

export interface ActivityLog {
  id: string;
  type: 'Work' | 'Bio Break' | 'Lunch Break' | 'Meeting';
  startTime: string;
  endTime?: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day';
  activityLogs?: ActivityLog[];
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'Sick' | 'Vacation' | 'Personal';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

export interface PayrollEntry {
  id: string;
  userId: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  month: string;
  status: 'Paid' | 'Processing';
  customSlip?: string; // Base64 string for file
  fileName?: string;   // Name of the uploaded file
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'High' | 'Normal' | 'Low';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'Meeting' | 'Holiday' | 'Deadline';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  // New fields for attachments
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // Array of user IDs
  createdBy: string;
  avatar?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Converted' | 'Lost';
  assignedTo: string; // userId
  createdAt: string;
  notes?: string;
}