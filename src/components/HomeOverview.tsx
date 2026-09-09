import React from 'react';
import { 
  Building, 
  Search, 
  UserCheck, 
  FileText, 
  BarChart3, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Fingerprint, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles
} from 'lucide-react';
import { AnalyticsData, VillageStat } from '../types';
import { NationalEmblemLogo, VbGramGActLogo } from './Emblems';
import { SANSAD_LIST } from '../data/bankMaster';

interface HomeOverviewProps {
  analytics: AnalyticsData;
  villageStats: VillageStat[];
  onNavigateTab: (tab: string, extra?: any) => void;
  onOpenSyncModal: () => void;
  language?: 'bn' | 'en';
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  analytics,
  villageStats,
  onNavigateTab,
  onOpenSyncModal
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Official Government & Panchayat Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0B132B] via-slate-900 to-[#1C2541] text-white p-6 sm:p-8 shadow-xl border border-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Official e-Governance Portal</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <Building className="w-3.5 h-3.5" />
                <span>29 Villages • 16 Sansads</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>VB-GRAM G ACT • VIKSIT BHARAT</span>
              </span>
            </div>

            {/* Official Headings */}
            <div>
              <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-emerald-400">
                Govt. of West Bengal • Panchayats & Rural Development
              </p>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1">
                BATHUARY GRAM PANCHAYAT
              </h1>
              <p className="text-sm sm:text-base font-semibold text-slate-300 mt-1">
                Egra-II Development Block • Purba Medinipur
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Welcome to the official Job Card & e-KYC Service Portal of Bathuary Gram Panchayat.
              Manage citizen job card records, track biometric authentication, verify ABPS bank credit eligibility, and generate official A4/A5 certificates with direct Google Sheet linkage.
            </p>
          </div>

          {/* Right Emblem Showcase & Quick Sheet Link Button */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                <NationalEmblemLogo className="w-8 h-12 text-white" />
              </div>
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                <VbGramGActLogo className="w-16 h-12" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="btn-3d-save px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Link Google Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Full Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Overview (High Contrast & Clear) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Job Cards */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-500 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase text-blue-900 tracking-wider">Total Job Cards</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-2">{analytics.total}</h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Registered in Bathuary GP</p>
        </div>

        {/* Metric 2: e-KYC Done */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="rounded-2xl bg-white border-2 border-emerald-300 hover:border-emerald-600 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase text-emerald-900 tracking-wider">e-KYC Verified</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-900">{analytics.done}</h3>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {analytics.donePct}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Biometric verified</p>
        </div>

        {/* Metric 3: Pending e-KYC */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="rounded-2xl bg-white border-2 border-amber-300 hover:border-amber-500 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase text-amber-950 tracking-wider">Pending e-KYC</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-950">{analytics.pending}</h3>
            <span className="text-xs font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-full">
              {analytics.pendingPct}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Awaiting authentication</p>
        </div>

        {/* Metric 4: ABPS Enabled */}
        <div 
          onClick={() => onNavigateTab('dashboard')}
          className="rounded-2xl bg-white border-2 border-indigo-200 hover:border-indigo-500 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-black uppercase text-indigo-950 tracking-wider">ABPS Payment</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-indigo-950">{analytics.abpsActive}</h3>
            <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full">
              {analytics.total ? Math.round((analytics.abpsActive / analytics.total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Direct bank DBT active</p>
        </div>
      </div>

      {/* 3. Primary Core Service Hub (Large Interactive Navigation Cards) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Panchayat Service Hub & Quick Actions
              </h2>
              <p className="text-xs text-slate-500">
                Access any e-governance service module directly in one click.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:inline">
            Fast Navigation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Citizen Search Corner */}
          <div 
            onClick={() => onNavigateTab('search')}
            className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Citizen Search
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                Citizen Search Corner
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Instant lookup by Job Card Number (WB-16-003...), 12-digit Aadhaar, or Applicant Name with official verification badge.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Open Search Corner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Data Update & e-KYC Form */}
          <div 
            onClick={() => onNavigateTab('dataForm')}
            className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  e-KYC & Bank
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                Data Update Form
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Authorized entry of Aadhaar, Mobile, biometric e-KYC verification, and normalized Bank details (IPPB, SBI, BGVB, etc.).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Open Update Form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Village & Sansad Analytical Report */}
          <div 
            onClick={() => onNavigateTab('reports')}
            className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  A4 Print & PDF
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                Village & Sansad Report
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Full list filterable by Sansad (1 to 16) and 29 villages. Optimized A4 Print layout, Excel download, and Acknowledgement Slips.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>Generate A4 Report</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Analytics Dashboard */}
          <div 
            onClick={() => onNavigateTab('dashboard')}
            className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border-2 border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Analytics
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                Analytics & 29 Villages
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Detailed charts for each of the 29 canonical villages, compliance gauges, deceased filtering, and Sansad breakdown.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-900">
              <span>View Full Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Direct Google Sheet Link */}
          <div 
            onClick={onOpenSyncModal}
            className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 border-2 border-slate-200 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Live Sync
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                Google Sheet Connection
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Direct live synchronization via Google Sheet link or file upload. Zero Apps Script dependency, complete data ownership.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-800">
              <span>Connect / Update Sheet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Security & ISO Standards */}
          <div 
            onClick={() => onNavigateTab('security')}
            className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 via-white to-purple-50/40 border-2 border-slate-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Data Security
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                Security & Aadhaar Policy
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                ISO compliant role-based authentication, 12-digit UID masking, audit logs, and strict DPDP Act compliance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-800">
              <span>View Security Protocol</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Sansad Directory (16 Sansads of Bathuary GP) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h3 className="text-base font-black text-slate-900">
              Direct Sansad Quick Filter (BATHUARY 1 to 16)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any Sansad to view its beneficiaries
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {SANSAD_LIST.map((sansad) => (
            <button
              key={sansad}
              type="button"
              onClick={() => onNavigateTab('reports', { sansad })}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-600 hover:text-white border border-slate-200 text-slate-800 text-xs font-bold text-center transition-all cursor-pointer shadow-2xs hover:shadow-sm"
              title={`View ${sansad} Report`}
            >
              {sansad}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
