
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, ComposedChart 
} from 'recharts';
import { TAX_ALLOCATION_DATA, ICONS } from '../constants';
import { useNavigate } from 'react-router';
import { TaxReport, TaxCategory, TaxNotification } from '../types';

const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glossy-card p-4 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{data.name}</p>
        <p className="text-lg font-black text-white">₹{(data.value * 14.2 / 10).toFixed(1)}T <span className="text-[10px] text-[#00d4ff] ml-1">({data.value}%)</span></p>
        <p className="text-[8px] text-gray-500 uppercase font-bold mt-1 tracking-tighter">Verified Audit Data</p>
      </div>
    );
  }
  return null;
};

const SegmentCardTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a1929] border border-white/10 p-2 rounded-lg shadow-2xl">
        <p className="text-[8px] font-black text-white uppercase tracking-tighter">
          {payload[0].name}: ₹{payload[0].value.toLocaleString()} Cr
        </p>
      </div>
    );
  }
  return null;
};

const CitizenDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<TaxReport | null>(null);
  const [activeNotif, setActiveNotif] = useState<TaxNotification | null>(null);

  const [feedType, setFeedType] = useState<'my' | 'global'>('global');
  const [graphType, setGraphType] = useState<'pie' | 'bar'>('pie');
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [taxData, setTaxData] = useState<TaxCategory[]>([]);
  const [notifications, setNotifications] = useState<TaxNotification[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [formData, setFormData] = useState({ taxType: 'Income Tax', description: '', proofUrl: '' });
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = () => {
      const storedReports = localStorage.getItem('taxwatch_reports');
      const storedTaxData = localStorage.getItem('taxwatch_tax_data');
      const storedNotifs = localStorage.getItem('taxwatch_notifications');
      
      if (storedReports) {
        const allReports: TaxReport[] = JSON.parse(storedReports);
        setReports(feedType === 'my' ? allReports.filter(r => r.citizenUid === user?.uid) : allReports);
      }
      if (storedTaxData) setTaxData(JSON.parse(storedTaxData));
      if (storedNotifs) {
        const allNotifs: TaxNotification[] = JSON.parse(storedNotifs);
        setNotifications(allNotifs.filter(n => n.recipientUid === user?.uid));
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user, feedType]);

  const markNotifRead = (id: string) => {
    const allNotifs: TaxNotification[] = JSON.parse(localStorage.getItem('taxwatch_notifications') || '[]');
    const updated = allNotifs.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('taxwatch_notifications', JSON.stringify(updated));
    setNotifications(updated.filter(n => n.recipientUid === user?.uid));
  };

  const handleNotifClick = (notif: TaxNotification) => {
    markNotifRead(notif.id);
    setActiveNotif(notif);
  };

  const jumpToReportFromNotif = (reportId: string) => {
    setActiveNotif(null);
    setShowNotifModal(false);
    const targetReport = reports.find(r => r.id === reportId);
    if (targetReport) {
      setSelectedReportDetail(targetReport);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptHash = Math.random().toString(36).substring(2, 12).toUpperCase();
    const receiptContent = `
=========================================
      TAXWATCH AI - OFFICIAL RECEIPT
=========================================
TRANSACTION ID: TX-${receiptHash}
DATE: ${new Date().toLocaleString()}
CITIZEN NAME: ${user?.displayName || 'Anonymous'}
CITIZEN EMAIL: ${user?.email}
AUDIT SCORE: 780
-----------------------------------------
CONTRIBUTION FY 2024: ₹1,81,800.00
STATUS: SECURELY VERIFIED
-----------------------------------------
This digital receipt is verified by the 
National Treasury Command and TaxWatch AI 
Fiscal Transparency Protocols.
=========================================
    `;
    
    const element = document.createElement("a");
    const file = new Blob([receiptContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `TaxWatch_Receipt_${receiptHash.slice(0, 5)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert("Receipt generated and downloaded successfully.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isProfile: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert("File too large. Please select an image under 1MB to ensure sync stability.");
        return;
      }
      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        if (isProfile) {
          setProfileForm(prev => ({ ...prev, photoURL: base64String }));
        } else {
          setFormData(prev => ({ ...prev, proofUrl: base64String }));
        }
        e.target.value = '';
        setIsProcessingFile(false);
      };
      reader.onerror = (err) => {
        console.error("FileReader Error:", err);
        alert("Failed to read the file. Please try again with a different image.");
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: TaxReport = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      citizenUid: user?.uid || '',
      citizenEmail: user?.email || '',
      citizenName: user?.displayName || 'Anonymous Citizen',
      taxType: formData.taxType,
      description: formData.description,
      proofUrl: formData.proofUrl,
      status: 'Pending',
      progress: 5,
      updates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allReports = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    try {
      localStorage.setItem('taxwatch_reports', JSON.stringify([newReport, ...allReports]));
      setFormData({ taxType: taxData[0]?.name || 'Income Tax', description: '', proofUrl: '' });
      setShowReportModal(false);
      alert('Audit case synchronized with National Command.');
    } catch (err) {
      alert("Storage limit exceeded. Please try again with a smaller image or shorter text.");
    }
  };

  const handleGraphInteraction = (data: any) => {
    if (!data) return;
    const categoryName = data.name || data.activePayload?.[0]?.payload?.name;
    const category = taxData.find(c => c.name.toLowerCase().includes(categoryName?.toLowerCase()));
    if (category) {
      navigate(`/tax/${category.id}`);
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString()} Cr`;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <input ref={profileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, true)} />
      <input ref={reportInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, false)} />

      <header className="flex justify-between items-center pb-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00d4ff] rounded-xl flex items-center justify-center font-bold text-white shadow-lg cyan-glow text-lg uppercase tracking-tighter">Tax</div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tighter uppercase">Audit Hub</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNotifModal(true)} className="relative p-2 bg-[#132f4c] border border-white/10 rounded-xl hover:border-[#00d4ff]/50 transition-all group">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-[#00d4ff]"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff00aa] text-white text-[8px] font-black flex items-center justify-center rounded-full animate-bounce">{unreadCount}</span>}
          </button>
          <button onClick={() => setShowProfileModal(true)} className="w-10 h-10 rounded-full bg-[#132f4c] border border-[#00d4ff]/30 flex items-center justify-center overflow-hidden hover:border-[#00d4ff] transition-all group">
            {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <div className="text-[#00d4ff]"><ICONS.User /></div>}
          </button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><ICONS.Logout /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="glossy-card rounded-[32px] p-8 text-center shadow-xl border-t border-white/10">
            <div className="relative group w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#00d4ff] flex items-center justify-center bg-[#0a1929] shadow-inner">
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <div className="text-[#00d4ff] scale-150"><ICONS.User /></div>}
              </div>
              <button onClick={() => setShowProfileModal(true)} className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.Camera /></button>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight truncate px-2">{user?.displayName}</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Citizen Audit Score: 780</p>
            
            <div className="mt-8 space-y-3">
              <button onClick={() => setShowReportModal(true)} className="w-full py-4 bg-gradient-to-r from-[#ff00aa] to-[#cc0088] text-white rounded-xl font-black shadow-lg magenta-glow transition-all hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-widest">Open Audit Case</button>
              <button onClick={handleDownloadReceipt} className="w-full py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Download Receipt</button>
            </div>
          </div>
          
          <div className="glossy-card rounded-[24px] p-6 bg-gradient-to-b from-[#132f4c] to-[#0a1929]">
            <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Fiscal Contribution</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Contribution '24</p>
                  <p className="text-xl font-black text-[#00ff9d] tracking-tighter">₹1,81,800</p>
                </div>
                <div className="text-[9px] text-[#00ff9d] font-black">+12.4%</div>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff9d]" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-8">
          <div className="glossy-card rounded-[32px] p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">National Revenue Flow</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Strategic Expenditure Allocation (Total: ₹14.2T)</p>
              </div>
              <div className="flex bg-[#0a1929] p-1.5 rounded-2xl border border-white/10 shadow-inner">
                <button 
                  onClick={() => setGraphType('pie')} 
                  className={`p-2.5 rounded-xl transition-all ${graphType === 'pie' ? 'bg-[#00d4ff] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                </button>
                <button 
                  onClick={() => setGraphType('bar')} 
                  className={`p-2.5 rounded-xl transition-all ${graphType === 'bar' ? 'bg-[#00d4ff] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6"></path><path d="M6 20V10"></path><path d="M18 20V4"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                {graphType === 'pie' ? (
                  <PieChart>
                    <Pie 
                      data={TAX_ALLOCATION_DATA} 
                      cx="50%" 
                      cy="45%" 
                      innerRadius={80} 
                      outerRadius={105} 
                      paddingAngle={6} 
                      dataKey="value"
                      stroke="none"
                      onClick={(data) => handleGraphInteraction(data)}
                      style={{ cursor: 'pointer' }}
                      label={({ name, value }) => `${name} (${value}%)`}
                      labelLine={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                    >
                      {TAX_ALLOCATION_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<GlassTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.05em', paddingTop: '30px' }}/>
                  </PieChart>
                ) : (
                  <BarChart data={TAX_ALLOCATION_DATA} margin={{ top: 30, bottom: 10 }} onClick={(data) => handleGraphInteraction(data)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50} style={{ cursor: 'pointer' }}>
                      {TAX_ALLOCATION_DATA.map((entry, index) => <Cell key={`bar-${index}`} fill={entry.color} />)}
                      <LabelList dataKey="value" position="top" formatter={(v: any) => `${v}%`} style={{ fill: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Aggregate</p>
                <p className="text-3xl font-black text-white tracking-tighter">₹14.2T</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-white ml-2 uppercase tracking-tight">Audit Segment Command</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taxData.map((type) => (
                <button 
                  key={type.id} 
                  onClick={() => navigate(`/tax/${type.id}`)} 
                  className="glossy-card p-6 rounded-[28px] group relative overflow-hidden h-64 hover:border-[#00d4ff]/40 transition-all flex flex-col active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-4 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#132f4c] rounded-xl flex items-center justify-center text-[#00d4ff] group-hover:scale-110 transition-transform"><ICONS.Trend /></div>
                      <div className="text-left">
                        <span className="text-xs font-black text-white uppercase tracking-widest">{type.name}</span>
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Tax Domain Hub</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Efficiency Index</p>
                      <p className="text-sm text-[#00ff9d] font-black">{(type.taxUsed / type.taxAllocated * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Detailed Mini Chart inside Card */}
                  <div className="flex-1 w-full h-24 mb-4 z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={[{ name: 'Metrics', collected: type.taxCollected, allocated: type.taxAllocated, used: type.taxUsed }]} margin={{ left: -35, right: 10 }}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip content={<SegmentCardTooltip />} />
                        <Bar dataKey="collected" fill="#00d4ff" radius={[4, 4, 4, 4]} barSize={25} name="Total Inflow" />
                        <Bar dataKey="allocated" fill="#ffffff" opacity={0.1} radius={[4, 4, 4, 4]} barSize={25} name="Budget Limit" />
                        <Bar dataKey="used" fill="#ff00aa" radius={[4, 4, 4, 4]} barSize={25} name="Actual Deployment" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 z-10">
                    <div className="p-3 bg-[#0a1929]/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest mb-1">Total Inflow</p>
                      <p className="text-xs text-white font-black tracking-tighter">{formatCurrency(type.taxCollected)}</p>
                    </div>
                    <div className="p-3 bg-[#0a1929]/50 rounded-2xl border border-white/5">
                      <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest mb-1">Deployed</p>
                      <p className="text-xs text-[#ff00aa] font-black tracking-tighter">{formatCurrency(type.taxUsed)}</p>
                    </div>
                  </div>

                  {/* Background Aura */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#00d4ff]/10 transition-colors"></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="glossy-card rounded-[32px] p-8 flex flex-col h-[750px] shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Audit Stream</h4>
              <div className="flex bg-[#0a1929] p-1 rounded-xl border border-white/5">
                <button onClick={() => setFeedType('global')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg transition-all ${feedType === 'global' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-600'}`}>GLOBAL</button>
                <button onClick={() => setFeedType('my')} className={`px-3 py-1.5 text-[8px] font-black rounded-lg transition-all ${feedType === 'my' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-600'}`}>MY FEED</button>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
                  <ICONS.File />
                  <p className="text-[9px] uppercase font-black tracking-widest mt-4">No cases logged in system</p>
                </div>
              ) : reports.map((r) => (
                <button 
                  key={r.id} 
                  onClick={() => setSelectedReportDetail(r)}
                  className="w-full text-left p-5 bg-white/5 rounded-3xl border border-white/5 group hover:border-[#00d4ff]/40 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-black text-[#00d4ff] uppercase tracking-widest">{r.taxType}</span>
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm ${
                      r.status === 'Resolved' ? 'bg-green-500 text-white' : 
                      r.status === 'Declined' ? 'bg-red-500 text-white' :
                      r.status === 'Investigating' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-xs font-bold text-white mb-1 tracking-tight">{r.citizenName}</p>
                  <p className="text-[10px] text-gray-500 mb-4 leading-relaxed line-clamp-2">"{r.description}"</p>
                  
                  {r.proofUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 h-20 relative shadow-inner">
                      <img src={r.proofUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black text-white uppercase tracking-widest">Inspect Evidence</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff9d] transition-all duration-1000" style={{ width: `${r.progress}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-gray-600">{r.progress}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case Investigation Modal */}
      {selectedReportDetail && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in zoom-in-95 duration-500"
          onClick={() => setSelectedReportDetail(null)}
        >
          <div 
            className="w-full max-w-5xl max-h-[90vh] glossy-card rounded-[48px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-[#00d4ff]/10 rounded-[20px] flex items-center justify-center text-[#00d4ff] shadow-inner">
                    <ICONS.File />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Investigation: {selectedReportDetail.id}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest opacity-60">Verified National Audit Registry Log</p>
                 </div>
               </div>
               <button onClick={() => setSelectedReportDetail(null)} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 transition-all border border-white/10">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-10">
                     <section>
                        <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6">Reporter Identity</h4>
                        <div className="p-8 bg-white/[0.03] rounded-[32px] border border-white/5 space-y-6 shadow-inner">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#132f4c] to-black flex items-center justify-center text-[#00d4ff] font-black text-sm border border-[#00d4ff]/30 shadow-lg">
                                {selectedReportDetail.citizenName.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-lg font-bold text-white tracking-tight">{selectedReportDetail.citizenName}</p>
                                 <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{selectedReportDetail.citizenEmail}</p>
                              </div>
                           </div>
                           <div className="pt-6 border-t border-white/5">
                              <span className="text-[9px] font-black text-[#00d4ff] uppercase tracking-[0.2em] block mb-3">Audit Domain: {selectedReportDetail.taxType}</span>
                              <p className="text-gray-300 text-sm leading-relaxed italic opacity-90">"{selectedReportDetail.description}"</p>
                           </div>
                        </div>
                     </section>

                     {selectedReportDetail.proofUrl && (
                        <section>
                           <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6">Evidence Depository</h4>
                           <div className="rounded-[40px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] aspect-video relative group">
                              <img src={selectedReportDetail.proofUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Audit Evidence" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-8">
                                 <div className="flex justify-between items-center w-full">
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Metadata: {new Date(selectedReportDetail.createdAt).toLocaleDateString()}</p>
                                    <span className="text-[8px] bg-white/10 px-3 py-1 rounded-full text-white font-black uppercase">Verified Upload</span>
                                 </div>
                              </div>
                           </div>
                        </section>
                     )}
                  </div>

                  <div className="space-y-10">
                     <section>
                        <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-6">National Command Verdicts</h4>
                        <div className="space-y-5">
                           {(selectedReportDetail.updates || []).length === 0 ? (
                             <div className="p-10 text-center bg-white/[0.02] rounded-[32px] border border-dashed border-white/10 opacity-40">
                                <div className="mb-4 flex justify-center"><ICONS.Robot /></div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Awaiting Command Response Sequence</p>
                             </div>
                           ) : selectedReportDetail.updates.map((upd, idx) => (
                             <div key={idx} className="p-8 bg-gradient-to-br from-[#ff00aa]/5 to-transparent rounded-[32px] border border-[#ff00aa]/10 relative group">
                                <div className="flex justify-between items-center mb-4">
                                   <div className="flex items-center gap-3 text-[#ff00aa]">
                                      <div className="w-8 h-8 rounded-lg bg-[#ff00aa]/10 flex items-center justify-center"><ICONS.Robot /></div>
                                      <span className="text-[11px] font-black uppercase tracking-widest">Command Verdict</span>
                                   </div>
                                   <span className="text-[9px] text-gray-600 font-black uppercase">{new Date(upd.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-200 text-[13px] leading-relaxed shadow-sm">"{upd.text}"</p>
                                {upd.mediaUrl && (
                                  <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 h-40 shadow-xl group-hover:border-[#ff00aa]/40 transition-all duration-500">
                                     <img src={upd.mediaUrl} className="w-full h-full object-cover" alt="Official Attachment" />
                                  </div>
                                )}
                             </div>
                           ))}
                        </div>
                     </section>

                     <section className="p-10 bg-gradient-to-r from-[#00d4ff]/10 to-transparent rounded-[40px] border border-[#00d4ff]/20 shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-[11px] font-black text-[#00d4ff] uppercase tracking-[0.3em]">Audit Resolution Pipeline</h4>
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></div>
                             <span className="text-[11px] font-black text-white uppercase">{selectedReportDetail.status}</span>
                           </div>
                        </div>
                        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden mb-3 border border-white/5">
                           <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff9d] transition-all duration-1000 shadow-[0_0_10px_#00d4ff]" style={{ width: `${selectedReportDetail.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-60">Transparency Sync: Active</p>
                           <p className="text-xs text-[#00ff9d] font-black tracking-tighter">{selectedReportDetail.progress}% Processed</p>
                        </div>
                     </section>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Detail Popup */}
      {activeNotif && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in zoom-in-95"
          onClick={() => setActiveNotif(null)}
        >
          <div 
            className="w-full max-w-sm glossy-card rounded-[40px] p-10 border border-[#ff00aa]/30 shadow-2xl text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-[#ff00aa]/10 text-[#ff00aa] rounded-[24px] flex items-center justify-center mb-8 shadow-inner animate-pulse">
               <ICONS.Alert />
            </div>
            <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Audit Synchronization</h4>
            <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-6 opacity-60">National Command Command</p>
            <p className="text-sm text-gray-300 italic mb-10 leading-relaxed px-2">"{activeNotif.message}"</p>
            <div className="flex gap-4 w-full">
               <button onClick={() => setActiveNotif(null)} className="flex-1 py-4 border border-gray-800 rounded-2xl text-[10px] font-black uppercase text-gray-500 hover:text-white transition-all">Dismiss</button>
               <button onClick={() => jumpToReportFromNotif(activeNotif.reportId)} className="flex-1 py-4 bg-gradient-to-r from-[#00d4ff] to-[#008fb3] rounded-2xl text-[10px] font-black uppercase text-black shadow-lg cyan-glow transition-all active:scale-95">Inspect Case</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowNotifModal(false)}
        >
          <div 
            className="w-full max-w-md glossy-card rounded-[40px] p-10 border border-[#00d4ff]/30 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                   <div className="p-2 bg-[#00d4ff]/10 rounded-xl"><ICONS.Alert /></div>
                   Audit Alerts
                </h3>
                <button onClick={() => setShowNotifModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
             </div>
             <div className="space-y-4 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center">
                    <ICONS.Check />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-4">System Nominal: No Alerts</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button 
                      key={n.id} 
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left p-5 rounded-3xl border transition-all ${n.read ? 'bg-white/[0.03] border-white/5 opacity-60' : 'bg-[#00d4ff]/10 border-[#00d4ff]/30 shadow-xl'}`}
                    >
                       <p className={`text-xs font-bold ${n.read ? 'text-gray-400' : 'text-white'} leading-relaxed`}>{n.message}</p>
                       <div className="mt-3 flex justify-between items-center">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${n.status === 'Resolved' ? 'bg-green-500/20 text-green-400' : 'bg-[#00d4ff]/20 text-[#00d4ff]'}`}>{n.status}</span>
                          <span className="text-[8px] text-gray-600 font-black uppercase">{new Date(n.timestamp).toLocaleTimeString()}</span>
                       </div>
                    </button>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* Case Broadcast Modal */}
      {showReportModal && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className="w-full max-w-lg glossy-card rounded-[40px] p-12 border border-[#ff00aa]/30 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setShowReportModal(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white text-xl">✕</button>
            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Broadcast Audit</h3>
            <p className="text-xs text-gray-500 mb-10 uppercase tracking-widest font-black opacity-60">Synchronizing formal discrepancy report with National Command.</p>
            <form onSubmit={handleReportSubmit} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Expenditure Domain</label>
                <select value={formData.taxType} onChange={(e) => setFormData({...formData, taxType: e.target.value})} className="w-full bg-[#0a1929] border border-gray-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-[#ff00aa] text-xs font-black uppercase tracking-widest transition-all">
                  {taxData.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Factual Case Statement</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0a1929] border border-gray-700 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-[#ff00aa] resize-none placeholder-gray-700" placeholder="Provide precise details of the audit discrepancy..." />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Visual Evidence Proof</label>
                <div className="relative">
                  {formData.proofUrl ? (
                    <div className="relative w-full h-40 rounded-3xl overflow-hidden mb-2 shadow-2xl group border border-white/10">
                      <img src={formData.proofUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Case Proof" />
                      <button type="button" onClick={() => setFormData(p => ({...p, proofUrl: ''}))} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-2xl hover:bg-red-600 transition-colors border border-white/20">✕</button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      disabled={isProcessingFile}
                      onClick={() => reportInputRef.current?.click()} 
                      className={`flex flex-col items-center justify-center gap-3 w-full h-40 bg-[#0a1929] border-2 border-dashed border-gray-800 rounded-[32px] cursor-pointer hover:border-[#ff00aa]/60 transition-all group ${isProcessingFile ? 'animate-pulse opacity-50' : ''}`}
                    >
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:text-[#ff00aa] transition-colors">
                        <ICONS.Camera />
                      </div>
                      <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] group-hover:text-gray-400">
                        {isProcessingFile ? 'Processing...' : 'Capture/Select Evidence'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-gradient-to-r from-[#ff00aa] to-[#cc0088] text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all magenta-glow">Transmit Formal Audit</button>
            </form>
          </div>
        </div>
      )}

      {/* Profile/Identity Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in zoom-in-95"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="w-full max-w-md glossy-card rounded-[48px] p-12 border border-[#00d4ff]/30 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Citizen ID</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-10 opacity-60">Transparency Profile Command</p>
            <div className="space-y-8">
              <div className="w-28 h-28 rounded-full border-2 border-[#00d4ff] mx-auto overflow-hidden bg-[#0a1929] flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.2)] relative group">
                {profileForm.photoURL ? <img src={profileForm.photoURL} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-[#00d4ff] scale-[2.5]"><ICONS.User /></div>}
              </div>
              <button 
                type="button" 
                disabled={isProcessingFile}
                onClick={() => profileInputRef.current?.click()} 
                className="bg-[#00d4ff]/10 text-[#00d4ff] text-[10px] font-black px-10 py-4 rounded-full border border-[#00d4ff]/30 hover:bg-[#00d4ff]/20 transition-all uppercase tracking-widest shadow-lg flex items-center gap-3 mx-auto"
              >
                <ICONS.Camera />
                {isProcessingFile ? 'Processing...' : 'Update Identity Photo'}
              </button>
              <form onSubmit={(e) => { e.preventDefault(); updateUser(profileForm); setShowProfileModal(false); }} className="space-y-4 pt-4">
                <input type="text" required value={profileForm.displayName} onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})} className="w-full bg-[#0a1929] border border-gray-700 rounded-2xl px-6 py-4 text-white text-center font-bold outline-none focus:ring-2 focus:ring-[#00d4ff] transition-all" placeholder="Legal Name / Alias" />
                <button type="submit" className="w-full py-5 bg-[#00d4ff] text-black rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:opacity-90 active:scale-95 transition-all cyan-glow">Synchronize Identity</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
