
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ICONS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend, 
  ComposedChart, Line, PieChart, Pie, LabelList 
} from 'recharts';
import { TaxCategory, WorkProject, Interaction, TaxNotification } from '../types';
import { useAuth } from '../App';
import { getSectorWorks } from '../geminiService';
import confetti from 'canvas-confetti';

const TaxTypeDetail: React.FC = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [taxCategory, setTaxCategory] = useState<TaxCategory | null>(null);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [graphType, setGraphType] = useState<'pie' | 'bar' | 'detailed'>('pie');
  
  // Feedback States
  const [feedbackText, setFeedbackText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  
  // Citizen Logging States
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({ name: '', description: '', assignedBudget: 0 });

  // Official Control States
  const [editingProject, setEditingProject] = useState<WorkProject | null>(null);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    const stored = localStorage.getItem('taxwatch_tax_data');
    if (stored) {
      const all: TaxCategory[] = JSON.parse(stored);
      const match = all.find(c => c.id === type);
      if (match) {
        setTaxCategory(match);
        if (!match.works || match.works.length === 0) {
          setLoadingWorks(true);
          const works = await getSectorWorks(match.name);
          const updatedMatch = { ...match, works: works.map(w => ({ ...w, isOfficial: true, feedbacks: [] })) };
          const updatedAll = all.map(c => c.id === type ? updatedMatch : c);
          localStorage.setItem('taxwatch_tax_data', JSON.stringify(updatedAll));
          setTaxCategory(updatedMatch);
          setLoadingWorks(false);
        }
      }
    }
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

  const handleCitizenLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxCategory || !user) return;
    const newWork: WorkProject = {
      id: `CIT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      name: logForm.name,
      description: logForm.description,
      status: 'In-Progress',
      progress: 0,
      assignedBudget: logForm.assignedBudget,
      spentBudget: 0,
      feedbacks: [],
      isOfficial: false,
      creatorUid: user.uid,
      creatorName: user.displayName || user.username
    };

    const updatedCat = { ...taxCategory, works: [newWork, ...(taxCategory.works || [])] };
    const all = JSON.parse(localStorage.getItem('taxwatch_tax_data') || '[]');
    const updatedAll = all.map((c: any) => c.id === taxCategory.id ? updatedCat : c);
    localStorage.setItem('taxwatch_tax_data', JSON.stringify(updatedAll));
    setTaxCategory(updatedCat);
    setShowLogModal(false);
    setLogForm({ name: '', description: '', assignedBudget: 0 });
    confetti({ particleCount: 100, spread: 70 });
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxCategory || !editingProject) return;

    const updatedWorks = (taxCategory.works || []).map(w => 
      w.id === editingProject.id ? { ...editingProject } : w
    );
    const updatedCat = { ...taxCategory, works: updatedWorks };
    const all = JSON.parse(localStorage.getItem('taxwatch_tax_data') || '[]');
    const updatedAll = all.map((c: any) => c.id === taxCategory.id ? updatedCat : c);
    localStorage.setItem('taxwatch_tax_data', JSON.stringify(updatedAll));
    
    setTaxCategory(updatedCat);
    setEditingProject(null);
    confetti({ particleCount: 50, spread: 50 });
  };

  const handleDeleteProject = (projectId: string) => {
    if (!taxCategory || !window.confirm("Are you sure you want to terminate this activity node?")) return;

    const updatedWorks = (taxCategory.works || []).filter(w => w.id !== projectId);
    const updatedCat = { ...taxCategory, works: updatedWorks };
    const all = JSON.parse(localStorage.getItem('taxwatch_tax_data') || '[]');
    const updatedAll = all.map((c: any) => c.id === taxCategory.id ? updatedCat : c);
    localStorage.setItem('taxwatch_tax_data', JSON.stringify(updatedAll));
    
    setTaxCategory(updatedCat);
  };

  const submitFeedback = (workId: string, parentId: string | null = null, recipientUid: string | null = null) => {
    const text = parentId ? replyText : feedbackText;
    if (!text.trim() || !user || !taxCategory) return;

    const newInteraction: Interaction = {
      id: `INT-${Date.now()}`,
      uid: user.uid,
      userName: user.displayName || user.username,
      text: text,
      timestamp: new Date().toISOString(),
      likes: [],
      replies: [],
      role: user.role,
      parentId: parentId || undefined
    };

    const updateInteractionsRecursive = (list: Interaction[]): Interaction[] => {
      if (!parentId) return [newInteraction, ...list];
      return list.map(item => {
        if (item.id === parentId) {
          return { ...item, replies: [...(item.replies || []), newInteraction] };
        }
        if (item.replies) {
          return { ...item, replies: updateInteractionsRecursive(item.replies) };
        }
        return item;
      });
    };

    const updatedWorks = (taxCategory.works || []).map(w => {
      if (w.id === workId) {
        return { ...w, feedbacks: updateInteractionsRecursive(w.feedbacks || []) };
      }
      return w;
    });

    const updatedCat = { ...taxCategory, works: updatedWorks };
    const all = JSON.parse(localStorage.getItem('taxwatch_tax_data') || '[]');
    const updatedAll = all.map((c: any) => c.id === taxCategory.id ? updatedCat : c);
    localStorage.setItem('taxwatch_tax_data', JSON.stringify(updatedAll));
    
    // Send Notification if replying to someone else
    if (parentId && recipientUid && recipientUid !== user.uid) {
      addNotification({
        recipientUid,
        projectId: workId,
        interactionId: newInteraction.id,
        message: `${user.displayName || user.username} replied to your signal interaction.`,
        type: 'REPLY',
        fromUid: user.uid,
        fromUserName: user.displayName || user.username
      });
    }

    setTaxCategory(updatedCat);
    setFeedbackText('');
    setReplyText('');
    setActiveReplyId(null);
  };

  const renderThread = (inter: Interaction, workId: string, depth = 0) => (
    <div key={inter.id} className={`p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 ${depth > 0 ? 'ml-6 md:ml-10' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${inter.role === 'official' ? 'bg-[#ff00aa] text-white' : 'bg-[#00d4ff] text-black'}`}>
            {inter.userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-tighter">
              {inter.userName} {inter.role === 'official' && <span className="text-[#ff00aa] ml-1">[OFFICIAL]</span>}
            </p>
            <p className="text-[8px] text-gray-500 font-bold uppercase">{new Date(inter.timestamp).toLocaleString()}</p>
          </div>
        </div>
        <button onClick={() => setActiveReplyId(inter.id)} className="text-[9px] font-black text-[#00d4ff] uppercase hover:underline">Reply</button>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{inter.text}</p>
      
      {activeReplyId === inter.id && (
        <div className="mt-4 p-4 bg-[#030812] rounded-xl border border-[#00d4ff]/30 space-y-3">
           <textarea 
             value={replyText} 
             onChange={e => setReplyText(e.target.value)} 
             className="w-full bg-transparent text-xs text-white outline-none" 
             placeholder="Transmit response..." 
             autoFocus
           />
           <div className="flex gap-2">
              <button onClick={() => submitFeedback(workId, inter.id, inter.uid)} className="px-3 py-1 bg-[#00d4ff] text-black text-[9px] font-black rounded uppercase">Send</button>
              <button onClick={() => setActiveReplyId(null)} className="px-3 py-1 text-gray-500 text-[9px] font-black rounded uppercase">Cancel</button>
           </div>
        </div>
      )}

      {inter.replies && inter.replies.length > 0 && (
        <div className="space-y-3 mt-4">
          {inter.replies.map(r => renderThread(r, workId, depth + 1))}
        </div>
      )}
    </div>
  );

  if (!taxCategory) return <div className="p-20 text-center text-gray-500 font-black uppercase tracking-widest animate-pulse">Synchronizing node detail...</div>;

  const trendData = taxCategory.data.map((v, i) => ({
    period: `Q${(i % 4) + 1} '2${Math.floor(i / 4) + 3}`,
    value: v,
    percentage: Number(((v / (taxCategory.taxAllocated || 100000)) * 100).toFixed(1)),
    projected: v + Math.floor(Math.random() * 5000)
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-in slide-in-from-right duration-500 pb-40">
      <nav className="flex items-center gap-4 text-xs font-black text-gray-500 uppercase tracking-widest">
        <button onClick={() => navigate('/')} className="hover:text-[#00d4ff]">Dashboard</button>
        <div className="text-gray-700">/</div>
        <div className="text-[#00d4ff]">{taxCategory.name} Node</div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Analytics Card */}
        <div className="lg:col-span-2 glossy-card rounded-[40px] p-12 bg-gradient-to-br from-[#132f4c] to-[#0a1929] border-t-4 border-t-[#00d4ff] shadow-2xl relative">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{taxCategory.name}</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Audit Analytics Grid</p>
            </div>
            <div className="flex bg-[#030812] p-1 rounded-xl">
                <button onClick={() => setGraphType('pie')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${graphType === 'pie' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-500'}`}>Pie</button>
                <button onClick={() => setGraphType('bar')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${graphType === 'bar' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-500'}`}>Bar</button>
                <button onClick={() => setGraphType('detailed')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase ${graphType === 'detailed' ? 'bg-[#00d4ff] text-black shadow-md' : 'text-gray-500'}`}>Trend</button>
            </div>
          </div>

          <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               {(() => {
                  const tooltipStyle = { background: '#0a1929', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
                  if (graphType === 'pie') {
                    const pieData = [{ name: 'Deployed', value: taxCategory.taxUsed, color: '#00ff9d' }, { name: 'Reserve', value: taxCategory.taxRemaining, color: '#ff00aa' }];
                    return (
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={100} outerRadius={150} paddingAngle={8} dataKey="value" stroke="none" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ paddingTop: '40px', fontWeight: 'bold', fontSize: '10px' }} />
                      </PieChart>
                    );
                  }
                  return (
                    <BarChart data={trendData} margin={{ top: 20, bottom: 20 }}>
                      <XAxis dataKey="period" stroke="#444" fontSize={10} fontVariant="black" />
                      <YAxis stroke="#444" fontSize={10} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="value" fill="#00d4ff" radius={[8, 8, 0, 0]}>
                         <LabelList dataKey="percentage" position="top" fill="#00d4ff" fontSize={10} formatter={(v: any) => `${v}%`} />
                      </Bar>
                    </BarChart>
                  );
               })()}
             </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-8">
           <div className="glossy-card rounded-[40px] p-10 space-y-8">
              <h3 className="text-xl font-black text-white tracking-tighter uppercase">Deployment Health</h3>
              <div className="space-y-6">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Fiscal Deployment</p>
                    <p className="text-2xl font-black text-white">₹{taxCategory.taxUsed.toLocaleString()} Cr</p>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-[#ff00aa]/30 bg-[#ff00aa]/5">
                    <p className="text-[10px] text-[#ff00aa] font-black uppercase mb-1">Treasury Variance</p>
                    <p className="text-2xl font-black text-[#ff00aa]">₹{taxCategory.taxRemaining.toLocaleString()} Cr</p>
                 </div>
              </div>
              <button onClick={() => setShowLogModal(true)} className="w-full py-5 bg-[#00d4ff] text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg">Log Development Signal</button>
           </div>
        </div>
      </div>

      {/* Activity Sector Development Section */}
      <div className="space-y-12">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Activity Sector Development</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {(taxCategory.works || []).map(work => (
            <div key={work.id} className={`glossy-card rounded-[48px] p-10 space-y-8 flex flex-col transition-all border-l-8 relative group ${work.isOfficial ? 'border-l-[#00ff9d]' : 'border-l-[#9d00ff]'}`}>
              {user?.role === 'official' && (
                <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingProject(work)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-[#00d4ff] hover:bg-white/10 transition-all border border-white/5">
                    <ICONS.Edit />
                  </button>
                  <button onClick={() => handleDeleteProject(work.id)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-white/10 transition-all border border-white/5">
                    <ICONS.Trash />
                  </button>
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-black text-white pr-20">{work.name}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${work.isOfficial ? 'text-[#00ff9d]' : 'text-[#9d00ff]'}`}>
                    {work.isOfficial ? 'National Core Project' : `Community Intelligence Log by @${work.creatorName}`}
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase px-4 py-1.5 bg-white/5 rounded-xl text-gray-400">{work.status}</span>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed">{work.description}</p>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-5 bg-white/5 rounded-[32px] border border-white/5">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Authorized</p>
                    <p className="text-xl font-black text-white">₹{work.assignedBudget} Cr</p>
                 </div>
                 <div className="p-5 bg-white/5 rounded-[32px] border border-white/5">
                    <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Utilized</p>
                    <p className="text-xl font-black text-white">₹{work.spentBudget} Cr</p>
                 </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-6">
                 <div className="flex justify-between items-center">
                    <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Surveillance Engagement</h5>
                    <p className="text-[9px] text-gray-600 font-black uppercase">{work.feedbacks?.length || 0} Total Interactions</p>
                 </div>
                 
                 <div className="flex gap-4">
                    <input 
                      value={selectedWorkId === work.id ? feedbackText : ''}
                      onChange={e => { setSelectedWorkId(work.id); setFeedbackText(e.target.value); }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white outline-none focus:ring-1 focus:ring-[#00d4ff]" 
                      placeholder="Add to the conversation..."
                    />
                    <button onClick={() => submitFeedback(work.id)} className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#00d4ff] hover:bg-[#00d4ff] hover:text-black transition-all">
                       <ICONS.Send />
                    </button>
                 </div>

                 <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {work.feedbacks?.map(f => renderThread(f, work.id))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowLogModal(false)}>
          <div className="max-w-xl w-full glossy-card rounded-[48px] p-12 space-y-8 border border-[#00d4ff]/30 shadow-2xl" onClick={e => e.stopPropagation()}>
             <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Log Development Activity</h3>
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Community surveillance input node</p>
             <form onSubmit={handleCitizenLog} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Signal Name</label>
                   <input type="text" required value={logForm.name} onChange={e => setLogForm({...logForm, name: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-5 text-white outline-none" placeholder="e.g. Local Road Rehabilitation" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Surveillance Log</label>
                   <textarea required value={logForm.description} onChange={e => setLogForm({...logForm, description: e.target.value})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-5 text-white text-sm outline-none" rows={4} placeholder="Describe the activity or deficiency observed..." />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Estimated Local Budget (Cr)</label>
                   <input type="number" value={logForm.assignedBudget} onChange={e => setLogForm({...logForm, assignedBudget: Number(e.target.value)})} className="w-full bg-[#030812] border border-white/10 rounded-2xl p-5 text-white outline-none" />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-5 text-gray-500 font-black uppercase tracking-widest text-xs">Abort</button>
                   <button type="submit" className="flex-1 py-5 bg-[#00d4ff] text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">Broadcast Signal</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Official Edit Modal */}
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
    </div>
  );
};

export default TaxTypeDetail;
