
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../App';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, LabelList
} from 'recharts';
import { ICONS } from '../constants';
import { useNavigate } from 'react-router';
import { TaxReport, TaxCategory, TaxNotification, AppUser } from '../types';
import Cropper, { Area } from 'react-easy-crop';
import confetti from 'canvas-confetti';
import { getRealTaxData } from '../geminiService';

const CitizenDashboard: React.FC = () => {
  const { user, logout, updateUser, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<TaxReport | null>(null);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editFormData, setEditFormData] = useState({ description: '', proofUrls: [] as string[] });
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [isAIActive, setIsAIActive] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('taxwatch_last_sync'));

  const [graphType, setGraphType] = useState<'pie' | 'bar'>('pie');
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [taxData, setTaxData] = useState<TaxCategory[]>([]);
  const [allocationData, setAllocationData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<TaxNotification[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [formData, setFormData] = useState({ taxType: 'Income Tax', description: '', proofUrls: [] as string[] });
  
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    isPrivate: user?.isPrivate || false
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        isPrivate: user.isPrivate || false
      });
    }
  }, [user]);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);
  const editReportInputRef = useRef<HTMLInputElement>(null);

  const loadLocalData = useCallback(() => {
    const storedReports = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    const storedTaxData = JSON.parse(localStorage.getItem('taxwatch_tax_data') || '[]');
    const storedNotifs = JSON.parse(localStorage.getItem('taxwatch_notifications') || '[]');
    const storedAllocation = JSON.parse(localStorage.getItem('taxwatch_allocation') || '[]');
    
    const userReports = storedReports.filter((r: any) => r.citizenUid === user?.uid);
    setReports(userReports);
    setTaxData(storedTaxData);
    
    const userNotifs = storedNotifs.filter((n: any) => n.recipientUid === user?.uid);
    setNotifications(userNotifs);
    
    if (storedAllocation.length > 0) {
      setAllocationData(storedAllocation);
    }
  }, [user]);

  const fetchAIData = async (force = false) => {
    if (loadingData) return;
    setLoadingData(true);
    const sectors = await getRealTaxData();
    if (sectors) {
      setAllocationData(sectors);
      localStorage.setItem('taxwatch_allocation', JSON.stringify(sectors));
      const now = new Date().toLocaleTimeString();
      setLastSync(now);
      localStorage.setItem('taxwatch_last_sync', now);
      setIsAIActive(true);
      if (force) confetti({ particleCount: 100, spread: 70 });
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadLocalData();
    fetchAIData();
  }, [loadLocalData]);

  const markNotifsRead = () => {
    const stored = JSON.parse(localStorage.getItem('taxwatch_notifications') || '[]');
    const updated = stored.map((n: any) => n.recipientUid === user?.uid ? { ...n, read: true } : n);
    localStorage.setItem('taxwatch_notifications', JSON.stringify(updated));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(profileForm);
    setShowProfileModal(false);
    setToastMessage("Identity protocol updated.");
  };

  const handleUpdateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportDetail) return;
    
    const all = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    const updatedReports = all.map((r: TaxReport) => 
      r.id === selectedReportDetail.id 
      ? { ...r, description: editFormData.description, proofUrls: editFormData.proofUrls, updatedAt: new Date().toISOString() } 
      : r
    );
    
    localStorage.setItem('taxwatch_reports', JSON.stringify(updatedReports));
    loadLocalData();
    setIsEditingReport(false);
    setSelectedReportDetail(updatedReports.find(r => r.id === selectedReportDetail.id));
    setToastMessage("Signal parameters calibrated successfully.");
    confetti({ particleCount: 50 });
  };

  const handleCropDone = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const img = await new Promise<HTMLImageElement>((resolve) => { 
        const i = new Image(); 
        i.onload = () => resolve(i); 
        i.src = imageToCrop; 
      });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      setProfileForm(p => ({ ...p, photoURL: canvas.toDataURL('image/jpeg') }));
      setImageToCrop(null);
    }
  };

  const onCropComplete = useCallback((_ca: any, cap: Area) => setCroppedAreaPixels(cap), []);

  const handleDownloadBill = () => {
    const bill = `TAXWATCH AI - OFFICIAL FISCAL RECEIPT\nCitizen: ${user?.displayName}\nID: ${user?.uid}\nTax Paid: ₹${user?.taxPaid?.toLocaleString()}\nAudit Score: 780\nTimestamp: ${new Date().toLocaleString()}`;
    const blob = new window.Blob([bill], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax_receipt_${user?.uid}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    setToastMessage("Verified fiscal receipt generated.");
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newReport: TaxReport = {
      id: `TW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      citizenUid: user.uid,
      citizenEmail: user.email,
      citizenName: user.displayName || 'Anonymous',
      citizenUsername: user.username || 'user',
      taxType: formData.taxType,
      description: formData.description,
      proofUrls: formData.proofUrls,
      status: 'Pending',
      progress: 5,
      updates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: [], dislikes: [], comments: []
    };
    const all = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    localStorage.setItem('taxwatch_reports', JSON.stringify([newReport, ...all]));
    setShowReportModal(false);
    setFormData({ taxType: 'Income Tax', description: '', proofUrls: [] });
    setToastMessage("Issue signal broadcasted to national nodes.");
    loadLocalData();
    confetti({ particleCount: 100, spread: 50 });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700 pb-32">
      {fullImage && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-3xl animate-in fade-in zoom-in-95" onClick={() => setFullImage(null)}>
           <div className="relative max-w-7xl max-h-screen">
              <img src={fullImage} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
              <button className="absolute -top-12 -right-12 text-white text-3xl hover:scale-110 transition-transform font-black">✕</button>
           </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[5000] px-8 py-4 bg-[#00d4ff] text-black font-black uppercase tracking-widest rounded-2xl shadow-2xl animate-in slide-in-from-top-10">
          {toastMessage}
          {setTimeout(() => setToastMessage(null), 3000) && ""}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-[4500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => { setSelectedReportDetail(null); setIsEditingReport(false); }}>
           <div className="max-w-3xl w-full glossy-card rounded-[48px] p-10 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar border-t-8 border-[#00d4ff]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[#00d4ff] text-xs font-black uppercase tracking-widest mb-1">{selectedReportDetail.id}</p>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Signal Analysis</h2>
                 </div>
                 <button onClick={() => { setSelectedReportDetail(null); setIsEditingReport(false); }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-gray-400">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                       <p className="text-[10px] text-gray-500 font-black uppercase mb-3">Signal Parameters</p>
                       <div className="space-y-4">
                          <div>
                             <p className="text-[9px] text-gray-600 font-bold uppercase">Classification</p>
                             <p className="text-white font-bold">{selectedReportDetail.taxType}</p>
                          </div>
                          <div>
                             <p className="text-[9px] text-gray-600 font-bold uppercase">Status</p>
                             <span className="px-3 py-1 bg-[#00d4ff]/20 text-[#00d4ff] text-[10px] font-black rounded-lg uppercase">{selectedReportDetail.status}</span>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] text-gray-500 font-black uppercase">Observed Discrepancy</p>
                            {!isEditingReport && selectedReportDetail.status !== 'Resolved' && (
                                <button onClick={() => { setIsEditingReport(true); setEditFormData({ description: selectedReportDetail.description, proofUrls: selectedReportDetail.proofUrls || [] }); }} className="text-[9px] font-black text-[#00d4ff] uppercase hover:underline">Calibrate Log</button>
                            )}
                        </div>
                        
                        {isEditingReport ? (
                            <form onSubmit={handleUpdateReport} className="space-y-4">
                                <textarea 
                                    value={editFormData.description} 
                                    onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                                    className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#00d4ff] min-h-[100px]"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {editFormData.proofUrls.map((url, i) => (
                                        <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden group">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setEditFormData({...editFormData, proofUrls: editFormData.proofUrls.filter((_, idx) => idx !== i)})} className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => editReportInputRef.current?.click()} className="w-14 h-14 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#00d4ff]"><ICONS.Plus /></button>
                                    <input ref={editReportInputRef} type="file" multiple className="hidden" accept="image/*" onChange={e => {
                                        if(e.target.files) {
                                            Array.from(e.target.files).forEach((file: File) => {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setEditFormData(p => ({...p, proofUrls: [...p.proofUrls, ev.target?.result as string]}));
                                                reader.readAsDataURL(file);
                                            });
                                        }
                                    }} />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 py-3 bg-[#00d4ff] text-black text-[10px] font-black rounded-xl uppercase">Commit Changes</button>
                                    <button type="button" onClick={() => setIsEditingReport(false)} className="px-4 py-3 bg-white/5 text-gray-500 text-[10px] font-black rounded-xl uppercase">Abort</button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-xs text-gray-300 leading-relaxed italic">"{selectedReportDetail.description}"</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                       {selectedReportDetail.proofUrls?.map((url, i) => (
                          <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#00d4ff] transition-all" onClick={() => setFullImage(url)}>
                             <img src={url} className="w-full h-full object-cover" />
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Official Audit Feed</p>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                       {selectedReportDetail.updates.length === 0 ? (
                          <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                             <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Awaiting official intercept...</p>
                          </div>
                       ) : (
                          selectedReportDetail.updates.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(upd => (
                             <div key={upd.id} className="p-6 bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-3xl space-y-4">
                                <div className="flex justify-between items-center">
                                   <p className="text-[9px] font-black text-[#00ff9d] uppercase">Audit Response</p>
                                   <p className="text-[8px] text-gray-600 font-bold uppercase">{new Date(upd.timestamp).toLocaleString()}</p>
                                </div>
                                <p className="text-xs text-white leading-relaxed">{upd.text}</p>
                                {upd.mediaUrls && upd.mediaUrls.length > 0 && (
                                   <div className="flex flex-wrap gap-2">
                                      {upd.mediaUrls.map((m, i) => (
                                         <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => setFullImage(m)}>
                                            <img src={m} className="w-full h-full object-cover" />
                                         </div>
                                      ))}
                                   </div>
                                )}
                                <div className="pt-2 border-t border-white/5">
                                   <p className="text-[8px] text-gray-500 font-black uppercase">Officer: @{upd.officialName}</p>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-[3500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => { setShowNotifModal(false); markNotifsRead(); }}>
           <div className="max-w-lg w-full glossy-card rounded-[40px] p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar border-t-4 border-[#00d4ff]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Alert Feed</h3>
                 <button onClick={() => { setShowNotifModal(false); markNotifsRead(); }} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                 {notifications.length === 0 ? <p className="text-center text-gray-600 font-bold uppercase py-10">No alerts broadcasted.</p> : 
                   notifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl border ${n.read ? 'bg-white/5 border-white/5' : 'bg-[#00d4ff]/10 border-[#00d4ff]/30'} transition-all`}>
                       <div className="flex justify-between items-start mb-1">
                          <p className="text-[9px] font-black uppercase text-[#00d4ff]">{n.type.replace('_', ' ')}</p>
                          <p className="text-[8px] text-gray-600 uppercase font-bold">{new Date(n.timestamp).toLocaleDateString()}</p>
                       </div>
                       <p className="text-xs text-gray-200">{n.message}</p>
                       <p className="text-[9px] text-gray-500 font-bold mt-2">FROM: @{n.fromUserName}</p>
                    </div>
                 ))}
              </div>
              <button onClick={() => { setShowNotifModal(false); markNotifsRead(); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all mt-6">Acknowledge All</button>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-10 border-b border-gray-800">
        <div className="flex items-center gap-6">
          <button onClick={() => setShowProfileModal(true)} className="w-14 h-14 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-2xl flex items-center justify-center overflow-hidden group hover:border-[#00d4ff] transition-all relative">
             {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="font-black text-[#00d4ff]">ID</div>}
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ICONS.Edit /></div>
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">{user?.displayName || 'Citizen'} Node</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified Taxpayer: @{user?.username}</p>
              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${isAIActive ? 'bg-[#00ff9d]/10 text-[#00ff9d] border-[#00ff9d]/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                Core Status: {isAIActive ? 'Active-Sync' : 'Safe-Mode'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setShowNotifModal(true)} className="relative p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-[#00d4ff]/50 transition-all text-gray-400 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">{unreadCount}</span>}
           </button>
           <button onClick={() => setShowReportModal(true)} className="px-6 py-3 bg-[#00d4ff] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">Report Discrepancy</button>
           <button onClick={toggleTheme} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-[#00d4ff]/50 transition-all text-gray-400">
              {theme === 'dark' ? <ICONS.Sun /> : <ICONS.Moon />}
           </button>
           <button onClick={logout} className="p-4 text-gray-400 hover:text-red-400 transition-colors"><ICONS.Logout /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="glossy-card rounded-[40px] p-10 bg-gradient-to-br from-[#132f4c] to-[#0a1929] border-t-4 border-t-[#00d4ff] shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">National allocation matrix</h2>
                {lastSync && <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Last synced: {lastSync}</p>}
              </div>
              <div className="flex bg-[#030812] p-1 rounded-xl">
                 <button onClick={() => setGraphType('pie')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${graphType === 'pie' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-500'}`}>Pie</button>
                 <button onClick={() => setGraphType('bar')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${graphType === 'bar' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-500'}`}>Bar</button>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {graphType === 'pie' ? (
                  <PieChart>
                    <Pie 
                      data={allocationData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={130} 
                      paddingAngle={5} 
                      dataKey="value" 
                      stroke="none"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true}
                    >
                      {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`₹${props.payload.amountCr} Cr (${value}%)`, `Sector: ${name}`]}
                      contentStyle={{ background: '#0a1929', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '30px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'black' }} />
                  </PieChart>
                ) : (
                  <BarChart data={allocationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#444" fontSize={10} fontVariant="black" />
                    <YAxis stroke="#444" fontSize={10} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0a1929', border: '1px solid #1e293b', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="#00d4ff" radius={[10, 10, 0, 0]} name="Allocation (%)">
                        <LabelList dataKey="value" position="top" fill="#00d4ff" fontSize={10} formatter={(v) => `${v}%`} />
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">National Treasury Nodes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taxData.map(cat => (
                <div key={cat.id} className="glossy-card rounded-[32px] p-8 cursor-pointer hover:border-[#00d4ff]/40 transition-all group" onClick={() => navigate(`/tax/${cat.id}`)}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-white group-hover:text-[#00d4ff] transition-colors">{cat.name}</h4>
                    <ICONS.Trend />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                      <span>Deployment Rate</span>
                      <span>₹{cat.taxUsed.toLocaleString()} Cr ({( (cat.taxUsed / (cat.taxAllocated || 1)) * 100 ).toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00d4ff]" style={{ width: `${(cat.taxUsed / (cat.taxAllocated || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="glossy-card rounded-[40px] p-10 space-y-8">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Verified Contributions</h3>
            <div className="p-8 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-[32px] text-center shadow-inner">
              <p className="text-[10px] text-[#00d4ff] font-bold uppercase mb-2">Total Tax Authenticated</p>
              <p className="text-4xl font-black text-white tracking-tighter">₹{user?.taxPaid?.toLocaleString()}</p>
            </div>
            <button onClick={handleDownloadBill} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase hover:bg-white/10 transition-all shadow-md text-gray-300">
              <ICONS.Download /> Download Fiscal Receipt
            </button>
          </div>

          <div className="glossy-card rounded-[40px] p-10 space-y-8">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">My active signals</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
               {reports.length === 0 ? <p className="text-gray-600 text-[10px] font-bold uppercase text-center py-10">No active signals.</p> :
                 reports.map(r => (
                   <div key={r.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3 hover:border-[#00d4ff]/30 transition-all cursor-pointer" onClick={() => setSelectedReportDetail(r)}>
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] font-black text-white uppercase">{r.id}</p>
                         <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase ${r.status === 'Resolved' ? 'bg-[#00ff9d]/20 text-[#00ff9d]' : 'bg-blue-900/40 text-blue-400'}`}>{r.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{r.description}</p>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-[#00d4ff]" style={{ width: `${r.progress}%` }}></div>
                      </div>
                   </div>
                 ))
               }
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowProfileModal(false)}>
          <div className="max-w-md w-full glossy-card rounded-[40px] p-10 border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter text-center">Identity Calibration</h3>
            <div className="relative w-32 h-32 mx-auto mb-10 group">
              <div className="w-full h-full rounded-[40px] border-2 border-[#00d4ff]/40 overflow-hidden bg-[#030812] flex items-center justify-center p-1 shadow-2xl">
                {profileForm.photoURL ? <img src={profileForm.photoURL} className="w-full h-full object-cover rounded-[32px]" /> : <div className="text-[#00d4ff] text-3xl font-black">?</div>}
              </div>
              <button onClick={() => profileInputRef.current?.click()} className="absolute bottom-0 right-0 w-10 h-10 bg-[#00d4ff] rounded-2xl flex items-center justify-center text-black border-4 border-[#030812] shadow-xl"><ICONS.Camera /></button>
              <input ref={profileInputRef} type="file" className="hidden" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = () => setImageToCrop(r.result as string); r.readAsDataURL(file); }}} />
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase ml-2">Public Signature</label>
                <input type="text" value={profileForm.displayName} onChange={e => setProfileForm({...profileForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-center font-black" placeholder="Display Name" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-4 text-gray-500 font-bold uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-[#00d4ff] text-black rounded-2xl font-black uppercase shadow-lg">Commit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Signal Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div className="glossy-card rounded-[32px] p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Broadcast Discrepancy Signal</h2>
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Sector Domain</label>
                <select 
                  value={formData.taxType} 
                  onChange={e => setFormData({...formData, taxType: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                   {taxData.map(c => <option key={c.id} value={c.name} className="bg-[#0a1929]">{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Intelligence description</label>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-[#00d4ff] min-h-[120px]"
                  placeholder="Describe the discrepancy in detail..."
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Evidence Logs</label>
                <div className="flex flex-wrap gap-3">
                  {formData.proofUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                       <img src={url} className="w-full h-full object-cover" />
                       <button type="button" onClick={() => setFormData({...formData, proofUrls: formData.proofUrls.filter((_, idx) => idx !== i)})} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => reportInputRef.current?.click()} className="w-20 h-20 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#00d4ff] hover:border-[#00d4ff] transition-all"><ICONS.Plus /></button>
                  <input ref={reportInputRef} type="file" multiple className="hidden" accept="image/*" onChange={e => {
                    if(e.target.files) {
                      Array.from(e.target.files).forEach((file: File) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => setFormData(p => ({...p, proofUrls: [...p.proofUrls, ev.target?.result as string]}));
                        reader.readAsDataURL(file);
                      });
                    }
                  }} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Abort</button>
                <button type="submit" className="flex-1 py-4 bg-[#00d4ff] text-black font-black rounded-2xl uppercase shadow-xl active:scale-95 transition-all tracking-widest text-[10px]">Transmit Signal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center p-10">
          <div className="relative w-full max-w-xl aspect-square mb-10">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="flex gap-4 w-full max-w-xl">
             <button onClick={() => setImageToCrop(null)} className="flex-1 py-4 text-gray-400 font-bold uppercase">Abort</button>
             <button onClick={handleCropDone} className="flex-[2] py-4 bg-[#00ff9d] text-black font-black rounded-2xl uppercase">Process Frame</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
