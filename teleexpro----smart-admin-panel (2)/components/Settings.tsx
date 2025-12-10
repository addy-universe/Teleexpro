import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { Palette, Building2, Save, User as UserIcon, RefreshCw, Camera, Upload, ShieldAlert } from 'lucide-react';

interface SettingsProps {
  role?: UserRole;
  theme?: string;
  setTheme?: (theme: string) => void;
  companyName?: string;
  setCompanyName?: (name: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  role, 
  theme = 'indigo', 
  setTheme = (_: string) => {}, 
  companyName = 'Teleexpro',
  setCompanyName = (_: string) => {},
  currentUser,
  setCurrentUser,
  users,
  setUsers
}) => {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  // Sync state if currentUser changes
  useEffect(() => {
    setName(currentUser.name);
    setAvatar(currentUser.avatar);
  }, [currentUser]);

  // Restrict modification for non-admin roles (Executive & Team Leader)
  const isRestricted = currentUser.role === UserRole.EXECUTIVE || currentUser.role === UserRole.TEAM_LEADER;

  const themes = [
    { id: 'indigo', name: 'Teleexpro Indigo', class: 'bg-indigo-600' },
    { id: 'blue', name: 'Ocean Blue', class: 'bg-blue-600' },
    { id: 'emerald', name: 'Forest Green', class: 'bg-emerald-600' },
    { id: 'rose', name: 'Crimson Red', class: 'bg-rose-600' },
    { id: 'violet', name: 'Royal Purple', class: 'bg-violet-600' },
    { id: 'amber', name: 'Sunset Orange', class: 'bg-amber-600' },
  ];

  const handleSaveProfile = () => {
    if (isRestricted) return; // double check

    const updatedUser = { ...currentUser, name, avatar };
    
    // Update local session
    setCurrentUser(updatedUser);

    // Update global user list
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    // Simple feedback
    const btn = document.getElementById('save-profile-btn');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Saved!';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('bg-green-600');
        }, 2000);
    }
  };

  const randomizeAvatar = () => {
      if (isRestricted) return;
      setAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRestricted) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      {isRestricted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 text-yellow-800">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                  <h4 className="font-bold text-sm">Account Modifications Restricted</h4>
                  <p className="text-sm opacity-90 mt-1">
                      Your role ({currentUser.role}) does not allow modifying profile details directly. Please contact HR or an Administrator for changes.
                  </p>
              </div>
          </div>
      )}

      {/* CEO Only - Company Branding */}
      {role === UserRole.CEO && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`p-6 border-b border-gray-100 bg-gradient-to-r from-${theme}-50 to-white`}>
             <h3 className={`text-lg font-bold flex items-center gap-2 text-${theme}-900`}>
                <Building2 className={`w-5 h-5 text-${theme}-600`} /> Company Branding
             </h3>
             <p className="text-sm text-gray-500 mt-1">Customize the look and feel of your admin panel.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
               <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" 
               />
               <p className="text-xs text-gray-400 mt-1">This will be displayed in the sidebar and login screen.</p>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                 <Palette className="w-4 h-4" /> Theme Color
               </label>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`
                        group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                        ${theme === t.id ? `border-${t.id}-600 bg-${t.id}-50` : 'border-transparent hover:bg-gray-50'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full ${t.class} shadow-sm group-hover:scale-110 transition-transform`}></div>
                      <span className={`text-xs font-medium ${theme === t.id ? 'text-gray-900' : 'text-gray-500'}`}>{t.name}</span>
                      {theme === t.id && (
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${t.id}-600`}></div>
                      )}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800">Profile Settings</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-3">
                <div className={`relative group ${isRestricted ? 'opacity-70 pointer-events-none' : ''}`}>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm bg-gray-50">
                        <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    {!isRestricted && (
                        <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all flex items-center justify-center cursor-pointer">
                            <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                    )}
                </div>
                
                {!isRestricted && (
                    <div className="flex flex-col gap-2 items-center w-full">
                         <label className="cursor-pointer text-xs font-medium text-gray-700 hover:text-indigo-600 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors w-full justify-center">
                            <Upload className="w-3 h-3" /> Upload Photo
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>

                        <button 
                            onClick={randomizeAvatar}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors w-full justify-center"
                        >
                            <RefreshCw className="w-3 h-3" /> Randomize
                        </button>
                    </div>
                )}
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            className={`w-full border border-gray-300 rounded-lg p-2.5 outline-none transition-all text-gray-900 ${isRestricted ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isRestricted}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" 
                            value={currentUser.email}
                            disabled 
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                    <input 
                        type="text" 
                        className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none text-gray-900 ${isRestricted ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-500'}`}
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        disabled={isRestricted}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select 
                        disabled={isRestricted}
                        className={`w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 ${isRestricted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                        <option>English (US)</option>
                        <option>Spanish</option>
                        <option>French</option>
                    </select>
                </div>

                {!isRestricted && (
                    <div className="pt-4 flex justify-end">
                        <button 
                            id="save-profile-btn"
                            onClick={handleSaveProfile}
                            className={`bg-${theme}-600 text-white px-6 py-2.5 rounded-lg hover:bg-${theme}-700 flex items-center gap-2 shadow-lg shadow-${theme}-200 transition-all font-medium`}
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {!isRestricted && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="border border-red-500 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Delete Account</button>
        </div>
      )}
    </div>
  );
};