import React from 'react';
import { AppSettings, ThemeMode } from '../types';
import { EpeLogo } from './EpeLogo';

interface AboutPageProps {
  settings?: AppSettings | null;
  theme?: ThemeMode;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-4 flex items-center justify-center shadow-2xl border-4 border-amber-400 overflow-hidden">
          <EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className={`text-3xl md:text-5xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {settings?.appName || 'Epe Premier League'}
          </h1>
          <p className="text-amber-500 font-bold tracking-widest uppercase mt-2 text-sm md:text-base">
            Version 1.0.0
          </p>
        </div>
      </div>

      {/* Vision & Overview */}
      <div className={`rounded-[2rem] p-8 md:p-12 shadow-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <h2 className={`text-2xl font-black mb-6 tracking-tight ${isDark ? 'text-amber-400' : 'text-[#800020]'}`}>Our Vision</h2>
        <div className={`space-y-4 font-medium leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {settings?.visionText || 
`The Epe Premier League (EPL) was established to revolutionize grassroots football by providing a professional, competitive, and highly organized platform for emerging talent. We believe in the power of the beautiful game to unite communities, inspire youth, and showcase the immense sporting potential within our region.

Through this digital transformation and the launch of our official application, we are bringing the excitement of the league directly to the fans. From real-time match tracking and dynamic league standings to an immersive Fantasy League experience, the EPL app bridges the gap between the pitch and the supporters, creating a deeply connected football ecosystem.`}
        </div>
      </div>

      {/* Leadership & Governance */}
      <div className="bg-gradient-to-br from-[#800020] via-[#800020] to-[#881337] rounded-[2rem] p-8 md:p-12 shadow-xl shadow-[#800020]/20 text-white border border-[#FBB931]/30">
        <h2 className="text-2xl font-black text-white mb-8 tracking-tight border-b border-[#FBB931]/40 pb-4">Leadership & Governance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(settings?.leadership || []).map((leader, index) => (
            <div key={index} className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10 text-center flex flex-col items-center">
              {leader.imageUrl ? (
                <img src={leader.imageUrl} alt={leader.name} className="w-20 h-20 rounded-full object-cover mb-4 shadow-lg border-2 border-amber-400" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 text-[#800020] font-black text-2xl shadow-lg border-2 border-amber-400">
                  {leader.name ? leader.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                </div>
              )}
              <h3 className="font-bold text-lg text-white tracking-tight">{leader.name}</h3>
              <p className="text-amber-400 text-sm mt-1 font-bold uppercase tracking-wider text-[10px]">{leader.role}</p>
            </div>
          ))}
          {(!settings?.leadership || settings.leadership.length === 0) && (
            <>
              <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 text-[#800020] font-black text-xl shadow-lg border-2 border-amber-400">
                  MB
                </div>
                <h3 className="font-bold text-lg text-white tracking-tight">Mujib Bankole-Otedola</h3>
                <p className="text-amber-400 text-sm mt-1 font-bold uppercase tracking-wider text-[10px]">Executive Board</p>
              </div>
              
              <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 text-[#800020] font-black text-xl shadow-lg border-2 border-amber-400">
                  AA
                </div>
                <h3 className="font-bold text-lg text-white tracking-tight">Ayodele Adio</h3>
                <p className="text-amber-400 text-sm mt-1 font-bold uppercase tracking-wider text-[10px]">Executive Board</p>
              </div>

              <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 text-[#800020] font-black text-xl shadow-lg border-2 border-amber-400">
                  AG
                </div>
                <h3 className="font-bold text-lg text-white tracking-tight">Ahmad Garbadeen</h3>
                <p className="text-amber-400 text-sm mt-1 font-bold uppercase tracking-wider text-[10px]">Executive Board</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Developer Attribution Footer */}
      <div className={`pt-8 pb-12 border-t flex flex-col items-center justify-center text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`px-6 py-4 rounded-2xl border shadow-sm flex flex-col items-center text-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDark ? 'text-amber-400' : 'text-[#800020]'}`}>App Developer</p>
          <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Ahmad Garbadeen</p>
        </div>
      </div>
    </div>
  );
};
