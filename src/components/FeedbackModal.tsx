import React, { useState } from 'react';
import { X, Send, Lightbulb, Bug } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState<'feature' | 'bug'>('feature');
  const [detail, setDetail] = useState('');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, detail, contact }),
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 text-white shadow-xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black tracking-tight">KIRIM MASUKAN</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[11px] text-slate-400">NEMU BUG ATAU PUNYA IDE FITUR? KABARIN LANGSUNG KE KAMI 🚀</p>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">KATEGORI</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCategory('feature')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium ${category === 'feature' ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
              <Lightbulb className="w-3.5 h-3.5" /> Ide Fitur
            </button>
            <button type="button" onClick={() => setCategory('bug')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium ${category === 'bug' ? 'bg-rose-950/50 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
              <Bug className="w-3.5 h-3.5" /> Lapor Bug
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DETAIL ({detail.length}/2000)</label>
          <textarea 
            value={detail} 
            onChange={(e) => setDetail(e.target.value)} 
            maxLength={2000} 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs h-24 focus:border-slate-500 focus:outline-none"
            placeholder="Ceritakan..."
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">KONTAK (OPSIONAL)</label>
          <input 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs focus:border-slate-500 focus:outline-none"
            placeholder="Email // Username Telegram..."
          />
        </div>

        <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-colors">
          <Send className="w-4 h-4" /> {isLoading ? 'MENGIRIM...' : 'KIRIM SEKARANG'}
        </button>
      </form>
    </div>
  );
};
