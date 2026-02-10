
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Cpu, CheckCircle2 } from 'lucide-react';
import { inferAssetFromMinimalData } from '../geminiService';
import { Asset, AssetType, Criticality, AIAnalysisResult, Language } from '../types';

interface Props {
  onAssetCreated: (asset: Asset) => void;
  lang: Language;
}

const AssetManualAdd: React.FC<Props> = ({ onAssetCreated, lang }) => {
  const navigate = useNavigate();
  const [tag, setTag] = useState('');
  const [type, setType] = useState<AssetType>(AssetType.MOTOR);
  const [location, setLocation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const handleInfer = async () => {
    if (!tag || !location) return alert(lang === 'ar' ? 'الوسم والموقع مطلوبان.' : 'Tag and Location are required.');
    setIsProcessing(true);
    try {
      const result = await inferAssetFromMinimalData(tag, type, location, lang);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      alert('AI inference failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const t = {
    en: {
      title: 'Manual Field Entry',
      tag: 'Asset Tag',
      type: 'Category',
      loc: 'Location',
      infer: 'AI Reconstruction',
      commit: 'Commit to Local Registry'
    },
    ar: {
      title: 'إدخال ميداني يدوي',
      tag: 'وسم الأصل',
      type: 'الفئة',
      loc: 'الموقع',
      infer: 'إعادة البناء بالذكاء الاصطناعي',
      commit: 'إضافة إلى السجل المحلي'
    }
  }[lang];

  return (
    <div className="p-4 flex flex-col gap-6 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full"><ArrowLeft className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /></button>
        <h2 className="text-2xl font-bold">{t.title}</h2>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{t.tag}</label>
          <input className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 font-mono text-xl font-bold text-amber-500 uppercase" placeholder="e.g. 081K001C" value={tag} onChange={e => setTag(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-500">{t.type}</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-bold" value={type} onChange={e => setType(e.target.value as AssetType)}>
              {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-slate-500">{t.loc}</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-bold" placeholder="Pump Room B" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>
        {!analysis && (
          <button onClick={handleInfer} disabled={isProcessing || !tag} className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
            {t.infer}
          </button>
        )}
      </div>

      {analysis && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
           <div className="bg-blue-500/10 p-4 border border-blue-900/30 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap">{analysis.assumptions.join('\n')}</div>
           <button onClick={() => navigate('/')} className="w-full bg-amber-500 text-slate-900 font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
             <CheckCircle2 className="w-5 h-5" /> {t.commit}
           </button>
        </div>
      )}
    </div>
  );
};

export default AssetManualAdd;
