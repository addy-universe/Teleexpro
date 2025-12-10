import React, { useState } from 'react';
import { PayrollEntry, User, UserRole } from '../types';
import { Download, AlertCircle, UploadCloud, Edit2, FileText, Check, Trash2, File, Search, User as UserIcon } from 'lucide-react';

interface PayrollProps {
  entries: PayrollEntry[];
  setEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
  role: UserRole;
  currentUser: User;
  users: User[];
}

export const Payroll: React.FC<PayrollProps> = ({ entries, setEntries, role, currentUser, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    baseSalary: 0,
    bonus: 0,
    deductions: 0,
    customSlip: '',
    fileName: ''
  });

  // Access Control: CEO, Admin, HR, Manager can see all and manage. Others see only their own.
  const canManage = [UserRole.CEO, UserRole.ADMIN, UserRole.HR, UserRole.MANAGER].includes(role);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const getUserDepartment = (id: string) => users.find(u => u.id === id)?.department || 'General';
  const getUserRole = (id: string) => users.find(u => u.id === id)?.role || 'Employee';

  const filteredEntries = canManage
    ? entries.filter(e => getUserName(e.userId).toLowerCase().includes(searchQuery.toLowerCase()))
    : entries.filter(e => e.userId === currentUser.id);

  const handleOpenModal = () => {
    const firstEmp = users.find(u => u.role !== UserRole.CEO);
    setFormData(prev => ({
        ...prev,
        userId: prev.userId || (firstEmp?.id || ''),
        customSlip: '',
        fileName: ''
    }));
    setIsModalOpen(true);
  };

  const calculateNet = () => {
    return (Number(formData.baseSalary) || 0) + (Number(formData.bonus) || 0) - (Number(formData.deductions) || 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
            ...prev,
            customSlip: reader.result as string,
            fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
      setFormData(prev => ({ ...prev, customSlip: '', fileName: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const netSalary = calculateNet();
    
    const existingIndex = entries.findIndex(e => e.userId === formData.userId && e.month === formData.month);
    
    const newEntry: PayrollEntry = {
        id: existingIndex >= 0 ? entries[existingIndex].id : `p${Date.now()}`,
        userId: formData.userId,
        baseSalary: Number(formData.baseSalary),
        bonus: Number(formData.bonus),
        deductions: Number(formData.deductions),
        netSalary: netSalary,
        month: formData.month,
        status: 'Paid',
        customSlip: formData.customSlip,
        fileName: formData.fileName
    };

    if (existingIndex >= 0) {
        setEntries(prev => prev.map((item, idx) => idx === existingIndex ? newEntry : item));
    } else {
        setEntries(prev => [newEntry, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleUserChange = (userId: string) => {
      const existing = entries.find(e => e.userId === userId && e.month === formData.month);
      if (existing) {
          setFormData({
              userId,
              month: existing.month,
              baseSalary: existing.baseSalary,
              bonus: existing.bonus,
              deductions: existing.deductions,
              customSlip: existing.customSlip || '',
              fileName: existing.fileName || ''
          });
      } else {
          setFormData(prev => ({ ...prev, userId, baseSalary: 0, bonus: 0, deductions: 0, customSlip: '', fileName: '' }));
      }
  };

  const downloadPayslip = (entry: PayrollEntry) => {
    // If a custom file was uploaded by the CEO, download that instead of generating HTML
    if (entry.customSlip) {
        const a = document.createElement('a');
        a.href = entry.customSlip;
        a.download = entry.fileName || `Payslip_${entry.month}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
    }

    // Otherwise, Generate HTML Template (Fallback to branded design)
    const user = users.find(u => u.id === entry.userId);
    const payDate = new Date().toLocaleDateString();
    
    const reimbursement = 349.00;
    const attendanceBonus = 500.00;
    const festivalAllowance = 0.00;
    const totalEarnings = entry.baseSalary + entry.bonus + reimbursement + attendanceBonus + festivalAllowance;
    const totalDeductions = entry.deductions;
    const netSalary = totalEarnings - totalDeductions;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payslip - ${user?.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Great+Vibes&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #fff; color: #1f2937; }
            .page { width: 794px; min-height: 1122px; margin: 0 auto; position: relative; overflow: hidden; background: white; }
            .top-graphic { position: absolute; top: 0; left: 0; width: 400px; height: 200px; z-index: 1; }
            .bottom-graphic { position: absolute; bottom: 0; right: 0; width: 400px; height: 200px; z-index: 1; transform: rotate(180deg); }
            .logo-section { position: absolute; top: 50px; right: 50px; text-align: right; z-index: 2; }
            .logo-text { font-size: 32px; font-weight: 800; color: #000; letter-spacing: -1px; }
            .logo-text .blue-line { border-bottom: 4px solid #06b6d4; padding-bottom: 2px; }
            .header-title { margin-top: 150px; text-align: center; color: #0e7490; font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 50px; position: relative; z-index: 2; }
            .info-grid { display: flex; justify-content: space-between; padding: 0 50px; margin-bottom: 40px; position: relative; z-index: 2; }
            .info-col { width: 48%; }
            .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
            .info-label { width: 140px; color: #374151; font-weight: 400; }
            .info-value { color: #111827; font-weight: 500; }
            .section-title { color: #0e7490; font-size: 20px; font-weight: 700; padding: 0 50px; margin-bottom: 10px; position: relative; z-index: 2; }
            .table-container { padding: 0 50px; margin-bottom: 30px; position: relative; z-index: 2; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #67e8f9; color: #000; text-align: left; padding: 12px 15px; font-weight: 600; font-size: 14px; }
            .amount-header { text-align: right; }
            td { padding: 12px 15px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; }
            .amount-cell { text-align: right; }
            .total-row td { background-color: #ecfeff; font-weight: 700; border-bottom: none; }
            .net-salary { padding: 0 50px; margin-top: 40px; color: #0e7490; font-size: 24px; font-weight: 700; position: relative; z-index: 2; }
            .footer { padding: 0 50px; margin-top: 60px; position: relative; z-index: 2; }
            .auth-label { font-size: 14px; color: #4b5563; margin-bottom: 5px; }
            .signature { font-family: 'Great Vibes', cursive; font-size: 40px; color: #000; margin: 10px 0; }
            .auth-name { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        </style>
    </head>
    <body>
        <div class="page">
            <div class="top-graphic"><svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#0284c7;stop-opacity:1" /><stop offset="100%" style="stop-color:#22d3ee;stop-opacity:1" /></linearGradient></defs><path d="M0 0 L250 0 L150 100 L0 50 Z" fill="#0c4a6e" /><path d="M100 0 L400 0 L250 150 L0 150 Z" fill="url(#grad1)" opacity="0.9" /><path d="M200 0 L400 0 L350 50 L150 50 Z" fill="#67e8f9" opacity="0.6" /></svg></div>
            <div class="logo-section"><div class="logo-text">TELE<span class="blue-line">EXPRO</span></div></div>
            <div class="header-title">EMPLOYEE PAYSLIP</div>
            <div class="info-grid">
                <div class="info-col"><div class="info-row"><div class="info-label">Employee Name</div><div class="info-value">${user?.name}</div></div><div class="info-row"><div class="info-label">Employee ID</div><div class="info-value">${user?.id}</div></div><div class="info-row"><div class="info-label">Department</div><div class="info-value">${getUserDepartment(user?.id || '')}</div></div><div class="info-row"><div class="info-label">Designation</div><div class="info-value">${getUserRole(user?.id || '')}</div></div></div>
                <div class="info-col"><div class="info-row"><div class="info-label">Month</div><div class="info-value">${entry.month}</div></div><div class="info-row"><div class="info-label">Pay Date</div><div class="info-value">${payDate}</div></div><div class="info-row"><div class="info-label">Bank Account</div><div class="info-value">000-000-000</div></div><div class="info-row"><div class="info-label">Payment Mode</div><div class="info-value">Bank Transfer</div></div></div>
            </div>
            <div class="section-title">Earnings</div>
            <div class="table-container"><table><thead><tr><th>Description</th><th class="amount-header">Amount (INR)</th></tr></thead><tbody><tr><td>Basic Salary</td><td class="amount-cell">${entry.baseSalary.toLocaleString()}</td></tr><tr><td>Incentives</td><td class="amount-cell">${entry.bonus.toLocaleString()}</td></tr><tr><td>Reimbursement</td><td class="amount-cell">${reimbursement.toLocaleString()}</td></tr><tr><td>Attendance Bonus</td><td class="amount-cell">${attendanceBonus.toLocaleString()}</td></tr><tr><td>Festival Allowance</td><td class="amount-cell">${festivalAllowance.toFixed(2)}</td></tr><tr class="total-row"><td>Total Earnings</td><td class="amount-cell">${totalEarnings.toLocaleString()}</td></tr></tbody></table></div>
            <div class="section-title">Deductions</div>
            <div class="table-container"><table><thead><tr><th>Description</th><th class="amount-header">Amount (INR)</th></tr></thead><tbody><tr><td>Unpaid leaves / Other</td><td class="amount-cell">${totalDeductions.toLocaleString()}</td></tr><tr class="total-row"><td>Total Deductions</td><td class="amount-cell">${totalDeductions.toLocaleString()}</td></tr></tbody></table></div>
            <div class="net-salary">Net Salary (INR) : ${netSalary.toLocaleString()}</div>
            <div class="footer"><div class="auth-label">Authorized by:</div><div class="auth-label">Finance Manager TELEEXPRO</div><div class="signature">Prashant</div><div class="auth-name">PRASHANT</div></div>
            <div class="bottom-graphic"><svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none"><defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#0284c7;stop-opacity:1" /><stop offset="100%" style="stop-color:#22d3ee;stop-opacity:1" /></linearGradient></defs><path d="M0 0 L250 0 L150 100 L0 50 Z" fill="#0c4a6e" /><path d="M100 0 L400 0 L250 150 L0 150 Z" fill="url(#grad2)" opacity="0.9" /><path d="M200 0 L400 0 L350 50 L150 50 Z" fill="#67e8f9" opacity="0.6" /></svg></div>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip_${user?.name.replace(/\s+/g, '_')}_${entry.month.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Payroll Portal</h2>
                <p className="text-sm text-gray-500">
                    {canManage ? 'Manage employee salaries and payslips.' : 'View and download your monthly payslips.'}
                </p>
            </div>
             {canManage && (
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search employee..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleOpenModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-200 whitespace-nowrap"
                    >
                        <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Upload Payslip</span>
                    </button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 gap-4">
            {filteredEntries.map(entry => (
                <div key={entry.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 w-full lg:w-1/3">
                        <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center border ${entry.customSlip ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                            {entry.customSlip ? <File className="w-6 h-6" /> : <span className="font-bold text-xl">₹</span>}
                        </div>
                        <div>
                            {canManage && (
                                <div className="flex items-center gap-2 mb-1">
                                    <UserIcon className="w-3 h-3 text-gray-400" />
                                    <p className="text-sm font-semibold text-gray-700">{getUserName(entry.userId)}</p>
                                </div>
                            )}
                            <p className="font-bold text-lg text-gray-900">{entry.month}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {entry.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm w-full lg:w-1/3 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-100 py-4 lg:py-0 px-0 lg:px-8">
                        <div className="text-gray-500">Base Salary:</div>
                        <div className="font-medium text-right">₹{entry.baseSalary.toLocaleString()}</div>
                        <div className="text-gray-500">Incentive/Bonus:</div>
                        <div className="font-medium text-right text-green-600">+₹{entry.bonus.toLocaleString()}</div>
                        <div className="text-gray-500">Deductions:</div>
                        <div className="font-medium text-right text-red-500">-₹{entry.deductions.toLocaleString()}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full lg:w-1/3 lg:pl-6">
                        <div className="text-gray-500 text-xs uppercase font-semibold">Net Pay Generated</div>
                        <div className="text-3xl font-bold text-gray-900 tracking-tight">₹{entry.netSalary.toLocaleString()}</div>
                        <button 
                            onClick={() => downloadPayslip(entry)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 hover:underline bg-indigo-50 px-4 py-2 rounded-lg transition-colors hover:bg-indigo-100 w-full lg:w-auto justify-center"
                        >
                            <Download className="w-4 h-4" /> Download Slip
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        {filteredEntries.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl flex flex-col items-center justify-center text-center text-gray-500">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-medium">No payroll records found.</p>
                <p className="text-sm">Try adjusting your search or check back later.</p>
            </div>
        )}

        {/* Upload / Generate Modal */}
        {isModalOpen && canManage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <UploadCloud className="w-5 h-5" /> Upload Employee Payslip
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full">
                            <Check className="w-5 h-5 rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.userId}
                                    onChange={(e) => handleUserChange(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select an employee...</option>
                                    {users.filter(u => u.role !== UserRole.CEO).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-gray-900"
                                    value={formData.month}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary (₹)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                    value={formData.baseSalary}
                                    onChange={(e) => setFormData({...formData, baseSalary: parseFloat(e.target.value)})}
                                    required
                                />
                            </div>
                             
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Incentive/Bonus (₹)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border-green-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none bg-green-50 text-gray-900"
                                    value={formData.bonus}
                                    onChange={(e) => setFormData({...formData, bonus: parseFloat(e.target.value)})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border-red-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-red-50 text-gray-900"
                                    value={formData.deductions}
                                    onChange={(e) => setFormData({...formData, deductions: parseFloat(e.target.value)})}
                                />
                            </div>

                            <div className="flex flex-col justify-end">
                                <span className="text-xs text-gray-500 uppercase font-bold text-right">Net Salary Preview</span>
                                <span className="text-xl font-bold text-indigo-700 text-right">₹{calculateNet().toLocaleString()}</span>
                            </div>

                            {/* Optional File Upload Section */}
                            <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Optional: Upload Custom Payslip File</label>
                                {!formData.customSlip ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors bg-gray-50">
                                        <input 
                                            type="file" 
                                            id="file-upload" 
                                            className="hidden" 
                                            onChange={handleFileChange} 
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                                            <UploadCloud className="w-8 h-8 text-gray-400" />
                                            <span className="text-sm text-indigo-600 font-medium">Click to upload PDF/Image</span>
                                            <span className="text-xs text-gray-400">If uploaded, employees will download this file directly.</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <span className="text-sm font-medium text-green-700 truncate max-w-[200px]">{formData.fileName}</span>
                                        </div>
                                        <button type="button" onClick={removeFile} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                             <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-medium flex items-center gap-2"
                            >
                                <UploadCloud className="w-4 h-4" /> Upload & Publish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};