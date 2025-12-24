
import React, { useState, useEffect } from 'react';
// Fix: Use react-router instead of react-router-dom for useParams and useNavigate
import { useParams, useNavigate } from 'react-router';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { TaxCategory } from '../types';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Aditya S.', amount: '₹12,45,000', city: 'Mumbai' },
  { rank: 2, name: 'Priya K.', amount: '₹10,20,000', city: 'Delhi' },
  { rank: 3, name: 'You', amount: '₹1,24,500', city: 'Bangalore', isUser: true },
  { rank: 4, name: 'Rahul V.', amount: '₹95,000', city: 'Pune' },
  { rank: 5, name: 'Sonia M.', amount: '₹88,000', city: 'Hyderabad' },
];

const CustomComparisonTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glossy-card p-4 rounded-2xl border border-white/20 shadow-2xl">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-black" style={{ color: p.color }}>
            {p.name}: ₹{p.value.toLocaleString()} Cr
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TaxTypeDetail: React.FC = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [taxCategory, setTaxCategory] = useState<TaxCategory | null>(null);

  useEffect(() => {
    const loadCategory = () => {
      const stored = localStorage.getItem('taxwatch_tax_data');
      if (stored) {
        const all: TaxCategory[] = JSON.parse(stored);
        const match = all.find(c => c.id === type);
        if (match) setTaxCategory(match);
      }
    };
    loadCategory();
    const interval = setInterval(loadCategory, 3000);
    return () => clearInterval(interval);
  }, [type]);

  if (!taxCategory) return <div className="p-20 text-center text-gray-500">Loading audit stream...</div>;

  const filteredLeaderboard = MOCK_LEADERBOARD.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => `₹${val.toLocaleString()} Cr`;

  // Explicit side-by-side comparison data
  const comparisonData = [
    {
      name: 'Budget Plan',
      Budget: taxCategory.taxAllocated,
      Spent: taxCategory.taxUsed,
    }
  ];

  const trendData = taxCategory.data.map((v, i) => ({ 
    period: `Q${(i % 4) + 1} '2${Math.floor(i / 4) + 3}`,
    value: v 
  }));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-in slide-in-from-right duration-500">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-[#00d4ff] hover:text-white transition-colors group"
      >
        <div className="group-hover:-translate-x-1 transition-transform"><ICONS.ChevronLeft /></div>
        <span className="font-bold tracking-tight uppercase text-xs">Return to Command Center</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glossy-card rounded-[32px] p-10 bg-gradient-to-br from-[#132f4c] to-[#0a1929] border-t-4 border-t-[#00d4ff] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12"><ICONS.File /></div>
          
          <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight uppercase">{taxCategory.name}</h2>
          <div className="flex gap-4 mb-8">
            <span className="text-[10px] bg-[#00ff9d]/20 text-[#00ff9d] px-2 py-1 rounded font-black">AUDIT VERIFIED</span>
            <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-1 rounded font-black uppercase">FY 2024-25</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
             <div className="p-6 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-[20px]">
               <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Gross Revenue Stream</p>
               <p className="text-3xl font-black text-[#00d4ff] tracking-tighter">{formatCurrency(taxCategory.taxCollected)}</p>
             </div>
             <div className="p-6 bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-[20px]">
               <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Net Treasury Pool</p>
               <p className="text-3xl font-black text-[#00ff9d] tracking-tighter">{formatCurrency(taxCategory.totalTaxRemaining)}</p>
             </div>
          </div>

          {taxCategory.statement && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8 space-y-4 shadow-inner">
              <p className="text-[10px] font-black text-[#ffb300] uppercase tracking-widest flex items-center gap-2">
                 <ICONS.Check /> Official Deployment Verdict
              </p>
              <p className="text-gray-200 text-sm leading-relaxed italic opacity-90">"{taxCategory.statement}"</p>
              {taxCategory.statementProofUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-w-md mx-auto shadow-2xl">
                  <img src={taxCategory.statementProofUrl} className="w-full h-48 object-cover" alt="Audit Proof" />
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Allocated (Budget)</p>
              <p className="text-lg font-bold text-white tracking-tighter">{formatCurrency(taxCategory.taxAllocated)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Spent (Actual)</p>
              <p className="text-lg font-bold text-white tracking-tighter">{formatCurrency(taxCategory.taxUsed)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Audit Discrepancy</p>
              <p className="text-lg font-bold text-[#ff00aa] tracking-tighter">{formatCurrency(taxCategory.taxRemaining)}</p>
            </div>
          </div>
        </div>

        <div className="glossy-card rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-xl border border-white/5">
          <div className="w-20 h-20 bg-[#00d4ff]/10 rounded-3xl flex items-center justify-center text-[#00d4ff] shadow-lg">
            <ICONS.Trend />
          </div>
          <div>
            <h4 className="font-black text-white text-lg uppercase tracking-tight">Efficiency Analysis</h4>
            <p className="text-xs text-gray-500 mt-2 px-2 uppercase font-black tracking-widest">Inflow Pool vs Strategy Deployment</p>
          </div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={comparisonData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip content={<CustomComparisonTooltip />} cursor={{ fill: 'transparent' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Bar dataKey="Budget" fill="#00d4ff" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Spent" fill="#ff00aa" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glossy-card rounded-[24px] p-8 flex flex-col shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight uppercase">Citizen Contribution Feed</h3>
            <input type="text" placeholder="Filter by name/region..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#0a1929] border border-gray-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white outline-none focus:ring-1 focus:ring-[#00d4ff] transition-all" />
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {filteredLeaderboard.map((item) => (
              <div key={item.rank} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${item.isUser ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase ${item.isUser ? 'text-[#00d4ff]' : 'text-gray-600'}`}>Tier {item.rank}</span>
                  <div>
                    <p className="font-black text-white text-sm tracking-tight">{item.name}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{item.city} SECTOR</p>
                  </div>
                </div>
                <p className={`font-black text-sm tracking-tighter ${item.isUser ? 'text-[#00ff9d]' : 'text-gray-300'}`}>{item.amount}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glossy-card rounded-[24px] p-8 flex flex-col shadow-2xl relative overflow-hidden">
          <h3 className="text-xl font-black text-white mb-8 tracking-tight uppercase">Fiscal Velocity Feed</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#132f4c', border: 'none', borderRadius: '12px' }}
                   itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={28}>
                  {trendData.map((_, index) => (
                    <Cell key={`c-${index}`} fill={index === trendData.length - 1 ? '#ff00aa' : index % 2 === 0 ? '#00d4ff' : '#008fb3'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center px-2">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#00d4ff]"></div>
               <span className="text-[8px] font-black text-gray-600 uppercase">Standard Flow</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#ff00aa]"></div>
               <span className="text-[8px] font-black text-gray-600 uppercase">Current Variance</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxTypeDetail;
