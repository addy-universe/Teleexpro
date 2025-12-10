import React, { useState, useRef } from 'react';
import { Lead, User, UserRole } from '../types';
import * as XLSX from 'xlsx';
import { Upload, UserCheck, Phone, Mail, CheckCircle, AlertCircle, Target, ArrowRight, FileSpreadsheet, FileText, X } from 'lucide-react';

interface LeadsProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  users: User[];
  currentUser: User;
}

export const Leads: React.FC<LeadsProps> = ({ leads, setLeads, users, currentUser }) => {
  const [inputText, setInputText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Targets for lead distribution (Executives)
  const executives = users.filter(u => u.role === UserRole.EXECUTIVE);

  // Access Control: 
  // - Executive: Only assigned leads
  // - Others (CEO, Admin, Manager, HR, TL): All leads
  const canViewAll = currentUser.role !== UserRole.EXECUTIVE;
  const canDistribute = [UserRole.CEO, UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);

  const displayLeads = canViewAll
    ? leads
    : leads.filter(l => l.assignedTo === currentUser.id);

  const distributeLeads = (newLeadsData: Partial<Lead>[]) => {
    if (executives.length === 0) {
        setError('No executives found to distribute leads to.');
        return;
    }

    if (newLeadsData.length === 0) {
        setError('No valid leads found in the input.');
        return;
    }

    const newLeads: Lead[] = [];
    let empIndex = 0;

    newLeadsData.forEach((leadData) => {
        if (leadData.name) {
            newLeads.push({
                id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: leadData.name,
                email: leadData.email || '',
                phone: leadData.phone || '',
                status: 'New',
                assignedTo: executives[empIndex].id,
                createdAt: new Date().toISOString().split('T')[0]
            });
            // Round-robin distribution
            empIndex = (empIndex + 1) % executives.length;
        }
    });

    setLeads(prev => [...newLeads, ...prev]);
    setSuccessMessage(`Successfully distributed ${newLeads.length} leads among ${executives.length} executives.`);
    
    // Reset inputs
    setInputText('');
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextDistribute = () => {
    setError('');
    setSuccessMessage('');

    if (!inputText.trim()) {
      setError('Please enter lead data.');
      return;
    }

    const lines = inputText.trim().split('\n');
    const parsedData: Partial<Lead>[] = lines.map(line => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 1 && parts[0]) {
            return {
                name: parts[0],
                email: parts[1],
                phone: parts[2]
            };
        }
        return null;
    }).filter(Boolean) as Partial<Lead>[];

    distributeLeads(parsedData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setError('');
      setSuccessMessage('');
  };

  const processExcelFile = async () => {
      if (!fileInputRef.current?.files?.[0]) {
          setError('Please select a file first.');
          return;
      }

      const file = fileInputRef.current.files[0];
      
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data);
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          const parsedData: Partial<Lead>[] = jsonData.map(row => {
              // Try to find columns case-insensitively
              const keys = Object.keys(row);
              const nameKey = keys.find(k => k.toLowerCase().includes('name'));
              const emailKey = keys.find(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('mail'));
              const phoneKey = keys.find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('contact') || k.toLowerCase().includes('mobile'));

              if (nameKey) {
                  return {
                      name: row[nameKey],
                      email: emailKey ? row[emailKey] : '',
                      phone: phoneKey ? row[phoneKey] : ''
                  };
              }
              return null;
          }).filter(Boolean) as Partial<Lead>[];

          distributeLeads(parsedData);

      } catch (err) {
          console.error(err);
          setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
      }
  };

  const handleStatusChange = (leadId: string, newStatus: string) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const stats = {
      total: displayLeads.length,
      new: displayLeads.filter(l => l.status === 'New').length,
      converted: displayLeads.filter(l => l.status === 'Converted').length,
      inProgress: displayLeads.filter(l => l.status === 'Contacted' || l.status === 'In Progress').length
  };

  return (
    <div className="space-y-8">
      
      {/* Upload Section - Only for roles with distribution rights */}
      {canDistribute && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                      <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Distribute Leads</h2>
                    <p className="text-sm text-gray-500">Add leads to auto-assign them to your team.</p>
                  </div>
               </div>
               
               <div className="flex bg-gray-100 p-1 rounded-lg">
                   <button 
                    onClick={() => setMode('text')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       <FileText className="w-4 h-4" /> Paste Text
                   </button>
                   <button 
                    onClick={() => setMode('file')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'file' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                       <FileSpreadsheet className="w-4 h-4" /> Upload Excel
                   </button>
               </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {mode === 'text' ? (
                        <>
                            <p className="text-sm text-gray-500">
                                Paste leads below. <span className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">Format: Name, Email, Phone</span>
                            </p>
                            <textarea 
                                className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono text-gray-700"
                                placeholder={`John Doe, john@example.com, 555-0101\nJane Smith, jane@test.com, 555-0202`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleTextDistribute}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    <UserCheck className="w-4 h-4" /> Distribute to {executives.length} Executives
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-green-400 transition-colors bg-gray-50/50">
                            {fileName ? (
                                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">{fileName}</p>
                                        <p className="text-xs text-gray-500">Ready to process</p>
                                    </div>
                                    <button 
                                        onClick={() => { setFileName(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-green-100 p-4 rounded-full mb-4">
                                        <Upload className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">Click to upload Excel file</h3>
                                    <p className="text-sm text-gray-500 mb-4">Support .xlsx, .xls, .csv</p>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden" 
                                        id="file-upload"
                                    />
                                    <label 
                                        htmlFor="file-upload"
                                        className="cursor-pointer bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Select File
                                    </label>
                                </>
                            )}

                            {fileName && (
                                <div className="mt-6">
                                     <button 
                                        onClick={processExcelFile}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-green-200"
                                    >
                                        <UserCheck className="w-4 h-4" /> Process & Distribute
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-4 h-4" /> {successMessage}
                        </div>
                    )}
                </div>

                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 h-fit">
                    <h3 className="font-bold text-indigo-900 mb-3">Distribution Logic</h3>
                    <ul className="text-sm text-indigo-800 space-y-2">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Leads are assigned using a Round-Robin algorithm.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Ensures fair and equal workload distribution.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Active Executives: <strong>{executives.length}</strong></span>
                        </li>
                        {mode === 'file' && (
                             <li className="flex items-start gap-2">
                                <FileSpreadsheet className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Excel columns should contain: <strong>Name, Email, Phone</strong></span>
                            </li>
                        )}
                    </ul>
                </div>
           </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Leads</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-blue-400 font-semibold uppercase">New</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-orange-400 font-semibold uppercase">In Progress</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-green-400 font-semibold uppercase">Converted</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.converted}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                {canViewAll ? 'All Leads Overview' : 'My Assigned Leads'}
            </h3>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 font-medium">Lead Name</th>
                        <th className="px-6 py-4 font-medium">Contact Info</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        {canViewAll && <th className="px-6 py-4 font-medium">Assigned To</th>}
                        <th className="px-6 py-4 font-medium">Date Added</th>
                        {!canViewAll && <th className="px-6 py-4 font-medium">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    {lead.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" /> {lead.email}</div>}
                                    {lead.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400" /> {lead.phone}</div>}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                                    ${lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                                    ${lead.status === 'Contacted' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : ''}
                                    ${lead.status === 'In Progress' ? 'bg-orange-50 text-orange-600 border-orange-100' : ''}
                                    ${lead.status === 'Converted' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                                    ${lead.status === 'Lost' ? 'bg-gray-50 text-gray-500 border-gray-200' : ''}
                                `}>
                                    {lead.status}
                                </span>
                            </td>
                            {canViewAll && (
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                            {getUserName(lead.assignedTo).charAt(0)}
                                        </div>
                                        {getUserName(lead.assignedTo)}
                                    </div>
                                </td>
                            )}
                            <td className="px-6 py-4 text-gray-400">{lead.createdAt}</td>
                            {!canViewAll && (
                                <td className="px-6 py-4">
                                    <select 
                                        value={lead.status} 
                                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                        className="border border-gray-300 rounded-lg text-xs p-1.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Converted">Converted</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </td>
                            )}
                        </tr>
                    ))}
                    {displayLeads.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                No leads found.
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