
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Loader2, 
  Activity, 
  ShieldAlert,
  Lock,
  LockKeyhole,
  Info
} from 'lucide-react';
import { getMaintenanceAdvice, assessMotorHealth, troubleshootBreakdown } from '../geminiService';
import { Asset, AssetType, MotorHealthAssessment, BreakdownAnalysis, Language } from '../types';

interface Props {
  assets: Asset[];
  isEngineer: boolean;
  lang: Language;
}

const Troubleshooting: React.FC<Props> = ({ assets, isEngineer, lang }) => {
  const location = useLocation();
  const initialAssetId = location.state?.assetId || assets[0]?.id || '';
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId);
  const [issue, setIssue] = useState('');
  const [conditions, setConditions] = useState('');
  const [recentActions, setRecentActions] = useState('');
  
  const [generalAdvice, setGeneralAdvice] = useState<string | null>(null);
  const [motorHealth, setMotorHealth] = useState<MotorHealthAssessment | null>(null);
  const [breakdownAnalysis, setBreakdownAnalysis] = useState<BreakdownAnalysis | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'GENERAL' | 'MOTOR_HEALTH' | 'BREAKDOWN'>('GENERAL');

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const handleDiagnose = async () => {
    if (!issue || !selectedAsset) return;
    setLoading(true);
    try {
      if (mode === 'MOTOR_HEALTH' && selectedAsset.type === AssetType.MOTOR) {
        const res = await assessMotorHealth(selectedAsset, issue, lang);
        setMotorHealth(res);
        setGeneralAdvice(null);
        setBreakdownAnalysis(null);
      } else if (mode === 'BREAKDOWN') {
        const res = await troubleshootBreakdown(selectedAsset, issue, conditions, recentActions, lang);
        setBreakdownAnalysis(res);
        setGeneralAdvice(null);
        setMotorHealth(null);
      } else {
        const res = await getMaintenanceAdvice(selectedAsset.tag, 'History Local', issue, lang);
        setGeneralAdvice(res);
        setMotorHealth(null);
        setBreakdownAnalysis(null);
      }
    } catch (err) {
      alert('Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const t = {
    en: {
      title: 'Reliability Analysis',
      emergency: 'EMERGENCY FIELD SUPPORT',
      isolation: 'Mandatory Isolation / LOTO',
      causes: 'Ranked Failure Causes',
      diagnoseBtn: 'Run Reliability Analysis'
    },
    ar: {
      title: 'تحليل الموثوقية',
      emergency: 'دعم ميداني للطوارئ',
      isolation: 'العزل الإلزامي / LOTO',
      causes: 'أسباب الفشل المصنفة',
      diagnoseBtn: 'تشغيل تحليل الموثوقية'
    }
  }[lang];

  return (
    <div className="p-4 flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl shadow-lg transition-colors ${isEngineer ? 'bg-blue-600 shadow-blue-500/20' : 'bg-amber-600 shadow-amber-500/20'}`}>
          {mode === 'BREAKDOWN' ? <ShieldAlert className="w-6 h-6 text-white" /> : <ShieldCheck className="w-6 h-6 text-white" />}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{mode === 'BREAKDOWN' ? 'Breakdown Response' : t.title}</h2>
          <p className={`text-[10px] uppercase font-black tracking-widest ${mode === 'BREAKDOWN' ? 'text-red-400' : (isEngineer ? 'text-blue-400' : 'text-amber-400')}`}>
            {isEngineer ? 'ADVANCED RCA ENGINE' : 'EXPERT FIELD SUPPORT'}
          </p>
        </div>
      </div>

      <div className={`bg-slate-800/50 border rounded-3xl p-6 space-y-6 border-slate-800 ${mode === 'BREAKDOWN' ? 'border-red-500/20' : ''}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset</label>
            <select className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 font-mono text-amber-500 font-bold" value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}>
              {assets.map(a => <option key={a.id} value={a.id}>{a.tag}</option>)}
            </select>
          </div>
          
          <div className="flex p-1 bg-slate-900 rounded-xl gap-1">
             <button onClick={() => setMode('GENERAL')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${mode === 'GENERAL' ? (isEngineer ? 'bg-blue-600' : 'bg-amber-500') + ' text-white' : 'text-slate-500'}`}>General RCA</button>
             <button onClick={() => setMode('BREAKDOWN')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${mode === 'BREAKDOWN' ? 'bg-red-600 text-white' : 'text-slate-500'}`}>Breakdown</button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Symptom Observation</label>
          <textarea rows={3} className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-sm" value={issue} onChange={e => setIssue(e.target.value)} placeholder="e.g. Excessive vibration, hot casing..." />
        </div>

        {isEngineer && mode === 'BREAKDOWN' && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Environmental Conditions</label>
               <input className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-sm" value={conditions} onChange={e => setConditions(e.target.value)} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Recent Maintenance Actions</label>
               <input className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-sm" value={recentActions} onChange={e => setRecentActions(e.target.value)} />
             </div>
          </div>
        )}

        <button onClick={handleDiagnose} disabled={loading || !issue} className={`w-full text-white font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 ${mode === 'BREAKDOWN' ? 'bg-red-600' : (isEngineer ? 'bg-blue-600 shadow-blue-500/20' : 'bg-amber-500 shadow-amber-500/20')} shadow-xl transition-all active:scale-95`}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
          {t.diagnoseBtn}
        </button>
      </div>

      {generalAdvice && (
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
          {generalAdvice}
        </div>
      )}

      {breakdownAnalysis && (
        <div className="space-y-6">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <LockKeyhole className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase">{t.isolation}</span>
            </div>
            <ul className="space-y-2">
              {breakdownAnalysis.loto_isolation_steps.map((step, i) => (
                <li key={i} className="text-sm text-red-100 font-bold flex gap-3">
                  <span className="opacity-40">{i+1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 px-1">{t.causes}</span>
            {breakdownAnalysis.failure_causes.map((c, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-1">
                   <p className="text-sm font-black text-amber-500 uppercase">{c.cause}</p>
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${isEngineer ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400'}`}>
                     {Math.round(c.probability * 100)}% {isEngineer ? 'PRB' : ''}
                   </span>
                </div>
                <p className="text-xs text-slate-400 italic">"{c.rationale}"</p>
                {isEngineer && (
                  <div className="mt-3 flex gap-2 items-center bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    <Info className="w-3 h-3 text-blue-400" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Engineer Note: Correlate with last visual inspection scan</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Troubleshooting;
