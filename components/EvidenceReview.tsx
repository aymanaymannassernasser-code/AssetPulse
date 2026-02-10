
import React from 'react';
import { 
  ShieldCheck, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  ClipboardCheck, 
  Zap,
  Info
} from 'lucide-react';
import { StructuredAssetEvent, Language } from '../types';

interface Props {
  events: StructuredAssetEvent[];
  shiftLog: string;
  isEngineer: boolean;
  onCommit: (approved: StructuredAssetEvent[]) => void;
  onCancel: () => void;
  lang: Language;
}

const EvidenceReview: React.FC<Props> = ({ events, shiftLog, isEngineer, onCommit, onCancel, lang }) => {
  const [approvedIndices, setApprovedIndices] = React.useState<number[]>(events.map((_, i) => i));

  const toggleApproval = (idx: number) => {
    setApprovedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const t = {
    en: {
      title: 'Review Field Analysis',
      subtitle: isEngineer ? 'RELIABILITY GATEKEEPER' : 'FIELD CONFIRMATION',
      commit: 'Commit to Registry',
      discard: 'Discard Analysis',
      shiftLogHeader: 'Shift Log Summary (Auto-Generated)',
      followUp: 'FOLLOW UP'
    },
    ar: {
      title: 'مراجعة تحليل الميدان',
      subtitle: isEngineer ? 'مراقب الموثوقية' : 'تأكيد العمل الميداني',
      commit: 'اعتماد في السجل',
      discard: 'إلغاء التحليل',
      shiftLogHeader: 'ملخص سجل الشيفت (توليد تلقائي)',
      followUp: 'متابعة لاحقة'
    }
  }[lang];

  return (
    <div className="p-4 flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl shadow-lg transition-colors ${isEngineer ? 'bg-blue-600 shadow-blue-500/20' : 'bg-amber-600 shadow-amber-500/20'}`}>
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
          <p className={`text-[10px] uppercase font-black tracking-widest ${isEngineer ? 'text-blue-400' : 'text-amber-400'}`}>
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event, idx) => (
          <div 
            key={idx} 
            onClick={() => toggleApproval(idx)}
            className={`bg-slate-800 border-2 rounded-3xl p-5 space-y-4 transition-all active:scale-[0.98] ${approvedIndices.includes(idx) ? (isEngineer ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-emerald-500/50 ring-1 ring-emerald-500/20') : 'border-slate-800 opacity-50'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-1 block w-fit ${isEngineer ? 'bg-blue-900/40 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>
                  {event.event_type}
                </span>
                <h3 className="text-xl font-mono font-black text-amber-500">{event.asset}</h3>
              </div>
              {approvedIndices.includes(idx) ? (
                <CheckCircle className={`w-6 h-6 ${isEngineer ? 'text-blue-500' : 'text-emerald-500'}`} />
              ) : (
                <XCircle className="w-6 h-6 text-slate-600" />
              )}
            </div>

            <p className={`text-sm text-slate-200 font-medium ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              {event.description}
            </p>

            {event.follow_up && (
              <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 flex gap-2 items-center">
                <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter shrink-0">{t.followUp}:</span>
                <p className="text-[10px] text-slate-300 italic truncate">{event.follow_up}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
               <div className="flex items-center gap-1">
                 <span className="text-[8px] font-black text-slate-500 uppercase">Confidence:</span>
                 <span className={`text-[8px] font-black uppercase ${event.confidence === 'high' ? 'text-emerald-500' : 'text-amber-500'}`}>{event.confidence}</span>
               </div>
               <div className="flex gap-2">
                 {isEngineer && (
                   <button className="p-1.5 bg-blue-600/20 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-colors">
                     <Info className="w-3.5 h-3.5" />
                   </button>
                 )}
                 <button className="p-1.5 bg-slate-700 rounded-lg text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-inner">
         <div className="flex items-center gap-2 mb-1">
           <ClipboardCheck className="w-4 h-4 text-slate-500" />
           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t.shiftLogHeader}</span>
         </div>
         <div className={`text-xs text-slate-400 leading-relaxed font-medium whitespace-pre-wrap ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
           {shiftLog}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-8">
        <button 
          onClick={onCancel}
          className="bg-slate-800 text-slate-400 font-black uppercase py-4 rounded-2xl text-[10px] active:scale-95 transition-all"
        >
          {t.discard}
        </button>
        <button 
          onClick={() => onCommit(events.filter((_, i) => approvedIndices.includes(i)))}
          className={`text-white font-black uppercase py-4 rounded-2xl text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isEngineer ? 'bg-blue-600 shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}
        >
          <CheckCircle className="w-4 h-4" /> {t.commit}
        </button>
      </div>
    </div>
  );
};

export default EvidenceReview;
