
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Database, 
  ShieldCheck,
  Globe,
  Inbox,
  Lock,
  ShieldAlert,
  KeyRound,
  X
} from 'lucide-react';
import { 
  Asset, 
  MaintenanceEvent, 
  Language, 
  WhatsAppEvidence, 
  StructuredAssetEvent
} from './types';
import AssetList from './components/AssetList';
import AssetDetail from './components/AssetDetail';
import AssetScanner from './components/AssetScanner';
import Troubleshooting from './components/Troubleshooting';
import WorkIngestion from './components/WorkIngestion';
import EvidenceReview from './components/EvidenceReview';
import AssetManualAdd from './components/AssetManualAdd';
import { 
  parseWhatsAppMessage, 
  correlateEvidencePhotos, 
  structureMaintenanceEvents, 
  generateShiftLog 
} from './geminiService';

const mockEvidence: WhatsAppEvidence[] = [
  {
    id: 'ev1',
    sender: 'Eng. Ahmed',
    timestamp: new Date().toISOString(),
    rawText: 'فحصنا الموتور M-301، صوته عالي وفيه تسريب زيت خفيف. التشغيل تمام بس لازم متابعة.',
    photos: [],
    status: 'PENDING'
  },
  {
    id: 'ev2',
    sender: 'Tech. Samir',
    timestamp: new Date().toISOString(),
    rawText: 'تم تشغيل اختبار المولد DG-01 لمدة ربع ساعة والنتائج ممتازة. اللوحة سليمة.',
    photos: [],
    status: 'PENDING'
  }
];

