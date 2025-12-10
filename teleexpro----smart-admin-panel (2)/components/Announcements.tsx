import React, { useState } from 'react';
import { Announcement, UserRole } from '../types';
import { generateAnnouncement } from '../services/geminiService';
import { Sparkles, Send, Trash2 } from 'lucide-react';

interface AnnouncementProps {
  announcements: Announcement[];
  role: UserRole;
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}

export const Announcements: React.FC<AnnouncementProps> = ({ announcements, role, setAnnouncements }) => {
  const [newTopic, setNewTopic] = useState('');
  const [tone, setTone] = useState('Formal');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState('');

  // Access Control: Only Management can post announcements
  const canEdit = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER, UserRole.HR].includes(role);

  const handleGenerate = async () => {
    if (!newTopic) return;
    setIsGenerating(true);
    const content = await generateAnnouncement(newTopic, tone);
    setGeneratedContent(content);
    setIsGenerating(false);
  };

  const handlePost = () => {
    if (!title || !generatedContent) return;
    
    const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        title,
        content: generatedContent,
        date: new Date().toISOString().split('T')[0],
        author: role,
        priority: 'Normal'
    };
    
    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle('');
    setGeneratedContent('');
    setNewTopic('');
  };

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8">
      
      {/* AI Creator Section */}
      {canEdit && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">AI Announcement Creator</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Announcement Title" 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="What is this about? (e.g. Office Party)" 
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                />
                <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="p-3 border border-gray-200 rounded-lg outline-none bg-white text-gray-900"
                >
                    <option>Formal</option>
                    <option>Excited</option>
                    <option>Urgent</option>
                    <option>Casual</option>
                </select>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !newTopic}
                className="w-full bg-indigo-600 text-white p-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex justify-center items-center gap-2"
              >
                {isGenerating ? 'Generating...' : <><Sparkles className="w-4 h-4" /> Generate Text with AI</>}
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[160px] flex flex-col">
              <label className="text-xs text-gray-400 font-semibold uppercase mb-2">Preview & Edit</label>
              <textarea 
                className="flex-1 w-full resize-none outline-none text-gray-700 text-sm"
                placeholder="AI generated text will appear here..."
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
              />
              {generatedContent && (
                  <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                      <button onClick={handlePost} className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:bg-indigo-50 px-3 py-1 rounded">
                          <Send className="w-4 h-4" /> Post
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Latest Announcements</h3>
        <div className="space-y-4">
            {announcements.map(ann => (
                <div key={ann.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">{ann.title}</h4>
                            <p className="text-xs text-gray-400">Posted by {ann.author} on {ann.date}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                            ${ann.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
                        `}>
                            {ann.priority}
                        </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{ann.content}</p>
                    
                    {canEdit && (
                        <button 
                            onClick={() => handleDelete(ann.id)}
                            className="absolute bottom-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};