import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { getFaqData } from '../data/contentData';
import { useAppSettings } from '../hooks/useAppSettings';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1'); // Default open first item like screenshot 5
  const { websiteName, appName, appPublisher } = useAppSettings();
  const faqData = getFaqData(websiteName, appName, appPublisher);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  // Soft pastel colors for active open FAQ states like screenshots 5-8
  const getOpenBgColor = (index: number) => {
    const colors = [
      'bg-blue-100 dark:bg-slate-900',
      'bg-pink-100 dark:bg-slate-900',
      'bg-emerald-100 dark:bg-slate-900',
      'bg-yellow-200 dark:bg-slate-900',
      'bg-purple-100 dark:bg-slate-900',
      'bg-amber-100 dark:bg-slate-900'
    ];
    return colors[index % colors.length];
  };

  return (
    <section id="faq" className="py-8 px-3 max-w-2xl mx-auto w-full select-none">
      {/* Section Title Header */}
      <div className="flex flex-col items-center text-center gap-3 mb-6">
        <div className="bg-purple-100 dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] inline-flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-purple-600 stroke-[2.5]" />
          <span>Pertanyaan Yang Sering Diajukan</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          FAQ & Informasi Penting
        </h2>

        <p className="text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm max-w-lg leading-relaxed">
          Jawaban lengkap seputar mekanisme verifikasi dan lisensi Alight Motion Pro di Alight Master.
        </p>
      </div>

      {/* Accordion Stack */}
      <div className="space-y-3">
        {faqData.map((faq, index) => {
          const isOpen = openId === faq.id;
          const openBg = getOpenBgColor(index);

          return (
            <div
              key={faq.id}
              className={`border-2 border-slate-900 dark:border-slate-600 rounded-2xl shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all overflow-hidden ${
                isOpen ? openBg : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 font-extrabold text-xs md:text-sm text-slate-900 dark:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full border border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 ${
                      isOpen ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{faq.question}</span>
                </div>

                <div
                  className={`w-7 h-7 rounded-full border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 transition-transform ${
                    isOpen ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  }`}
                >
                  {isOpen ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                </div>
              </button>

              {/* Answer Content Panel */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t-2 border-slate-900 dark:border-slate-600 bg-white dark:bg-slate-900/80 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2 text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed pt-2">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300 shrink-0 mt-0.5" />
                    <p>{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