const App: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [evidence, setEvidence] = useState<WhatsAppEvidence[]>(mockEvidence);
  const [activeReview, setActiveReview] = useState<{events: StructuredAssetEvent[], log: string} | null>(null);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'ar');
  const [apiKeySelected, setApiKeySelected] = useState(false);
  
  // Mode Management
  const [isEngineer, setIsEngineer] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // Check if API Key has been selected (mandatory for Pro features)
    const checkKey = async () => {
      if (typeof window.aistudio !== 'undefined') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(selected);
      } else {
        setApiKeySelected(true); // Fallback for envs without aistudio helper
      }
    };
    checkKey();

    const savedAssets = localStorage.getItem('assets');
    const savedEvents = localStorage.getItem('events');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
  }, []);

  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [assets, events, lang]);

  const handleOpenKeySelection = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true); // Proceed as per instruction
    }
  };

  const handleProcessEvidence = async (id: string) => {
    const item = evidence.find(e => e.id === id);
    if (!item) return;
    try {
      const parsed = await parseWhatsAppMessage(item, lang);
      // correlateEvidencePhotos uses gemini-3-pro-image-preview, handled by billing context
      const correlated = await correlateEvidencePhotos(item, parsed, lang);
      const structured = await structureMaintenanceEvents(parsed, correlated, lang);
      const log = await generateShiftLog(structured, parsed.shift, lang);
      setActiveReview({ events: structured, log });
    } catch (err) {
      console.error(err);
      alert('AI Processing failed.');
    }
  };

  const handleCommitReview = (approved: StructuredAssetEvent[]) => {
    const newEvents: MaintenanceEvent[] = approved.map(a => {
      const asset = assets.find(as => as.tag === a.asset);
      return {
        id: Math.random().toString(36).substr(2, 9),
        assetId: asset?.id || 'UNIDENTIFIED',
        date: new Date().toISOString(),
        type: a.event_type,
        description: a.description,
        status: a.status,
        confidenceScore: a.confidence === 'high' ? 0.9 : 0.6
      } as any;
    });
    setEvents(prev => [...prev, ...newEvents]);
    setEvidence(prev => prev.filter(e => e.id !== evidence[0]?.id));
    setActiveReview(null);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === 'M0PCO12') {
      setIsEngineer(true);
      setShowAuth(false);
      setPassInput('');
      setAuthError(false);
    } else {
      setAuthError(true);
      setPassInput('');
    }
  };

  const t = {
    en: {
      tool: 'Engineering Tool',
      inventory: 'Inventory',
      analysis: 'Analysis',
      engPrompt: 'Are you an Engineer?',
      engMode: 'Engineer Mode Active',
      techMode: 'Technician Mode',
      login: 'Engineer Authentication',
      passPlaceholder: 'Enter Security Code',
      auth: 'Authorize',
      keyTitle: 'API Key Required',
      keyDesc: 'To access Pro Image features and reliability analysis, please select a paid API key.',
      selectKey: 'Select API Key',
      billingLink: 'Learn more about billing'
    },
    ar: {
      tool: 'أداة هندسية',
      inventory: 'المخزون',
      analysis: 'التحليل',
      engPrompt: 'هل أنت مهندس؟',
      engMode: 'وضع المهندس مفعل',
      techMode: 'وضع الفني',
      login: 'مصادقة المهندس',
      passPlaceholder: 'أدخل رمز الأمان',
      auth: 'دخول',
      keyTitle: 'مفتاح API مطلوب',
      keyDesc: 'للوصول إلى ميزات الصور والتحليل المتقدمة، يرجى اختيار مفتاح API مدفوع.',
      selectKey: 'اختيار مفتاح API',
      billingLink: 'تعرف على المزيد حول الفواتير'
    }
  }[lang];

  // Mandatory API Key selection screen
  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="p-6 bg-amber-500 rounded-3xl">
          <KeyRound className="w-12 h-12 text-slate-950" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">{t.keyTitle}</h2>
          <p className="text-slate-400 max-w-xs mx-auto text-sm">{t.keyDesc}</p>
        </div>
        <button 
          onClick={handleOpenKeySelection}
          className="bg-amber-500 text-slate-950 font-black uppercase px-8 py-4 rounded-2xl shadow-2xl shadow-amber-500/20 active:scale-95 transition-all"
        >
          {t.selectKey}
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-500 underline">
          {t.billingLink}
        </a>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-amber-500/30">
        <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg transition-colors ${isEngineer ? 'bg-blue-600' : 'bg-amber-500'}`}>
              <Activity className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">AssetPulse</h1>
              <span className={`text-[8px] uppercase font-black tracking-widest ${isEngineer ? 'text-blue-400' : 'text-amber-500'}`}>
                {isEngineer ? t.engMode : t.techMode}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEngineer ? (
              <button 
                onClick={() => setShowAuth(true)}
                className="text-[9px] font-black uppercase text-slate-500 hover:text-amber-500 transition-colors border-b border-transparent hover:border-amber-500"
              >
                {t.engPrompt}
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">
                <ShieldAlert className="w-3 h-3 text-blue-400" />
                <span className="text-[8px] font-black uppercase text-blue-400">SECURE SESSION</span>
              </div>
            )}
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {activeReview ? (
            <EvidenceReview 
              events={activeReview.events} 
              shiftLog={activeReview.log} 
              lang={lang}
              isEngineer={isEngineer}
              onCommit={handleCommitReview}
              onCancel={() => setActiveReview(null)}
            />
          ) : (
            <Routes>
              <Route path="/" element={<AssetList assets={assets} lang={lang} />} />
              <Route path="/ingestion" element={
                <WorkIngestion 
                  evidenceList={evidence} 
                  lang={lang} 
                  onProcess={handleProcessEvidence}
                  onDiscard={(id) => setEvidence(prev => prev.filter(e => e.id !== id))}
                />
              } />
              <Route path="/asset/:id" element={
                <AssetDetail 
                  assets={assets} 
                  events={events} 
                  lang={lang} 
                  isEngineer={isEngineer}
                  onAddEvent={e => setEvents([...events, e])} 
                  onUpdateAsset={a => setAssets(assets.map(x => x.id === a.id ? a : x))} 
                />
              } />
              <Route path="/scanner" element={<AssetScanner onAssetDetected={a => setAssets([a, ...assets])} lang={lang} />} />
              {/* Added missing route for manual asset addition */}
              <Route path="/add-manual" element={<AssetManualAdd onAssetCreated={a => setAssets([a, ...assets])} lang={lang} />} />
              <Route path="/troubleshooting" element={<Troubleshooting assets={assets} isEngineer={isEngineer} lang={lang} />} />
            </Routes>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 px-8 py-4 flex justify-between items-center z-50 backdrop-blur-sm">
          <Link to="/" className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-500">
            <Database className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-tighter">{t.inventory}</span>
          </Link>
          <Link to="/ingestion" className="relative -top-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl shadow-2xl flex items-center justify-center text-slate-900 transform rotate-45 group transition-transform hover:scale-110">
              <Inbox className="w-8 h-8 -rotate-45" />
            </div>
          </Link>
          <Link to="/troubleshooting" className="flex flex-col items-center gap-1 text-slate-500 hover:text-blue-500">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-tighter">{t.analysis}</span>
          </Link>
        </nav>

        {/* Auth Modal */}
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 p-8 space-y-6 shadow-2xl">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-600 rounded-2xl">
                  <Lock className="w-6 h-6 text-slate-900" />
                </div>
                <button onClick={() => { setShowAuth(false); setAuthError(false); }} className="p-2 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight">{t.login}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Level 3 Clearance Required</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <div className={`relative transition-all ${authError ? 'animate-shake' : ''}`}>
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="password"
                      autoFocus
                      className={`w-full bg-slate-950 border-2 rounded-2xl py-4 pl-12 pr-4 font-mono tracking-widest focus:outline-none transition-colors ${authError ? 'border-red-500 text-red-500' : 'border-slate-800 focus:border-blue-600'}`}
                      placeholder={t.passPlaceholder}
                      value={passInput}
                      onChange={(e) => { setPassInput(e.target.value); setAuthError(false); }}
                    />
                  </div>
                  {authError && <p className="text-[10px] font-black text-red-500 uppercase px-2">Access Denied: Invalid Security Code</p>}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {t.auth}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </HashRouter>
  );
};

export default App;
