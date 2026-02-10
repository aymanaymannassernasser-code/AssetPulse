
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Clock, 
  User, 
  Sparkles, 
  FileText,
  Loader2,
  CheckCircle2,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { WhatsAppEvidence, Language } from '../types';

interface Props {
  evidenceList: WhatsAppEvidence[];
  onProcess: (evidenceId: string) => void;
  onDiscard: (evidenceId: string) => void;
  lang: Language;
}

const WorkIngestion: React.FC<Props> = ({ evidenceList, onProcess, onDiscard, lang }) => {
  const navigate = useNavigate();

  const t = {
    en: {
      title: 'Incoming Work Evidence',
      analyze: 'Analyze & Record',
      save: 'Save as Draft',
      empty: 'No new evidence from field.',
      voice: 'Voice Note'
    },
    ar: {
      title: 'أدلة العمل الواردة',
      analyze: 'تحليل وتسجيل',
      save: 'حفظ كمسودة',
      empty: 'لا يوجد أدلة جديدة من الميدان.',
      voice: 'مذكرة صوتية'
    }
  }[lang];

  return (
    <div className="p-4 flex flex-col gap-4 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
          <MessageSquare className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.title}</h2>
          <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500">
            WhatsApp Integration • Stage 1/4
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {evidenceList.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-800">
            <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{t.empty}</p>
          </div>
        ) : (
          evidenceList.map(item => (
            <div key={item.id} className="bg-slate-800/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-bottom duration-300">
              <div className="p-4 flex items-start justify-between bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">{item.sender}</p>
                    <p className="text-[10px] font-mono text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <button onClick={() => onDiscard(item.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {item.rawText && (
                  <p className={`text-slate-300 text-sm leading-relaxed ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {item.rawText}
                  </p>
                )}

                {item.voiceTranscript && (
                  <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/50 flex gap-3">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-500 block mb-1">{t.voice}</span>
                      <p className="text-[11px] text-slate-400 italic">"{item.voiceTranscript}"</p>
                    </div>
                  </div>
                )}

                {item.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {item.photos.map((p, i) => (
                      <div key={i} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-700">
                        <img src={p} className="w-full h-full object-cover" alt="Field evidence" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-900/30 border-t border-slate-800 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onProcess(item.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase py-3.5 rounded-2xl text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" /> {t.analyze}
                </button>
                <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-black uppercase py-3.5 rounded-2xl text-[10px] transition-all active:scale-95">
                  {t.save}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkIngestion;
