
import React, { useRef, useState } from 'react';
import { Camera as CameraIcon, Check, RefreshCw, X, Loader2, Save, AlertTriangle, ShieldCheck } from 'lucide-react';
import { extractNameplateData } from '../geminiService';
import { Asset, AssetType, Criticality, AIAnalysisResult, Language } from '../types';

interface Props {
  onAssetDetected: (asset: Asset) => void;
  lang: Language;
}

const AssetScanner: React.FC<Props> = ({ onAssetDetected, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [tag, setTag] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const data = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(data);
      processImage(data.split(',')[1]);
    }
  };

  const processImage = async (base64: string) => {
    setIsProcessing(true);
    try {
      const result = await extractNameplateData(base64, lang);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!tag) return alert(lang === 'ar' ? 'العلامة مطلوبة للتتبع.' : 'Asset Tag is mandatory for reliability tracking.');
    if (!analysis) return;

    const newAsset: Asset = {
      id: Math.random().toString(36).substr(2, 9),
      tag,
      type: AssetType.MOTOR,
      location: 'Field Capture',
      manufacturer: analysis.extracted_data.manufacturer || 'Unknown',
      model: analysis.extracted_data.model || 'Unknown',
      criticality: Criticality.MEDIUM,
      totalRunningHours: 0,
      baseHoursOffset: 0,
      status: 'OPERATIONAL',
      specs: {
        powerRatingKW: analysis.extracted_data.powerRating,
        voltageV: analysis.extracted_data.voltage,
        currentA: analysis.extracted_data.current,
        rpm: analysis.extracted_data.speed,
        insulationClass: analysis.extracted_data.insulationClass,
        ipRating: analysis.extracted_data.ipRating
      },
      photoUrl: capturedImage || undefined,
      meterHistory: []
    };

    onAssetDetected(newAsset);
    setCapturedImage(null);
    setAnalysis(null);
    setTag('');
  };

  const t = {
    en: {
      align: 'Align Nameplate Here',
      processing: 'Analyzing Equipment',
      subtext: 'Reliability AI Extraction in Progress',
      commit: 'Commit Asset',
      discard: 'Discard',
      title: 'AI Reconstruction'
    },
    ar: {
      align: 'قم بمحاذاة لوحة البيانات هنا',
      processing: 'تحليل المعدات',
      subtext: 'جاري استخراج البيانات بالذكاء الاصطناعي',
      commit: 'حفظ الأصل',
      discard: 'إلغاء',
      title: 'إعادة بناء البيانات'
    }
  }[lang];

  React.useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="min-h-[300px] flex-shrink-0 relative bg-black rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
        {!capturedImage ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none flex items-center justify-center">
              <div className="w-full h-48 border-2 border-amber-500/50 rounded-lg relative">
                <div className="absolute -top-10 left-0 right-0 text-center text-[10px] font-black uppercase text-amber-500 tracking-widest bg-black/60 py-1">{t.align}</div>
              </div>
            </div>
            <button 
              onClick={capture}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full p-1 border-4 border-slate-700 active:scale-90 transition-transform shadow-xl"
            >
              <div className="w-full h-full bg-slate-100 rounded-full border-2 border-slate-300 flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-slate-400" />
              </div>
            </button>
          </>
        ) : (
          <img src={capturedImage} className="w-full h-full object-contain bg-slate-900" />
        )}
      </div>

      {isProcessing && (
        <div className="flex flex-col items-center gap-4 py-12 bg-slate-800/50 rounded-3xl border border-slate-800 border-dashed">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-100">{t.processing}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{t.subtext}</p>
          </div>
        </div>
      )}

      {analysis && !isProcessing && (
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-700 pb-4">
             <div>
               <h3 className="text-xl font-bold tracking-tight">{t.title}</h3>
             </div>
             <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
               <ShieldCheck className="w-6 h-6 text-emerald-500" />
             </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold uppercase text-amber-500 tracking-widest">{lang === 'en' ? 'Unique Tag' : 'العلامة المميزة'}</label>
               <input 
                 className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 font-mono text-xl font-bold text-amber-500 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-700 uppercase"
                 placeholder="e.g. 081K001C"
                 value={tag}
                 onChange={e => setTag(e.target.value.toUpperCase())}
                 autoFocus
               />
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <ExtractedField label={lang === 'en' ? 'Manufacturer' : 'الشركة المصنعة'} value={analysis.extracted_data.manufacturer} />
               <ExtractedField label={lang === 'en' ? 'Model' : 'الموديل'} value={analysis.extracted_data.model} />
               <ExtractedField label={lang === 'en' ? 'Power' : 'القدرة'} value={`${analysis.extracted_data.powerRating} kW`} />
               <ExtractedField label={lang === 'en' ? 'Voltage' : 'الجهد'} value={`${analysis.extracted_data.voltage} V`} />
             </div>
          </div>

          <div className="flex gap-3 pt-2">
             <button onClick={() => { setCapturedImage(null); setAnalysis(null); }} className="flex-1 bg-slate-700 text-white font-bold py-4 rounded-2xl uppercase text-xs tracking-widest">{t.discard}</button>
             <button onClick={handleSave} className="flex-[2] bg-amber-500 text-slate-900 font-black py-4 rounded-2xl uppercase text-xs tracking-widest flex items-center justify-center gap-2">
               <Save className="w-4 h-4" /> {t.commit}
             </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const ExtractedField = ({ label, value }: { label: string, value: any }) => (
  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 relative">
    <label className="text-[8px] font-bold uppercase text-slate-500 block mb-0.5 tracking-tighter">{label}</label>
    <div className="text-sm font-bold truncate text-slate-200">{value || 'N/A'}</div>
  </div>
);

export default AssetScanner;
