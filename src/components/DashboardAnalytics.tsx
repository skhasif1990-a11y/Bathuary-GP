import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  UserX, 
  Building, 
  CreditCard, 
  Fingerprint, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { AnalyticsData, VillageStat } from '../types';

interface DashboardProps {
  analytics: AnalyticsData;
  villageStats: VillageStat[];
  sansadList: string[];
  selectedSansad: string;
  onSansadChange: (sansad: string) => void;
  onSelectCategoryReport: (type: 'TOTAL' | 'DONE' | 'PENDING' | 'DEATH') => void;
  onOpenSyncModal?: () => void;
  onNavigateToHome?: () => void;
  language?: 'bn' | 'en';
}

export const DashboardAnalytics: React.FC<DashboardProps> = ({
  analytics,
  villageStats,
  sansadList,
  selectedSansad,
  onSansadChange,
  onSelectCategoryReport,
  onOpenSyncModal,
  onNavigateToHome
}) => {
  return (
    <div className="space-y-6">
      {/* Top View Selector: Home Portal vs Analytics Dashboard */}
      {onNavigateToHome && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToHome}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🏠</span>
              <span>Home Portal Overview</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs flex items-center gap-2 cursor-default"
            >
              <span>📊</span>
              <span>Analytics Dashboard (Live)</span>
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            Real-time Job Card & e-KYC Monitoring
          </span>
        </div>
      )}

      {/* Top Banner with Sansad Selector */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold mb-2 shadow-xs">
              <Building className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span>Bathuary Gram Panchayat • Egra-II Development Block • Purba Medinipur</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
              <span>Job Card & e-KYC Analytics Dashboard</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Real-time monitoring of Aadhaar seeding, biometric e-KYC progress, and ABPS payment compliance across all 29 villages and 16 Sansads (BATHUARY 1 to BATHUARY 16).
            </p>
          </div>

          {/* Action Area: Sansad Filter Dropdown (Strictly BATHUARY 1..16) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-200 shadow-xs">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap pl-1">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>Sansad Filter:</span>
              </label>
              <select
                value={selectedSansad}
                onChange={(e) => onSansadChange(e.target.value)}
                className="bg-white text-slate-900 text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer min-w-[190px] shadow-xs"
              >
                <option value="ALL">-- ALL 16 SANSADS --</option>
                {sansadList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Enhanced High-Contrast Vivid Animated Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Job Cards */}
        <div 
          onClick={() => onSelectCategoryReport('TOTAL')}
          className="rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-2 border-blue-200 hover:border-blue-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">Total Job Cards</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:rotate-6 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">{analytics.total}</h3>
            <span className="text-xs font-black text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-300 flex items-center gap-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              List <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">All registered citizen records in master database</p>
          <div className="w-full bg-blue-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-full" />
          </div>
        </div>

        {/* 2. e-KYC Done */}
        <div 
          onClick={() => onSelectCategoryReport('DONE')}
          className="rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/40 border-2 border-emerald-300 hover:border-emerald-600 p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">e-KYC Completed</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl sm:text-4xl font-black text-emerald-900 tracking-tight">{analytics.done}</h3>
            <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-400 shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              {analytics.donePct}%
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">Biometric e-KYC verified by authorized officers</p>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.donePct}%` }} />
          </div>
        </div>

        {/* 3. e-KYC Pending */}
        <div 
          onClick={() => onSelectCategoryReport('PENDING')}
          className="rounded-3xl bg-gradient-to-br from-white via-amber-50/40 to-orange-50/40 border-2 border-amber-300 hover:border-amber-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Pending e-KYC</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:rotate-12 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl sm:text-4xl font-black text-amber-950 tracking-tight">{analytics.pending}</h3>
            <span className="text-xs font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-full border border-amber-400 shadow-xs">
              {analytics.pendingPct}%
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">Awaiting biometric authentication</p>
          <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.pendingPct}%` }} />
          </div>
        </div>

        {/* 4. Deceased / Errors */}
        <div 
          onClick={() => onSelectCategoryReport('DEATH')}
          className="rounded-3xl bg-gradient-to-br from-white via-rose-50/40 to-red-50/40 border-2 border-rose-200 hover:border-rose-500 p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-950 uppercase tracking-wider">Deceased / Inactive</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl sm:text-4xl font-black text-rose-950 tracking-tight">{analytics.death}</h3>
            <span className="text-xs font-black text-rose-950 bg-rose-100 px-3 py-1 rounded-full border border-rose-300 shadow-xs">
              {analytics.deathPct}%
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">Deceased beneficiaries / cancelled records</p>
          <div className="w-full bg-rose-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${analytics.deathPct}%` }} />
          </div>
        </div>
      </div>

      {/* Secondary Compliance Cards: ABPS & Aadhaar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ABPS Payment Compliance */}
        <div className="rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 border-2 border-indigo-200 hover:border-indigo-400 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-950 text-base">ABPS Payment Enabled (Col O)</h4>
                <p className="text-xs text-slate-600">Aadhaar Based Payment System Active for direct bank credit</p>
              </div>
            </div>
            <span className="text-2xl font-black text-indigo-950">{analytics.abpsActive}</span>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-bold">ABPS Compliance Rate</span>
            <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300 shadow-xs">
              {analytics.total ? Math.round((analytics.abpsActive / analytics.total) * 100) : 0}% Active
            </span>
          </div>
          <div className="w-full bg-indigo-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.total ? Math.round((analytics.abpsActive / analytics.total) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Aadhaar Seeding Compliance */}
        <div className="rounded-3xl bg-gradient-to-br from-white via-sky-50/30 to-cyan-50/30 border-2 border-sky-200 hover:border-sky-400 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-950 text-base">Aadhaar Seeded (Col P)</h4>
                <p className="text-xs text-slate-600">12-Digit Unique Aadhaar UID Seeded & Verified</p>
              </div>
            </div>
            <span className="text-2xl font-black text-sky-950">{analytics.aadhaarSeeded}</span>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-bold">Aadhaar Seeding Rate</span>
            <span className="text-xs font-black text-sky-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-300 shadow-xs">
              {analytics.total ? Math.round((analytics.aadhaarSeeded / analytics.total) * 100) : 0}% Seeded
            </span>
          </div>
          <div className="w-full bg-sky-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-sky-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.total ? Math.round((analytics.aadhaarSeeded / analytics.total) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Village Breakdown Grid (Showing all 29 Villages) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Village-wise Progress & Statistics (Col V)
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {villageStats.length} Villages Listed (Total 29)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
          {villageStats.map(vs => {
            const vDonePct = vs.total ? Math.round((vs.done / vs.total) * 100) : 0;
            return (
              <div 
                key={vs.village} 
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-slate-50/80 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate max-w-[170px] uppercase">
                    {vs.village}
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {vs.total} Holders
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
                  <span className="text-emerald-700 font-bold">✓ {vs.done} ({vDonePct}%)</span>
                  <span className="text-amber-600 font-bold">⏳ {vs.pending}</span>
                  {vs.death > 0 && <span className="text-rose-600 font-bold">✕ {vs.death}</span>}
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${vDonePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
