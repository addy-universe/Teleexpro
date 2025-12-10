import React, { useState, useEffect, useRef } from 'react';
import { User, Message, UserRole, Group } from '../types';
import { Send, Search, MoreVertical, Phone, Video, Smile, PhoneOff, Mic, MicOff, VideoOff, Trash2, UserX, UserCheck, User as UserIcon, X, Shield, Mail, Briefcase, Plus, Users, CheckSquare, Square, Info, UserPlus, UserMinus, LogOut, Paperclip, Image as ImageIcon, FileText, Check, CheckCheck, ArrowDown, Download } from 'lucide-react';

interface ChatProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
}

export const Chat: React.FC<ChatProps> = ({ currentUser, users, messages, setMessages, groups, setGroups }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sidebar Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'direct'>('all');

  // Attachment State
  const [attachment, setAttachment] = useState<{ type: 'image' | 'file', url: string, name: string } | null>(null);

  // Group Creation State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Group Management State
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Call & UI State
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  // Logic State
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Derived Values
  const selectedUser = users.find(u => u.id === selectedChatId);
  const selectedGroup = groups.find(g => g.id === selectedChatId);
  const isBlocked = selectedChatId ? blockedUsers.includes(selectedChatId) : false;

  // --- Permission Helpers ---
  const canCreateGroup = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);
  
  const getRoleHierarchy = (role: UserRole) => {
      switch (role) {
          case UserRole.CEO: return 6;
          case UserRole.MANAGER: return 5;
          case UserRole.ADMIN: return 4;
          case UserRole.HR: return 3;
          case UserRole.TEAM_LEADER: return 2;
          case UserRole.EXECUTIVE: return 1;
          default: return 0;
      }
  };

  const canDeleteGroup = (group: Group) => {
    // CEO and Manager can delete ANY group
    if ([UserRole.CEO, UserRole.MANAGER].includes(currentUser.role)) return true;
    
    // Creator can delete their own group
    if (group.createdBy === currentUser.id) return true;

    // Admin specific rule
    if (currentUser.role === UserRole.ADMIN) {
        const creator = users.find(u => u.id === group.createdBy);
        if (!creator) return true; // Creator deleted, allow admin to cleanup
        
        const creatorLevel = getRoleHierarchy(creator.role);
        const adminLevel = getRoleHierarchy(UserRole.ADMIN);
        return creatorLevel <= adminLevel;
    }

    return false;
  };

  const canManageMembers = (group: Group) => {
      if ([UserRole.CEO, UserRole.MANAGER].includes(currentUser.role)) return true;
      return group.createdBy === currentUser.id;
  };

  const canRemoveSpecificMember = (group: Group, memberId: string) => {
      const memberUser = users.find(u => u.id === memberId);
      if (!memberUser) return false;
      if ([UserRole.CEO, UserRole.MANAGER].includes(currentUser.role)) return true;
      if (group.createdBy === currentUser.id) {
          return ![UserRole.CEO, UserRole.MANAGER].includes(memberUser.role);
      }
      return false;
  };

  // --- Filtering Logic ---
  const availableUsers = users.filter(u => 
    u.id !== currentUser.id && 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userGroups = groups.filter(g => 
    g.members.includes(currentUser.id) &&
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedList = activeTab === 'all' 
    ? [...userGroups.map(g => ({ ...g, type: 'group' })), ...availableUsers.map(u => ({ ...u, type: 'user' }))]
    : activeTab === 'groups'
        ? userGroups.map(g => ({ ...g, type: 'group' }))
        : availableUsers.map(u => ({ ...u, type: 'user' }));

  // --- Effects ---

  // Default selection
  useEffect(() => {
    if (!selectedChatId) {
        if (userGroups.length > 0) setSelectedChatId(userGroups[0].id);
        else if (availableUsers.length > 0) setSelectedChatId(availableUsers[0].id);
    }
  }, [availableUsers, userGroups, selectedChatId]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChatId]);

  // Handle Scroll Button Visibility
  const handleScroll = () => {
      if (chatContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
          const isBottom = scrollHeight - scrollTop - clientHeight < 100;
          setShowScrollBottom(!isBottom);
      }
  };

  // Call Timer
  useEffect(() => {
    let interval: any;
    if (activeCall) {
      interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  // Media Stream
  useEffect(() => {
    const startMedia = async () => {
        if (activeCall) {
            try {
                const constraints = { audio: true, video: activeCall === 'video' };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Media error:", err);
                alert("Could not access camera/microphone.");
                setActiveCall(null);
            }
        } else {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }
        }
    };
    startMedia();
    return () => { if (localStream) localStream.getTracks().forEach(track => track.stop()); };
  }, [activeCall]);

  useEffect(() => {
      if (localStream) {
          localStream.getVideoTracks().forEach(track => track.enabled = isVideoEnabled);
          localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      }
  }, [isVideoEnabled, isMuted, localStream]);

  // --- Handlers ---

  const getConversation = () => {
    if (!selectedChatId) return [];
    if (selectedGroup) {
        return messages.filter(m => m.receiverId === selectedGroup.id)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    } else {
        return messages.filter(
            m => (m.senderId === currentUser.id && m.receiverId === selectedChatId) ||
                 (m.senderId === selectedChatId && m.receiverId === currentUser.id)
        ).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const isImage = file.type.startsWith('image/');
          setAttachment({
              type: isImage ? 'image' : 'file',
              url: reader.result as string,
              name: file.name
          });
      };
      reader.readAsDataURL(file);
      // Reset input
      e.target.value = '';
  };

  const cancelAttachment = () => setAttachment(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || !selectedChatId) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedChatId,
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: attachment ? attachment.type : 'text',
      fileUrl: attachment ? attachment.url : undefined,
      fileName: attachment ? attachment.name : undefined
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setAttachment(null);
    setShowEmojiPicker(false);
  };

  const handleCreateGroup = () => {
      if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
          alert("Enter group name and select members.");
          return;
      }
      const newGroup: Group = {
          id: `g${Date.now()}`,
          name: newGroupName,
          members: [...selectedGroupMembers, currentUser.id],
          createdBy: currentUser.id,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newGroupName)}&background=random&color=fff`
      };
      setGroups(prev => [newGroup, ...prev]);
      setIsGroupModalOpen(false);
      setNewGroupName('');
      setSelectedGroupMembers([]);
      setSelectedChatId(newGroup.id);
      setActiveTab('groups');
  };

  // --- Context Menu Handlers (Fixed & Robust) ---

  const handleDeleteGroup = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!selectedGroup) return;
      
      // Permission check
      if (!canDeleteGroup(selectedGroup)) {
          alert(`You do not have permission to delete this group.`);
          setShowOptions(false);
          return;
      }

      if (window.confirm(`Are you sure you want to delete the group "${selectedGroup.name}"? This action cannot be undone.`)) {
          setGroups(prevGroups => prevGroups.filter(g => g.id !== selectedGroup.id));
          setSelectedChatId(null); // Reset selection to avoid errors
          setShowOptions(false);
          setIsGroupInfoOpen(false);
      }
  };

  const handleClearChat = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const targetId = selectedChatId;
      if (!targetId) return;

      // Determine context safely
      const isGroup = groups.some(g => g.id === targetId);

      if (window.confirm("Are you sure you want to clear this chat history? This cannot be undone.")) {
        setMessages(prev => {
            return prev.filter(msg => {
                if (isGroup) {
                    // For groups, remove messages sent to this group ID
                    return msg.receiverId !== targetId;
                } else {
                    // For DMs, remove conversation between me and them
                    const isRelated = (msg.senderId === currentUser.id && msg.receiverId === targetId) ||
                                      (msg.senderId === targetId && msg.receiverId === currentUser.id);
                    return !isRelated;
                }
            });
        });
        setShowOptions(false);
      }
  };

  const handleBlockToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!selectedChatId || selectedGroup) return;
      
      if (blockedUsers.includes(selectedChatId)) {
          // Unblock
          setBlockedUsers(prev => prev.filter(id => id !== selectedChatId));
      } else {
          // Block
          if (window.confirm(`Are you sure you want to block ${selectedUser?.name}? You won't be able to send or receive messages.`)) {
              setBlockedUsers(prev => [...prev, selectedChatId]);
          }
      }
      setShowOptions(false);
  };

  const handleStartCall = (type: 'audio' | 'video') => {
      if (selectedUser && blockedUsers.includes(selectedChatId!)) {
        alert("You cannot call a blocked user.");
        return;
      }
      setActiveCall(type);
      setIsVideoEnabled(type === 'video');
      setIsMuted(false);
  };

  const handleViewProfile = () => {
      if (selectedUser) {
          setViewProfileUser(selectedUser);
          setShowOptions(false);
      }
  };

  // --- Render Helpers ---

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const emojiList = ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "👍", "👎", "👌", "✌️", "🤞", "❤️", "🔥", "✨"];

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      
      {/* Call Overlay */}
      {activeCall && selectedUser && (
        <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col animate-in fade-in duration-300">
           <div className="flex-1 relative flex items-center justify-center bg-gray-900">
               {/* Background Blurs */}
               <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900 z-10"></div>
               <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
               
               {/* Caller Info */}
               <div className="flex flex-col items-center z-20">
                  <div className="relative mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                          <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-gray-900"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedUser.name}</h2>
                  <p className="text-indigo-300 font-mono tracking-wider">{callDuration === 0 ? 'Connecting...' : formatCallTime(callDuration)}</p>
               </div>

               {/* Self View (Video Only) */}
               {activeCall === 'video' && (
                   <div className="absolute top-6 right-6 w-48 h-36 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-30">
                       <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                   </div>
               )}
           </div>
           
           {/* Controls */}
           <div className="h-24 bg-gray-800/80 backdrop-blur-md flex items-center justify-center gap-6 z-30 border-t border-white/5">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button onClick={() => { setActiveCall(null); setLocalStream(null); }} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transform hover:scale-105 transition-all">
                    <PhoneOff className="w-8 h-8" />
                </button>
                {activeCall === 'video' && (
                    <button onClick={() => setIsVideoEnabled(!isVideoEnabled)} className={`p-4 rounded-full transition-all ${!isVideoEnabled ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                        {!isVideoEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>
                )}
           </div>
        </div>
      )}

      {/* Group Info Modal */}
      {isGroupInfoOpen && selectedGroup && (
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-200">
              <div className="bg-white w-80 h-full shadow-2xl overflow-y-auto slide-in-from-right animate-in duration-300">
                  <div className="bg-indigo-600 p-6 text-white relative">
                      <button onClick={() => setIsGroupInfoOpen(false)} className="absolute top-4 right-4 text-white/80 hover:bg-white/10 rounded-full p-1"><X className="w-5 h-5"/></button>
                      <div className="flex flex-col items-center">
                           <img src={selectedGroup.avatar} className="w-20 h-20 rounded-full border-4 border-white/20 mb-3" alt="" />
                           <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
                           <p className="text-indigo-200 text-sm">{selectedGroup.members.length} Members</p>
                      </div>
                  </div>
                  
                  <div className="p-4 space-y-6">
                      {/* Add Member */}
                      {canManageMembers(selectedGroup) && (
                          <div>
                              <button 
                                onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium"
                              >
                                  <UserPlus className="w-4 h-4" /> Add Member
                              </button>
                              
                              {isAddMemberOpen && (
                                  <div className="mt-2 border border-gray-100 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                                      {users.filter(u => !selectedGroup.members.includes(u.id)).map(u => (
                                          <button key={u.id} onClick={() => {
                                              const updatedGroup = { ...selectedGroup, members: [...selectedGroup.members, u.id] };
                                              setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updatedGroup : g));
                                              setIsAddMemberOpen(false);
                                          }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                                              <img src={u.avatar} className="w-6 h-6 rounded-full" alt=""/> {u.name}
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Member List */}
                      <div>
                          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Participants</h3>
                          <div className="space-y-3">
                              {selectedGroup.members.map(memberId => {
                                  const member = users.find(u => u.id === memberId);
                                  if (!member) return null;
                                  const isCreator = selectedGroup.createdBy === memberId;
                                  return (
                                      <div key={memberId} className="flex items-center justify-between group">
                                          <div className="flex items-center gap-3">
                                              <div className="relative">
                                                  <img src={member.avatar} className="w-9 h-9 rounded-full" alt="" />
                                                  {isCreator && <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5"><CheckSquare className="w-2 h-2" /></span>}
                                              </div>
                                              <div>
                                                  <p className="text-sm font-medium text-gray-800">{member.name}</p>
                                                  <p className="text-xs text-gray-500">{member.role}</p>
                                              </div>
                                          </div>
                                          {canManageMembers(selectedGroup) && canRemoveSpecificMember(selectedGroup, memberId) && memberId !== currentUser.id && (
                                              <button onClick={() => {
                                                  if(window.confirm('Remove user?')) {
                                                      const updated = { ...selectedGroup, members: selectedGroup.members.filter(id => id !== memberId) };
                                                      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
                                                  }
                                              }} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><UserMinus className="w-4 h-4"/></button>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r border-gray-200 bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-100">
           <div className="flex justify-between items-center mb-4">
               <h2 className="font-bold text-xl text-gray-800">Chats</h2>
               {canCreateGroup && (
                   <button onClick={() => setIsGroupModalOpen(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
                       <Plus className="w-5 h-5" />
                   </button>
               )}
           </div>
           
           <div className="relative mb-4">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="Search messages..." 
                 className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
           </div>

           <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
               {['all', 'direct', 'groups'].map((tab) => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       {tab}
                   </button>
               ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {displayedList.map((item: any) => {
                const isGroup = item.type === 'group';
                const lastMsg = messages
                    .filter(m => isGroup ? m.receiverId === item.id : (m.senderId === item.id && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === item.id))
                    .pop();
                
                return (
                    <div 
                        key={item.id}
                        onClick={() => setSelectedChatId(item.id)}
                        className={`p-4 flex gap-3 cursor-pointer hover:bg-white border-b border-gray-100 transition-colors
                            ${selectedChatId === item.id ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' : 'border-l-4 border-l-transparent'}
                        `}
                    >
                        <div className="relative shrink-0">
                            <img src={item.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                            {isGroup ? (
                                <span className="absolute -bottom-1 -right-1 bg-gray-100 border-2 border-white rounded-full p-0.5"><Users className="w-3 h-3 text-gray-500"/></span>
                            ) : (
                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${blockedUsers.includes(item.id) ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className={`text-sm font-semibold truncate ${selectedChatId === item.id ? 'text-indigo-900' : 'text-gray-800'}`}>{item.name}</h4>
                                {lastMsg && <span className="text-[10px] text-gray-400 shrink-0">{lastMsg.timestamp}</span>}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                                {isGroup && lastMsg ? (
                                    <span className="text-indigo-500">{lastMsg.senderId === currentUser.id ? 'You' : users.find(u=>u.id===lastMsg.senderId)?.name.split(' ')[0]}: </span>
                                ) : lastMsg?.senderId === currentUser.id && <span className="text-gray-400">You: </span>}
                                
                                {lastMsg ? (
                                    lastMsg.type === 'image' ? <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Image</span> : 
                                    lastMsg.type === 'file' ? <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> File</span> :
                                    lastMsg.content
                                ) : <span className="italic opacity-50">No messages</span>}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] relative">
          {selectedChatId ? (
              <>
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-20">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectedGroup ? setIsGroupInfoOpen(true) : handleViewProfile()}>
                        <img src={selectedGroup ? selectedGroup.avatar : selectedUser?.avatar} className="w-10 h-10 rounded-full" alt="" />
                        <div>
                            <h3 className="font-bold text-gray-800">{selectedGroup ? selectedGroup.name : selectedUser?.name}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {selectedGroup ? `${selectedGroup.members.length} members` : (isBlocked ? <span className="text-red-500">Blocked</span> : <><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active Now</>)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleStartCall('audio')} disabled={isBlocked} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50"><Phone className="w-5 h-5"/></button>
                        <button onClick={() => handleStartCall('video')} disabled={isBlocked} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50"><Video className="w-5 h-5"/></button>
                        
                        <div className="relative">
                            <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><MoreVertical className="w-5 h-5"/></button>
                            {showOptions && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                                    {selectedGroup ? (
                                        <>
                                            <button 
                                                type="button"
                                                onClick={() => { setIsGroupInfoOpen(true); setShowOptions(false); }}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors"
                                            >
                                                <Info className="w-4 h-4" /> Group Info
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => handleClearChat(e)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> Clear Chat
                                            </button>
                                            {canDeleteGroup(selectedGroup) && (
                                                <button 
                                                    type="button"
                                                    onClick={(e) => handleDeleteGroup(e)}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Group
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                type="button"
                                                onClick={handleViewProfile}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors"
                                            >
                                                <UserIcon className="w-4 h-4" /> View Profile
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => handleClearChat(e)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> Clear Chat
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => handleBlockToggle(e)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition-colors"
                                            >
                                                {isBlocked ? (
                                                    <><UserCheck className="w-4 h-4" /> Unblock User</>
                                                ) : (
                                                    <><UserX className="w-4 h-4" /> Block User</>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div 
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                >
                    {getConversation().map((msg, index, arr) => {
                        const isMe = msg.senderId === currentUser.id;
                        const sender = users.find(u => u.id === msg.senderId);
                        const showAvatar = !isMe && (index === 0 || arr[index - 1].senderId !== msg.senderId);
                        const showDate = index === 0 || msg.timestamp.split(' ')[0] !== arr[index-1].timestamp.split(' ')[0]; // Simplified check

                        return (
                            <React.Fragment key={msg.id}>
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                    {!isMe && (
                                        <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                                            {showAvatar && <img src={sender?.avatar} className="w-8 h-8 rounded-full shadow-sm" alt="" title={sender?.name} />}
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe && showAvatar && selectedGroup && <span className="text-[10px] text-gray-500 ml-1 mb-1">{sender?.name}</span>}
                                        
                                        <div className={`relative px-4 py-2.5 shadow-sm text-sm ${
                                            isMe 
                                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                                        }`}>
                                            {/* Text Content */}
                                            {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                                            
                                            {/* Attachment: Image */}
                                            {msg.type === 'image' && msg.fileUrl && (
                                                <div className="mt-2 mb-1 rounded-lg overflow-hidden">
                                                    <img src={msg.fileUrl} alt="Attachment" className="max-w-full h-auto max-h-60 object-cover" />
                                                </div>
                                            )}

                                            {/* Attachment: File */}
                                            {msg.type === 'file' && msg.fileUrl && (
                                                <a href={msg.fileUrl} download={msg.fileName} className={`flex items-center gap-3 p-3 rounded-lg mt-1 mb-1 transition-colors ${isMe ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}>
                                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                                                        <FileText className={`w-5 h-5 ${isMe ? 'text-white' : 'text-indigo-600'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-xs">{msg.fileName}</p>
                                                        <p className={`text-[10px] ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>Click to download</p>
                                                    </div>
                                                    <Download className={`w-4 h-4 ${isMe ? 'text-white' : 'text-gray-400'}`} />
                                                </a>
                                            )}

                                            {/* Meta Info */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                <span>{msg.timestamp}</span>
                                                {isMe && (msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg w-fit animate-in slide-in-from-bottom-2">
                            {attachment.type === 'image' ? (
                                <img src={attachment.url} className="w-10 h-10 rounded object-cover" alt="" />
                            ) : (
                                <div className="w-10 h-10 bg-indigo-100 rounded flex items-center justify-center text-indigo-600"><FileText className="w-5 h-5"/></div>
                            )}
                            <div className="max-w-[150px]">
                                <p className="text-xs font-medium truncate">{attachment.name}</p>
                                <p className="text-[10px] text-gray-500 capitalize">{attachment.type}</p>
                            </div>
                            <button onClick={cancelAttachment} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-4 h-4"/></button>
                        </div>
                    )}

                    {isBlocked ? (
                        <div className="text-center text-gray-500 text-sm py-2 bg-gray-100 rounded-lg">You have blocked this user. <button onClick={(e) => handleBlockToggle(e)} className="text-indigo-600 font-medium hover:underline">Unblock</button></div>
                    ) : (
                        <form onSubmit={handleSend} className="flex items-end gap-2">
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileUpload}
                                accept="image/*,.pdf,.doc,.docx"
                            />
                             <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 rounded-full transition-colors"><Paperclip className="w-5 h-5"/></button>
                             
                             <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                 <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-400 hover:text-yellow-500 transition-colors mr-2"><Smile className="w-5 h-5"/></button>
                                 <input 
                                    type="text" 
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 max-h-32"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                 />
                             </div>
                             
                             <button type="submit" disabled={!inputText.trim() && !attachment} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200">
                                 <Send className="w-5 h-5 ml-0.5" />
                             </button>
                        </form>
                    )}
                    
                    {showEmojiPicker && (
                        <div className="absolute bottom-20 left-12 z-50">
                            <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)}></div>
                            <div className="relative bg-white border border-gray-200 rounded-xl shadow-xl p-3 grid grid-cols-8 gap-1 w-72 h-48 overflow-y-auto">
                                {emojiList.map(emoji => (
                                    <button key={emoji} type="button" onClick={() => { setInputText(p => p + emoji); setShowEmojiPicker(false); }} className="text-xl p-1 hover:bg-gray-100 rounded">{emoji}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Scroll to bottom button */}
                {showScrollBottom && (
                    <button 
                        onClick={scrollToBottom}
                        className="absolute bottom-24 right-8 p-2 bg-white text-indigo-600 rounded-full shadow-lg border border-gray-100 animate-bounce z-10"
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                )}
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                  <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <MessageSquareIcon className="w-16 h-16 text-indigo-200" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Conversation</h3>
                  <p className="text-gray-500 max-w-xs">Choose a user or group from the sidebar to start chatting, sharing files, or making calls.</p>
              </div>
          )}
      </div>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Create New Group</h3>
                      <button onClick={() => setIsGroupModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">Group Name</label>
                          <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Marketing Team" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                      </div>
                      <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">Select Members</label>
                          <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                              {users.filter(u => u.id !== currentUser.id).map(u => (
                                  <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={selectedGroupMembers.includes(u.id)} onChange={() => {
                                          setSelectedGroupMembers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                                      }} />
                                      <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                                      <span className="text-sm font-medium">{u.name}</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                      <button onClick={handleCreateGroup} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700">Create Group</button>
                  </div>
              </div>
          </div>
      )}

      {/* Profile Info Modal */}
      {viewProfileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center relative animate-in zoom-in-95 duration-200">
               <button onClick={() => setViewProfileUser(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
               
               <div className="w-full h-32 bg-indigo-600 relative"></div>
               <div className="w-24 h-24 rounded-full border-4 border-white shadow-md -mt-12 overflow-hidden bg-white z-10">
                   <img src={viewProfileUser.avatar} className="w-full h-full object-cover" alt="" />
               </div>
               
               <div className="text-center mt-3 mb-6 px-6">
                   <h2 className="text-xl font-bold text-gray-800">{viewProfileUser.name}</h2>
                   <p className="text-indigo-600 font-medium text-sm">{viewProfileUser.role}</p>
                   <p className="text-gray-500 text-sm mt-1">{viewProfileUser.department} Department</p>
                   <p className="text-gray-400 text-xs mt-2 flex items-center justify-center gap-1"><Mail className="w-3 h-3"/> {viewProfileUser.email}</p>
               </div>
               
               <div className="w-full border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
                   <button onClick={() => { setViewProfileUser(null); handleStartCall('audio'); }} className="p-4 hover:bg-gray-50 flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors">
                       <Phone className="w-5 h-5" />
                       <span className="text-xs font-medium">Audio Call</span>
                   </button>
                   <button onClick={() => { setViewProfileUser(null); handleStartCall('video'); }} className="p-4 hover:bg-gray-50 flex flex-col items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors">
                       <Video className="w-5 h-5" />
                       <span className="text-xs font-medium">Video Call</span>
                   </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon component for empty state
const MessageSquareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);