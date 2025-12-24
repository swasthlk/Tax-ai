
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TAX_ALLOCATION_DATA, ICONS } from '../constants';
import { TaxReport, TaxCategory, ProgressUpdate, ReportStatus, TaxNotification } from '../types';

const OfficialDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [taxData, setTaxData] = useState<TaxCategory[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState<TaxCategory | null>(null);
  const [selectedReport, setSelectedReport] = useState<TaxReport | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [reviewStatus, setReviewStatus] = useState<ReportStatus>('Investigating');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });

  const [budgetForm, setBudgetForm] = useState({
    taxAllocated: '0',
    taxUsed: '0',
    statement: '',
    statementProofUrl: ''
  });

  const reviewInputRef = useRef<HTMLInputElement>(null);
  const budgetInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = () => {
      const storedReports = localStorage.getItem('taxwatch_reports');
      const storedTaxData = localStorage.getItem('taxwatch_tax_data');
      if (storedReports) setReports(JSON.parse(storedReports));
      if (storedTaxData) setTaxData(JSON.parse(storedTaxData));
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const createNotification = (recipientUid: string, reportId: string, message: string, status: ReportStatus) => {
    const notifications: TaxNotification[] = JSON.parse(localStorage.getItem('taxwatch_notifications') || '[]');
    const newNotif: TaxNotification = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      recipientUid,
      reportId,
      message,
      status,
      timestamp: new Date().toISOString(),
      read: false
    };
    try {
      localStorage.setItem('taxwatch_notifications', JSON.stringify([newNotif, ...notifications]));
    } catch (e) {
      console.warn("Notification storage failed", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'budget' | 'review') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert("File too large. Please select an image under 1MB for treasury sync stability.");
        return;
      }
      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        if (target === 'profile') setProfileForm(prev => ({ ...prev, photoURL: base64String }));
        if (target === 'budget') setBudgetForm(prev => ({ ...prev, statementProofUrl: base64String }));
        if (target === 'review') setReviewPhoto(base64String);
        e.target.value = '';
        setIsProcessingFile(false);
      };
      reader.onerror = (err) => {
        console.error("FileReader Error:", err);
        setIsProcessingFile(false);
        alert("System error reading visual ID data.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBudgetUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBudgetModal) return;

    const allocated = Number(budgetForm.taxAllocated);
    const used = Number(budgetForm.taxUsed);
    const collected = showBudgetModal.taxCollected;

    const updatedTaxData = taxData.map(t => t.id === showBudgetModal.id ? {
      ...t,
      taxAllocated: allocated,
      taxUsed: used,
      taxRemaining: allocated - used,
      totalTaxRemaining: collected - used,
      statement: budgetForm.statement,
      statementProofUrl: budgetForm.statementProofUrl,
      updatedAt: new Date().toISOString()
    } : t);

    try {
      localStorage.setItem('taxwatch_tax_data', JSON.stringify(updatedTaxData));
      setTaxData(updatedTaxData);
      setShowBudgetModal(null);
      alert('Treasury command synchronized.');
    } catch (err) {
      alert("Treasury memory overflow. Please try using a smaller verification image.");
    }
  };

  const handleCaseReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    const newUpdate: ProgressUpdate = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      text: reviewComment || `System Status Update: ${reviewStatus}`,
      mediaUrl: reviewPhoto,
      mediaType: 'image',
      timestamp: new Date().toISOString()
    };

    const progressMap = { 'Pending': 5, 'Investigating': 40, 'Resolved': 100, 'Declined': 0 };

    const allStored = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    const updated = allStored.map((r: TaxReport) => r.id === selectedReport.id ? {
      ...r,
      status: reviewStatus,
      progress: progressMap[reviewStatus],
      reply: reviewComment,
      updates: [newUpdate, ...(r.updates || [])],
      updatedAt: new Date().toISOString()
    } : r);

    try {
      localStorage.setItem('taxwatch_reports', JSON.stringify(updated));
      setReports(updated);
      createNotification(selectedReport.citizenUid, selectedReport.id, `Verdict Log: Command set case status to ${reviewStatus}`, reviewStatus);
      setSelectedReport(null);
      setReviewComment('');
      setReviewPhoto('');
      alert('Official verdict broadcasted to transparency feed.');
    } catch (err) {
      alert("Command broadcast failed: Memory synchronization error.");
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString()} Cr`;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Global Hidden Inputs */}
      <input ref={reviewInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'review')} />
      <input ref={budgetInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'budget')} />
      <input ref={profileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />

       <header className="flex justify-between items-center pb-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff00aa] rounded-xl flex items-center justify-center font-bold text-white shadow-lg magenta-glow text-lg uppercase tracking-tighter">Cmd</div>
          <h1 className="text-2xl font-bold text-white tracking-tighter uppercase">Treasury Command</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowProfileModal(true)} className="w-10 h-10 rounded-full bg-[#132f4c] border border-[#ff00aa]/30 flex items-center justify-center overflow-hidden hover:border-[#ff00aa] transition-all">
            {user?.photoURL ? <img src={user.photoURL} alt="Officer" className="w-full h-full object-cover" /> : <div className="text-[#ff00aa]"><ICONS.User /></div>}
          </button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><ICONS.Logout /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Management Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glossy-card rounded-[32px] p-8">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3"><ICONS.Trend /> Treasury Control</h3>
            <div className="space-y-4">
              {taxData.map(tax => (
                <button 
                  key={tax.id} 
                  onClick={() => { setShowBudgetModal(tax); setBudgetForm({ taxAllocated: String(tax.taxAllocated), taxUsed: String(tax.taxUsed), statement: tax.statement || '', statementProofUrl: tax.statementProofUrl || '' }); }} 
                  className="w-full p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all group shadow-inner"
                >
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{tax.name}</p>
                    <p className="text-xs text-[#00d4ff] font-black">{formatCurrency(tax.taxCollected)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-900 border border-white/5 group-hover:bg-[#ff00aa]/20 group-hover:text-[#ff00aa] transition-all"><ICONS.Settings /></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Queue Column */}
        <div className="lg:col-span-8">
          <div className="glossy-card rounded-[40px] p-10 h-[750px] flex flex-col shadow-2xl border-t border-white/10">
            <h3 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">National Audit Registry</h3>
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-600 text-[10px] uppercase border-b border-gray-800 font-black tracking-widest">
                    <th className="pb-6 px-4">Citizen Identity</th>
                    <th className="pb-6 px-4">Audit Domain</th>
                    <th className="pb-6 px-4">Logs</th>
                    <th className="pb-6 px-4">Status</th>
                    <th className="pb-6 px-4 text-right">Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {reports.map((r) => (
                    <tr key={r.id} className={`group hover:bg-white/[0.03] transition-all ${selectedReport?.id === r.id ? 'bg-[#ff00aa]/10' : ''}`}>
                      <td className="py-5 px-4"><div className="flex flex-col"><span className="text-xs font-black text-white tracking-tight">{r.citizenName}</span><span className="text-[9px] text-gray-600 font-bold uppercase">{r.citizenEmail}</span></div></td>
                      <td className="py-5 px-4 text-[11px] text-gray-400 font-black uppercase tracking-tighter">{r.taxType}</td>
                      <td className="py-5 px-4"><span className="text-[10px] text-white font-black bg-white/5 px-3 py-1 rounded-full uppercase border border-white/5">{(r.updates || []).length} Updates</span></td>
                      <td className="py-5 px-4"><span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm ${r.status === 'Resolved' ? 'bg-[#00ff9d]/20 text-[#00ff9d]' : r.status === 'Declined' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'}`}>{r.status}</span></td>
                      <td className="py-5 px-4 text-right">
                        <button 
                          onClick={() => { 
                            setSelectedReport(r); 
                            setReviewStatus(r.status); 
                            setReviewComment(r.reply || ''); 
                            setReviewPhoto(''); 
                          }} 
                          className="px-5 py-2 bg-gradient-to-r from-[#ff00aa]/10 to-[#ff00aa]/20 text-[#ff00aa] rounded-xl text-[10px] font-black uppercase border border-[#ff00aa]/30 hover:bg-[#ff00aa]/30 shadow-lg transition-all active:scale-95"
                        >
                          Audit Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Case Review Modal (POPUP) */}
      {selectedReport && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95 duration-300"
          onClick={() => setSelectedReport(null)}
        >
          <div 
            className="w-full max-w-2xl glossy-card rounded-[40px] p-10 border border-[#ff00aa]/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#ff00aa]/10 rounded-2xl flex items-center justify-center text-[#ff00aa]">
                    <ICONS.File />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Case Review</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-60">Audit ID: {selectedReport.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all">✕</button>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                <section className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Citizen Statement</h4>
                  <p className="text-gray-200 text-sm italic leading-relaxed">"{selectedReport.description}"</p>
                  {selectedReport.proofUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 h-40">
                      <img src={selectedReport.proofUrl} className="w-full h-full object-cover" alt="Citizen Proof" />
                    </div>
                  )}
                </section>

                <form onSubmit={handleCaseReview} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Verdict Pipeline</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => setReviewStatus('Declined')} className={`py-3 rounded-xl text-[10px] font-black transition-all border ${reviewStatus === 'Declined' ? 'bg-red-500 text-white border-red-400 shadow-lg' : 'bg-gray-900 text-gray-500 border-white/5 hover:bg-white/5'}`}>DECLINE</button>
                      <button type="button" onClick={() => setReviewStatus('Investigating')} className={`py-3 rounded-xl text-[10px] font-black transition-all border ${reviewStatus === 'Investigating' ? 'bg-yellow-500 text-white border-yellow-400 shadow-lg' : 'bg-gray-900 text-gray-500 border-white/5 hover:bg-white/5'}`}>ONGOING</button>
                      <button type="button" onClick={() => setReviewStatus('Resolved')} className={`py-3 rounded-xl text-[10px] font-black transition-all border ${reviewStatus === 'Resolved' ? 'bg-green-500 text-white border-green-400 shadow-lg' : 'bg-gray-900 text-gray-500 border-white/5 hover:bg-white/5'}`}>RESOLVE</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Official Verdict Note</label>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-5 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff00aa] transition-all resize-none" placeholder="Enter formal audit feedback for the citizen..." rows={4} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Command Evidence (Optional)</label>
                    {reviewPhoto ? (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
                        <img src={reviewPhoto} className="w-full h-48 object-cover" alt="Review Proof" />
                        <button type="button" onClick={() => setReviewPhoto('')} className="absolute top-4 right-4 bg-red-500 p-2.5 rounded-full text-white text-[10px] shadow-2xl hover:bg-red-600 transition-all border border-white/20">✕</button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        disabled={isProcessingFile}
                        onClick={() => reviewInputRef.current?.click()} 
                        className={`flex flex-col items-center justify-center gap-3 w-full h-32 bg-gray-900 border-2 border-dashed border-gray-800 rounded-[32px] cursor-pointer hover:border-[#ff00aa]/50 transition-all group ${isProcessingFile ? 'animate-pulse' : ''}`}
                      >
                         <div className="p-3 bg-white/5 rounded-2xl group-hover:text-[#ff00aa] transition-colors"><ICONS.Camera /></div>
                         <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{isProcessingFile ? 'Processing...' : 'Upload Sync Proof'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setSelectedReport(null)} className="flex-1 py-4 border border-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                    <button type="submit" className="flex-2 py-4 bg-gradient-to-r from-[#ff00aa] to-[#cc0088] text-white rounded-2xl font-black text-xs shadow-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 magenta-glow">Transmit Verdict</button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Budget Synchronization Modal */}
      {showBudgetModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in zoom-in-95"
          onClick={() => setShowBudgetModal(null)}
        >
          <div 
            className="w-full max-w-2xl glossy-card rounded-[48px] p-12 border border-[#ff00aa]/40 shadow-[0_0_80px_rgba(255,0,170,0.2)] overflow-y-auto max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Command Control: {showBudgetModal.name}</h3>
            <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-10 opacity-60">Synchronizing Treasury Deployment Logs</p>
            
            <div className="grid grid-cols-2 gap-8 my-10">
               <div className="p-8 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-[32px] shadow-inner">
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Aggregate Inflow</p>
                 <p className="text-3xl font-black text-[#00d4ff] tracking-tighter">{formatCurrency(showBudgetModal.taxCollected)}</p>
               </div>
               <div className="p-8 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-[32px] shadow-inner">
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-2">Net Treasury Pool</p>
                 <p className="text-3xl font-black text-[#00ff9d] tracking-tighter">{formatCurrency(showBudgetModal.taxCollected - Number(budgetForm.taxUsed))}</p>
               </div>
            </div>

            <form onSubmit={handleBudgetUpdate} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[11px] font-black text-gray-600 uppercase mb-3 ml-1 tracking-widest">Allocation (₹ Cr)</label>
                  <input type="number" required value={budgetForm.taxAllocated} onChange={(e) => setBudgetForm({...budgetForm, taxAllocated: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#ff00aa] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-600 uppercase mb-3 ml-1 tracking-widest">Deployment (₹ Cr)</label>
                  <input type="number" required value={budgetForm.taxUsed} onChange={(e) => setBudgetForm({...budgetForm, taxUsed: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#ff00aa] transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-black text-gray-600 uppercase mb-3 ml-1 tracking-widest">Official Breakdown</label>
                <textarea required value={budgetForm.statement} onChange={(e) => setBudgetForm({...budgetForm, statement: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff00aa] transition-all resize-none italic" rows={3} placeholder="Provide official audit deployment statement..." />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-600 uppercase mb-3 ml-1 tracking-widest">Audit Evidence Photo</label>
                {budgetForm.statementProofUrl ? (
                  <div className="relative w-full h-48 rounded-[32px] overflow-hidden mb-2 shadow-2xl border border-white/10">
                    <img src={budgetForm.statementProofUrl} className="w-full h-full object-cover" alt="Budget Proof" />
                    <button type="button" onClick={() => setBudgetForm(p => ({...p, statementProofUrl: ''}))} className="absolute top-4 right-4 bg-red-500 text-white p-2.5 rounded-full shadow-2xl hover:bg-red-600 transition-all border border-white/20">✕</button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    disabled={isProcessingFile}
                    onClick={() => budgetInputRef.current?.click()} 
                    className={`flex flex-col items-center justify-center gap-3 w-full h-40 bg-gray-950 border-2 border-dashed border-gray-800 rounded-[32px] cursor-pointer hover:border-[#ff00aa]/40 transition-all group ${isProcessingFile ? 'animate-pulse' : ''}`}
                  >
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:text-[#ff00aa] transition-colors"><ICONS.Camera /></div>
                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{isProcessingFile ? 'Processing...' : 'Upload Sync Evidence'}</span>
                  </button>
                )}
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setShowBudgetModal(null)} className="flex-1 py-5 border border-gray-800 text-gray-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:text-white hover:bg-white/5 transition-all">Discard Changes</button>
                <button type="submit" className="flex-1 py-5 bg-gradient-to-r from-[#ff00aa] to-[#cc0088] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all magenta-glow">Confirm Audit Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Identity Update Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="w-full max-w-md glossy-card rounded-[48px] p-12 border border-[#ff00aa]/30 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Officer Identity</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-10 opacity-60">Security Personnel Command</p>
            <div className="space-y-8 text-center">
              <div className="w-28 h-28 rounded-full border-2 border-[#ff00aa] mx-auto overflow-hidden bg-[#0a1929] flex items-center justify-center shadow-[0_0_30px_rgba(255,0,170,0.2)]">
                {profileForm.photoURL ? <img src={profileForm.photoURL} alt="Officer" className="w-full h-full object-cover" /> : <div className="text-[#ff00aa] scale-[2.5]"><ICONS.User /></div>}
              </div>
              <button 
                type="button" 
                disabled={isProcessingFile}
                onClick={() => profileInputRef.current?.click()} 
                className="bg-[#ff00aa]/10 text-[#ff00aa] text-[10px] font-black px-10 py-4 rounded-full border border-[#ff00aa]/30 hover:bg-[#ff00aa]/20 transition-all uppercase tracking-widest shadow-lg flex items-center gap-3 mx-auto"
              >
                <ICONS.Camera />
                {isProcessingFile ? 'Processing...' : 'Update Visual ID'}
              </button>
              <form onSubmit={(e) => { e.preventDefault(); updateUser(profileForm); setShowProfileModal(false); }} className="space-y-4 pt-4">
                <input type="text" required value={profileForm.displayName} onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})} className="w-full bg-[#0a1929] border border-gray-700 rounded-2xl px-6 py-4 text-white text-center font-bold outline-none focus:ring-2 focus:ring-[#ff00aa] transition-all" placeholder="Officer Name" />
                <button type="submit" className="w-full py-5 bg-[#ff00aa] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95">Apply Audit Synchronization</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficialDashboard;
