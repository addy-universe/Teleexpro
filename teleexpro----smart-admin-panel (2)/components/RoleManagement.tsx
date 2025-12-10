import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, User as UserIcon, UserPlus, X, Mail, Briefcase, UserCheck, Lock, Trash2, Edit2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

interface RoleManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  theme: string;
  currentUserRole: UserRole;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ users, setUsers, theme, currentUserRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: UserRole.EXECUTIVE
  });

  const resetForm = () => {
      setFormData({ name: '', email: '', password: '', department: '', role: UserRole.EXECUTIVE });
      setIsEditMode(false);
      setEditingUserId(null);
  };

  const handleOpenAdd = () => {
      resetForm();
      setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
      setFormData({
          name: user.name,
          email: user.email,
          password: user.password || '',
          department: user.department,
          role: user.role
      });
      setEditingUserId(user.id);
      setIsEditMode(true);
      setIsModalOpen(true);
  };

  const handleOpenPasswordReset = (user: User) => {
      setPasswordResetUser(user);
      setNewPassword('');
      setShowNewPassword(false);
      setIsPasswordModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editingUserId) {
        // Update existing user
        setUsers(prev => prev.map(u => u.id === editingUserId ? {
            ...u,
            name: formData.name,
            email: formData.email,
            department: formData.department,
            role: formData.role,
            password: formData.password || u.password // keep old password if not changed
        } : u));
    } else {
        // Create new user
        const id = `u${Date.now()}`;
        const user: User = {
            id,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            department: formData.department,
            password: formData.password || 'password', // Default if empty 
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random` 
        };
        setUsers(prev => [...prev, user]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleSavePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordResetUser || !newPassword.trim()) return;

      setUsers(prev => prev.map(u => u.id === passwordResetUser.id ? { ...u, password: newPassword } : u));
      
      alert(`Password for ${passwordResetUser.name} has been successfully updated.`);
      setIsPasswordModalOpen(false);
      setPasswordResetUser(null);
      setNewPassword('');
  };

  const handleDeleteUser = (userId: string) => {
      if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          setUsers(prev => prev.filter(u => u.id !== userId));
      }
  };

  // Access Control Logic
  const canManageUser = (targetUser: User) => {
      if (currentUserRole === UserRole.CEO) return true;
      if (currentUserRole === UserRole.ADMIN) {
          // Admin cannot manage CEO
          return targetUser.role !== UserRole.CEO;
      }
      if (currentUserRole === UserRole.HR) {
          // HR can manage Manager, TL, Executive
          return [UserRole.MANAGER, UserRole.TEAM_LEADER, UserRole.EXECUTIVE].includes(targetUser.role);
      }
      return false;
  };

  const availableRoles = [
      UserRole.EXECUTIVE,
      UserRole.TEAM_LEADER,
      UserRole.MANAGER,
      UserRole.HR,
      UserRole.ADMIN,
      UserRole.CEO
  ];

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h2 className="text-xl font-bold text-gray-800">User Roles & Permissions</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage employee accounts and access levels.</p>
               </div>
               <button 
                  onClick={handleOpenAdd}
                  className={`bg-${theme}-600 hover:bg-${theme}-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}
               >
                  <UserPlus className="w-4 h-4" /> Add User
               </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-4 font-medium">Employee</th>
                          <th className="px-6 py-4 font-medium">Email</th>
                          <th className="px-6 py-4 font-medium">Department</th>
                          <th className="px-6 py-4 font-medium">Current Role</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {users.map(user => {
                          const hasPermission = canManageUser(user);
                          // Prevent deleting the last CEO
                          const isLastCeo = user.role === UserRole.CEO && users.filter(u => u.role === UserRole.CEO).length <= 1;
                          
                          return (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-medium text-gray-900">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{user.department}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${user.role === UserRole.CEO ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                        ${user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : ''}
                                        ${user.role === UserRole.HR ? 'bg-pink-100 text-pink-700 border-pink-200' : ''}
                                        ${user.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                        ${user.role === UserRole.TEAM_LEADER ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                                        ${user.role === UserRole.EXECUTIVE ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                                    `}>
                                        {user.role === UserRole.CEO && <Shield className="w-3 h-3" />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleOpenPasswordReset(user)}
                                            disabled={!hasPermission}
                                            className={`p-1.5 rounded-lg transition-colors ${hasPermission ? 'text-gray-500 hover:bg-orange-50 hover:text-orange-600' : 'text-gray-300 cursor-not-allowed'}`}
                                            title="Change Password"
                                        >
                                            <KeyRound className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleOpenEdit(user)}
                                            disabled={!hasPermission}
                                            className={`p-1.5 rounded-lg transition-colors ${hasPermission ? 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600' : 'text-gray-300 cursor-not-allowed'}`}
                                            title="Edit User"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={!hasPermission || isLastCeo}
                                            className={`p-1.5 rounded-lg transition-colors ${hasPermission && !isLastCeo ? 'text-gray-500 hover:bg-red-50 hover:text-red-600' : 'text-gray-300 cursor-not-allowed'}`}
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`bg-${theme}-600 p-6 flex justify-between items-center text-white`}>
               <h3 className="text-xl font-bold flex items-center gap-2">
                 {isEditMode ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                 {isEditMode ? 'Edit User' : 'Add New User'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                 <div className="relative">
                   <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input 
                      required
                      type="text" 
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                      placeholder="e.g. Jane Smith"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input 
                      required
                      type="email" 
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                      placeholder="e.g. jane@company.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                   />
                 </div>
               </div>

               {/* Standard password field only for new users or editing structure, but we keep it here as per original design. 
                   The separate modal handles resets more explicitly. */}
               {!isEditMode && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                          required
                          type="password" 
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                       />
                     </div>
                   </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                   <div className="relative">
                     <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input 
                        required
                        type="text" 
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                        placeholder="e.g. Sales"
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                   <div className="relative">
                     <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <select 
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                     >
                        {availableRoles.map(role => (
                            <option 
                                key={role} 
                                value={role} 
                                disabled={
                                    // Restrict role assignment based on current user hierarchy
                                    (currentUserRole === UserRole.HR && (role === UserRole.CEO || role === UserRole.ADMIN || role === UserRole.HR)) ||
                                    (currentUserRole === UserRole.ADMIN && role === UserRole.CEO)
                                }
                            >
                                {role}
                            </option>
                        ))}
                     </select>
                   </div>
                 </div>
               </div>

               <div className="pt-4 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   className={`px-4 py-2 bg-${theme}-600 text-white rounded-lg font-medium hover:bg-${theme}-700 shadow-md shadow-${theme}-200 transition-all`}
                 >
                   {isEditMode ? 'Save Changes' : 'Create User'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isPasswordModalOpen && passwordResetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="bg-orange-500 p-6 flex justify-between items-center text-white">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <KeyRound className="w-5 h-5" /> Change Password
                      </h3>
                      <button onClick={() => setIsPasswordModalOpen(false)} className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <form onSubmit={handleSavePasswordReset} className="p-6 space-y-4">
                      <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-2 overflow-hidden border border-gray-200">
                                <img src={passwordResetUser.avatar} alt={passwordResetUser.name} className="w-full h-full object-cover" />
                          </div>
                          <h4 className="font-bold text-gray-800">{passwordResetUser.name}</h4>
                          <p className="text-xs text-gray-500">{passwordResetUser.role} • {passwordResetUser.email}</p>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                  required
                                  type={showNewPassword ? "text" : "password"}
                                  className="w-full pl-9 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-900"
                                  placeholder="Enter new password"
                                  value={newPassword}
                                  onChange={e => setNewPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                          </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsPasswordModalOpen(false)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit" 
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 shadow-md shadow-orange-200 transition-all"
                          >
                              Update Password
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </>
  );
};