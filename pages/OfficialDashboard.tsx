
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../App';
import { ICONS } from '../constants';
import { TaxReport, TaxCategory, ReportStatus, WorkProject, Interaction, TaxNotification, ProgressUpdate } from '../types';
import Cropper, { Area } from 'react-easy-crop';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router';

const OfficialDashboard: React.FC = () => {
  const { user, logout, updateUser, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'projects'>('reports');
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [taxData, setTaxData] = useState<TaxCategory[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState<TaxCategory | null>(null);
  const [selectedReport, setSelectedReport] = useState<TaxReport | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [selectedCategoryForProjects, setSelectedCategoryForProjects] = useState<string | null>(null);

  // Project Management States
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<WorkProject | null>(null);
  const [newProject, setNewProject] = useState<Partial<WorkProject>>({
    name: '',
    description: '',
    status: 'Planning',
    assignedBudget: 0,
    spentBudget: 0
  });

  const [reviewStatus, setReviewStatus] = useState<ReportStatus>('Investigating');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  
  const [budgetForm, setBudgetForm] = useState({
    taxAllocated: '0',
    taxUsed: '0',
    statement: '',
    proofUrls: [] as string[]
  });

  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || ''
  });

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        photoURL: user.photoURL || ''
      });
    }
  }, [user]);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const budgetInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const reviewPhotoInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(() => {
    const storedReports = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    const storedTaxData = JSON.parse(localStorage.getItem('taxwatch_tax_data') || '[]');
    setReports(storedReports);
    setTaxData(storedTaxData);
    if (storedTaxData.length > 0 && !selectedCategoryForProjects) {
        setSelectedCategoryForProjects(storedTaxData[0].id);
    }
  }, [selectedCategoryForProjects]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveTaxData = (updated: TaxCategory[]) => {
      setTaxData(updated);
      localStorage.setItem('taxwatch_tax_data', JSON.stringify(updated));
  };

  const addNotification = (notif: Omit<TaxNotification, 'id' | 'timestamp' | 'read'>) => {
    const all = JSON.parse(localStorage.getItem('taxwatch_notifications') || '[]');
    const newNotif: TaxNotification = {
      ...notif,
      id: `NT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    localStorage.setItem('taxwatch_notifications', JSON.stringify([newNotif, ...all]));
  };

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBudgetModal || !user) return;
    const updated = taxData.map(c => c.id === showBudgetModal.id ? {
      ...c, 
      taxAllocated: Number(budgetForm.taxAllocated),
      taxUsed: Number(budgetForm.taxUsed),
      taxRemaining: Number(budgetForm.taxAllocated) - Number(budgetForm.taxUsed),
      statement: budgetForm.statement,
      proofUrls: budgetForm.proofUrls,
      updatedAt: new Date().toISOString(),
      lastUpdatedByUid: user.uid,
      lastUpdatedByName: user.displayName || user.username
    } : c);
    saveTaxData(updated);
    setShowBudgetModal(null);
    confetti({ particleCount: 100, spread: 70 });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForProjects || !newProject.name) return;
    
    const project: WorkProject = {
      id: `PRJ-${Math.random().toString(36).substring(7).toUpperCase()}`,
      name: newProject.name!,
      description: newProject.description || '',
      status: newProject.status || 'Planning',
      assignedBudget: Number(newProject.assignedBudget) || 0,
      spentBudget: Number(newProject.spentBudget) || 0,
      progress: 0,
      feedbacks: [],
      isOfficial: true
    };

    const updated = taxData.map(cat => {
      if (cat.id === selectedCategoryForProjects) {
        return { ...cat, works: [project, ...(cat.works || [])] };
      }
      return cat;
    });

    saveTaxData(updated);
    setShowAddProjectModal(false);
    setNewProject({ name: '', description: '', status: 'Planning', assignedBudget: 0, spentBudget: 0 });
    confetti({ particleCount: 50 });
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForProjects || !editingProject) return;

    const updated = taxData.map(cat => {
      if (cat.id === selectedCategoryForProjects) {
        const updatedWorks = (cat.works || []).map(w => 
          w.id === editingProject.id ? { ...editingProject } : w
        );
        return { ...cat, works: updatedWorks };
      }
      return cat;
    });

    saveTaxData(updated);
    setEditingProject(null);
    confetti({ particleCount: 30, spread: 40 });
  };

  const handleDeleteProject = (projectId: string) => {
    if (!selectedCategoryForProjects || !window.confirm("Are you sure you want to terminate this activity node? All feedback data will be lost.")) return;

    const updated = taxData.map(cat => {
      if (cat.id === selectedCategoryForProjects) {
        const updatedWorks = (cat.works || []).filter(w => w.id !== projectId);
        return { ...cat, works: updatedWorks };
      }
      return cat;
    });

    saveTaxData(updated);
  };

  const onCropComplete = useCallback((_ca: any, cap: Area) => setCroppedAreaPixels(cap), []);
  const handleCropDone = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const img = await new Promise<HTMLImageElement>((resolve) => { 
        const i = new Image(); i.onload = () => resolve(i); i.src = imageToCrop; 
      });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
      setProfileForm(p => ({ ...p, photoURL: canvas.toDataURL('image/jpeg') }));
      setImageToCrop(null);
    }
  };

  const handleCaseReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !user) return;
    
    const all = JSON.parse(localStorage.getItem('taxwatch_reports') || '[]');
    const progressMap = { 'Pending': 5, 'Investigating': 40, 'Resolved': 100, 'Declined': 0 };
    
    const newUpdate: ProgressUpdate = {
        id: `UPD-${Date.now()}`,
        officialUid: user.uid,
        officialName: user.displayName || user.username,
        text: reviewComment,
        mediaUrls: reviewPhotos,
        mediaType: 'image',
        timestamp: new Date().toISOString(),
        likes: [],
        dislikes: [],
        comments: []
    };

    const updatedReports = all.map((r: TaxReport) => r.id === selectedReport.id ? {
      ...r, 
      status: reviewStatus, 
      progress: progressMap[reviewStatus],
      updates: [newUpdate, ...(r.updates || [])],
      updatedAt: new Date().toISOString()
    } : r);
    
    localStorage.setItem('taxwatch_reports', JSON.stringify(updatedReports));
    
    // Notify the citizen
    addNotification({
      recipientUid: selectedReport.citizenUid,
      reportId: selectedReport.id,
      message: `Official audit response received for report ${selectedReport.id}: Status shifted to ${reviewStatus}.`,
      type: 'VERDICT',
      status: reviewStatus,
      fromUid: user.uid,
      fromUserName: user.displayName || user.username
    });

    setReports(updatedReports);
    setSelectedReport(null);
    setReviewComment('');
    setReviewPhotos([]);
    confetti({ particleCount: 50 });
  };

  const selectedCategory = taxData.find(c => c.id === selectedCategoryForProjects);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700 pb-32">
       <input ref={profileInputRef} type="file" className="hidden" onChange={e => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = () => setImageToCrop(r.result as string); r.readAsDataURL(file); }}} />
       <input ref={budgetInputRef} type="file" className="hidden" multiple onChange={e => { if(e.target.files) Array.from(e.target.files).forEach((f: File) => { const r = new FileReader(); r.onload = (ev) => setBudgetForm(p => ({ ...p, proofUrls: [...p.proofUrls, ev.target?.result as string] })); r.readAsDataURL(f); }); }} />

       <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-10 border-b border-gray-800">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-[#ff00aa] rounded-2xl flex items-center justify-center font-black text-white shadow-lg text-xl">Cmd</div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Audit Command</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Authorized: @{user?.username}</p>
          </div>
        </div>
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
            <button onClick={() => setActiveTab('reports')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'reports' ? 'bg-[#ff00aa] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Incident Surveillance</button>
            <button onClick={() => setActiveTab('projects')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'projects' ? 'bg-[#ff00aa] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Activity Command</button>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={() => setShowProfileModal(true)} className="w-12 h-12 rounded-xl border border-[#ff00aa]/30 flex items-center justify-center overflow-hidden hover:border-[#ff00aa] relative group">
              {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="text-[#ff00aa] font-black">ID</div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ICONS.Edit /></div>
           </button>
           <button onClick={logout} className="p-4 text-gray-400 hover:text-red-400 transition-colors"><ICONS.Logout /></button>
        </div>
      </header>

      {activeTab === 'reports' ? (
        <div className="grid grid-cols-1 gap-8">
           {reports.length === 0 ? (
             <div className="p-20 text-center text-gray-600 font-black uppercase border-2 border-dashed border-white/5 rounded-[40px]">No active signals.</div>
           ) : (
             reports.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(r => (
               <div key={r.id} className="glossy-card rounded-[32px] p-8 flex flex-col lg:flex-row gap-8 hover:border-[#ff00aa]/30 transition-all cursor-pointer" onClick={() => setSelectedReport(r)}>
                  <div className="flex-1 space-y-4">
                     <div className="flex justify-between items-center"><p className="text-xs font-black text-[#ff00aa]">{r.id}</p><span className="text-[9px] font-black bg-white/5 px-3 py-1 rounded-lg uppercase">{r.status}</span></div>
                     <p className="text-white text-lg font-bold italic">"{r.description}"</p>
                     <p className="text-[9px] text-gray-500 font-bold uppercase">Source: @{r.citizenUsername}</p>
                  </div>
                  <button className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase hover:bg-[#ff00aa] transition-all self-center">Evaluate</button>
               </div>
             ))
           )}
        </div>
      ) : (
        <div className="space-y-12">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Sector Activity Command</h2>
                {selectedCategory && (
                   <button 
                     onClick={() => {
                        setBudgetForm({
                          taxAllocated: selectedCategory.taxAllocated.toString(),
                          taxUsed: selectedCategory.taxUsed.toString(),
                          statement: selectedCategory.statement || '',
                          proofUrls: selectedCategory.proofUrls || []
                        });
                        setShowBudgetModal(selectedCategory);
                     }}
                     className="px-3 py-1 bg-[#ff00aa]/10 text-[#ff00aa] border border-[#ff00aa]/30 rounded-lg text-[8px] font-black uppercase hover:bg-[#ff00aa] hover:text-white transition-all"
                   >
                     Calibrate Sector Budget
                   </button>
                )}
              </div>
              <button onClick={() => setShowAddProjectModal(true)} className="px-6 py-3 bg-[#00ff9d] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Upload New Sector Activity</button>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {taxData.map(c => <button key={c.id} onClick={() => setSelectedCategoryForProjects(c.id)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedCategoryForProjects === c.id ? 'bg-[#ff00aa] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{c.name}</button>)}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {selectedCategory?.works?.map(w => (
                <div key={w.id} className={`glossy-card rounded-[32px] p-6 space-y-4 hover:scale-[1.02] transition-all border-l-4 relative group/card ${w.isOfficial ? 'border-l-[#00ff9d]' : 'border-l-[#9d00ff]'}`}>
                   <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingProject(w); }} 
                        className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-gray-200 hover:text-[#00d4ff] transition-all border border-white/10"
                      >
                        <ICONS.Edit />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(w.id); }} 
                        className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-gray-200 hover:text-red-500 transition-all border border-white/10"
                      >
                        <ICONS.Trash />
                      </button>
                   </div>
                   <div className="flex justify-between items-start pr-16">
                      <h4 className="text-white font-bold text-sm leading-tight">{w.name}</h4>
                      <span className="text-[7px] font-black px-2 py-0.5 bg-white/5 rounded uppercase">{w.status}</span>
                   </div>
                   <p className={`text-[8px] font-black uppercase tracking-widest ${w.isOfficial ? 'text-[#00ff9d]' : 'text-[#9d00ff]'}`}>
                      {w.isOfficial ? 'Official' : `Citizen Log: @${w.creatorName}`}
                   </p>
                   <p className="text-[10px] text-gray-400 line-clamp-2">{w.description}</p>
                   <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[8px] text-gray-600 font-black uppercase">Budget</p>
                        <p className="text-xs font-black text-white">₹{w.assignedBudget} Cr</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-600 font-black uppercase">Spent</p>
                        <p className="text-xs font-black text-white">₹{w.spentBudget} Cr</p>
                      </div>
                   </div>
                   <button onClick={() => navigate(`/tax/${selectedCategoryForProjects}`)} className="w-full py-2 bg-white/5 text-[8px] font-black uppercase rounded-lg hover:bg-white/10">Audit Feedback Feed</button>
                </div>
              ))}
              {(!selectedCategory?.works || selectedCategory.works.length === 0) && (
                 <div className="col-span-full py-12 text-center text-gray-600 font-black uppercase border-2 border-dashed border-white/5 rounded-[32px]">No activity nodes mapped to this sector.</div>
              )}
           </div>
        </div>
      )}

      {/* Sector Budget Modal */}
      {showBudgetModal && (
         <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowBudgetModal(null)}>
            <div className="max-w-xl w-full glossy-card rounded-[40px] p-10 space-y-8 border-t-4 border-[#ff00aa]" onClick={e => e.stopPropagation()}>
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Calibrate Sector: {showBudgetModal.name}</h3>
               <form onSubmit={handleBudgetSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Allocated Budget (Cr)</label>
                        <input type="number" required value={budgetForm.taxAllocated} onChange={e => setBudgetForm({...budgetForm, taxAllocated: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Utilized Budget (Cr)</label>
                        <input type="number" required value={budgetForm.taxUsed} onChange={e => setBudgetForm({...budgetForm, taxUsed: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Official Statement</label>
                     <textarea value={budgetForm.statement} onChange={e => setBudgetForm({...budgetForm, statement: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none" rows={3} placeholder="Provide official audit context..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Audit Proof (Images)</label>
                     <div className="flex flex-wrap gap-2">
                        {budgetForm.proofUrls.map((url, i) => (
                           <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                              <img src={url} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setBudgetForm({...budgetForm, proofUrls: budgetForm.proofUrls.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                           </div>
                        ))}
                        <button type="button" onClick={() => budgetInputRef.current?.click()} className="w-16 h-16 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-600 hover:text-[#ff00aa] hover:border-[#ff00aa]"><ICONS.Plus /></button>
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setShowBudgetModal(null)} className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                     <button type="submit" className="flex-1 py-4 bg-[#ff00aa] text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg">Commit Sector Budget</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6" onClick={() => setShowProfileModal(false)}>
           <div className="max-w-md w-full glossy-card rounded-[40px] p-12 space-y-10 border border-[#ff00aa]/30 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Identity Calibration</h3>
              <div className="relative w-32 h-32 mx-auto group">
                 <div className="w-full h-full rounded-[40px] border-2 border-[#ff00aa]/40 overflow-hidden bg-[#030812] flex items-center justify-center p-1 shadow-2xl">
                    {profileForm.photoURL ? <img src={profileForm.photoURL} className="w-full h-full object-cover rounded-[32px]" /> : <div className="text-[#ff00aa] scale-[2.5] font-black">Cmd</div>}
                 </div>
                 <button onClick={() => profileInputRef.current?.click()} className="absolute bottom-0 right-0 w-11 h-11 bg-[#ff00aa] rounded-2xl flex items-center justify-center text-white border-4 border-[#030812] shadow-xl active:scale-90 transition-all"><ICONS.Camera /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); updateUser(profileForm); setShowProfileModal(false); confetti({ particleCount: 30 }); }} className="space-y-6">
                 <input type="text" value={profileForm.displayName} onChange={e => setProfileForm({...profileForm, displayName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-center font-black text-sm outline-none focus:ring-2 focus:ring-[#ff00aa]" placeholder="Officer Designation" />
                 <div className="flex gap-4">
                   <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Cancel</button>
                   <button type="submit" className="flex-1 py-4 bg-[#ff00aa] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Commit Profile</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowAddProjectModal(false)}>
           <div className="max-w-xl w-full glossy-card rounded-[40px] p-10 space-y-8 border-t-4 border-[#00ff9d]" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">New Sector Activity Node</h3>
              <form onSubmit={handleAddProject} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Designation</label>
                    <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Objectives</label>
                    <textarea required value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none" rows={3} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Allocation (Cr)</label>
                       <input type="number" required value={newProject.assignedBudget} onChange={e => setNewProject({...newProject, assignedBudget: Number(e.target.value)})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Status</label>
                       <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value as any})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none">
                          <option value="Planning">Planning</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Completed">Completed</option>
                       </select>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddProjectModal(false)} className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Abort</button>
                    <button type="submit" className="flex-1 py-4 bg-[#00ff9d] text-black font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg">Deploy Activity</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setEditingProject(null)}>
           <div className="max-w-xl w-full glossy-card rounded-[40px] p-10 space-y-8 border-t-4 border-[#00d4ff]" onClick={e => e.stopPropagation()}>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Calibrate Activity Node</h3>
              <form onSubmit={handleUpdateProject} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Designation</label>
                    <input type="text" required value={editingProject.name} onChange={e => setEditingProject({...editingProject, name: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Objectives</label>
                    <textarea required value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none" rows={3} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Allocation (Cr)</label>
                       <input type="number" required value={editingProject.assignedBudget} onChange={e => setEditingProject({...editingProject, assignedBudget: Number(e.target.value)})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Utilized (Cr)</label>
                       <input type="number" required value={editingProject.spentBudget} onChange={e => setEditingProject({...editingProject, spentBudget: Number(e.target.value)})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Progress (%)</label>
                       <input type="number" min="0" max="100" required value={editingProject.progress} onChange={e => setEditingProject({...editingProject, progress: Number(e.target.value)})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-gray-500 font-black uppercase ml-2">Status</label>
                       <select value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white outline-none">
                          <option value="Planning">Planning</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Delayed">Delayed</option>
                       </select>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setEditingProject(null)} className="flex-1 py-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-[#00d4ff] text-black font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg">Commit Changes</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Evaluate Signal Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedReport(null)}>
           <div className="max-w-3xl w-full glossy-card rounded-[48px] p-10 space-y-8 border-t-8 border-[#ff00aa]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Signal Evaluation: {selectedReport.id}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Audit Protocol Engagement</p>
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="text-gray-500">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-black uppercase mb-3">Citizen Intelligence</p>
                        <p className="text-xs text-white leading-relaxed italic mb-4">"{selectedReport.description}"</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedReport.proofUrls?.map((url, i) => (
                                <img key={i} src={url} className="w-16 h-16 rounded-xl object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(url)} />
                            ))}
                        </div>
                    </div>
                 </div>

                 <form onSubmit={handleCaseReview} className="space-y-6">
                    <div>
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2 mb-2 block">Command Decision</label>
                        <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value as ReportStatus)} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-[#ff00aa]">
                           <option value="Investigating">Investigating</option>
                           <option value="Resolved">Resolved</option>
                           <option value="Declined">Declined</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2 mb-2 block">Official Verdict</label>
                        <textarea required value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-[#ff00aa]" rows={4} placeholder="Summarize audit findings..." />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase ml-2 block">Audit Evidence (Photos)</label>
                        <div className="flex flex-wrap gap-2">
                            {reviewPhotos.map((url, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setReviewPhotos(reviewPhotos.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => reviewPhotoInputRef.current?.click()} className="w-16 h-16 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-600 hover:text-[#ff00aa] hover:border-[#ff00aa]"><ICONS.Plus /></button>
                            <input ref={reviewPhotoInputRef} type="file" multiple className="hidden" accept="image/*" onChange={e => {
                                if(e.target.files) {
                                    Array.from(e.target.files).forEach((file: File) => {
                                        const r = new FileReader();
                                        r.onload = (ev) => setReviewPhotos(p => [...p, ev.target?.result as string]);
                                        r.readAsDataURL(file);
                                    });
                                }
                            }} />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-5 bg-[#ff00aa] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all text-xs">Broadcast Verdict</button>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Image Cropper */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[4000] bg-black flex flex-col items-center justify-center p-10">
           <div className="relative w-full max-w-xl aspect-square mb-12 rounded-3xl overflow-hidden border border-white/10">
              <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
           </div>
           <div className="flex gap-4 w-full max-w-xl">
              <button onClick={() => setImageToCrop(null)} className="flex-1 py-5 border border-gray-800 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:text-white">Abort</button>
              <button onClick={handleCropDone} className="flex-[2] py-5 bg-[#00ff9d] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Calibrate Identity</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default OfficialDashboard;
