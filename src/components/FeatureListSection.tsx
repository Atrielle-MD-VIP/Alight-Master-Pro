import React from 'react';
import { Sparkles, FileCode, Sliders, Layers, Video, Cloud, Check } from 'lucide-react';
import { getFeatureData } from '../data/contentData';
import { useAppSettings } from '../hooks/useAppSettings';

export const FeatureListSection: React.FC = () => {
  const { appName, appPublisher } = useAppSettings();
  const featureData = getFeatureData(appName, appPublisher);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-pink-600 fill-pink-400 stroke-[2.5]" />;
      case 'FileCode':
        return <FileCode className="w-5 h-5 text-blue-600 stroke-[2.5]" />;
      case 'Sliders':
        return <Sliders className="w-5 h-5 text-emerald-600 stroke-[2.5]" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-purple-600 stroke-[2.5]" />;
      case 'Video':
        return <Video className="w-5 h-5 text-amber-600 stroke-[2.5]" />;
      case 'CloudSync':
        return <Cloud className="w-5 h-5 text-sky-600 stroke-[2.5]" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <section id="features" className="py-8 px-3 max-w-2xl mx-auto w-full select-none">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center gap-3 mb-6">
        <div className="bg-yellow-200 dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] inline-flex items-center gap-1.5">
          <span>⚡ Keunggulan {appName} 1 Tahun</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          Semua Fitur Premium
          <br />
          <span className="bg-blue-200 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white font-extrabold px-3 py-0.5 rounded-2xl shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] inline-block mt-1">
            Terbuka 100% Bebas Akses
          </span>
        </h2>
        <p className="text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm max-w-lg leading-relaxed">
          Nikmati kebebasan berkreasi membuat video cinematic, AM preset, jedag-jedug aesthetic, dan motion graphics tanpa halangan fitur terkunci.
        </p>
      </div>

      {/* Feature Cards Stack */}
      <div className="space-y-4">
        {featureData.map((feat) => (
          <div
            key={feat.id}
            className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-4 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                {getIcon(feat.icon)}
              </div>

              <span className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border border-slate-900 dark:border-slate-600 uppercase shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                {feat.badge}
              </span>
            </div>

            <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight mb-1">
              {feat.title}
            </h3>

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {feat.description}
            </p>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Termasuk Paket Pro 1 Tahun Gratis</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
