
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Activity, ChevronRight, Filter, Plus } from 'lucide-react';
import { Asset, Criticality, Language } from '../types';

interface Props {
  assets: Asset[];
  lang: Language;
}

const AssetList: React.FC<Props> = ({ assets, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredAssets = assets.filter(a => 
    a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'bg-emerald-500';
      case 'WARNING': return 'bg-amber-500';
      case 'DOWN': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getCriticalityBadge = (crit: Criticality) => {
    const colors = {
      [Criticality.LOW]: 'bg-slate-700 text-slate-300',
      [Criticality.MEDIUM]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      [Criticality.HIGH]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      [Criticality.CRITICAL]: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[crit];
  };

  const t = {
    en: {
      title: 'Asset Registry',
      placeholder: 'Search by TAG or LOCATION...',
      empty: 'No assets matching search'
    },
    ar: {
      title: 'سجل الأصول',
      placeholder: 'ابحث حسب العلامة أو الموقع...',
      empty: 'لا توجد أصول مطابقة للبحث'
    }
  }[lang];

  return (
    <div className="p-4 flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/add-manual')}
            className="p-2 bg-amber-500 text-slate-900 rounded-lg border border-amber-600 shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="relative group">
        <Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors`} />
        <input
          type="text"
          placeholder={t.placeholder}
          className={`w-full bg-slate-800 border border-slate-700 rounded-xl py-3.5 ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-mono`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/20 rounded-3xl border border-dashed border-slate-800">
            <p className="text-slate-500 font-mono text-sm uppercase">{t.empty}</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <Link 
              key={asset.id} 
              to={`/asset/${asset.id}`}
              className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              <div className="flex gap-4">
                <div className="relative h-12 w-12 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
                  <div className={`absolute top-0 ${lang === 'ar' ? 'left-0 border-l-2' : 'right-0 border-r-2'} h-2.5 w-2.5 rounded-full ${getStatusColor(asset.status)} border-slate-700 translate-x-0.5 -translate-y-0.5`} />
                  <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-lg font-bold text-amber-500 leading-tight">{asset.tag}</span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5 font-medium">
                    <MapPin className="w-3 h-3" />
                    {asset.location}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <span className={`text-[9px] font-black tracking-tighter uppercase px-1.5 py-0.5 rounded border ${getCriticalityBadge(asset.criticality)}`}>
                   {asset.criticality}
                 </span>
                 <div className="flex items-center text-slate-500 text-xs gap-1 font-mono">
                   {asset.totalRunningHours.toLocaleString()}h
                   <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                 </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetList;
