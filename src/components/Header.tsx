import React from 'react';
import { 
  Menu, 
  RefreshCw, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { NationalEmblemLogo, VbGramGActLogo } from './Emblems';
import { AppUser } from '../types';

interface HeaderProps {
  currentTab: string;
  onOpenSidebar: () => void;
  isSyncing: boolean;
  onRefreshData: () => void;
  onOpenSyncModal: () => void;
  syncedSheetInfo?: {
    totalRecords: number;
    villagesCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSidebar,
  isSyncing,
  onRefreshData,
  onOpenSyncModal,
  syncedSheetInfo
}) => {
  // English title based on active tab
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard & Analytics';
      case 'search': return 'Citizen Search Corner';
      case 'dataForm': return 'Data Update Form';
      case 'reports': return 'Village Report & PDF Generator';
      case 'ai': return 'AI Verifier & Assistant';
      case 'users': return 'Staff & Operator Management';
      case 'deploy': 
      case 'deployment': return 'Deployment & Hosting Guide';
      case 'security': 
      case 'policy': return 'Security & Privacy Policy';
      default: return 'Bathuary Gram Panchayat Portal';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs transition-all no-print">
      {/* Top Deep Blue Government Banner */}
      <div className="bg-[#0B132B] px-4 sm:px-6 py-2.5 text-xs text-slate-200 border-b border-slate-800">
        <div className="flex flex-wrap justify-between items-center gap-2">
          {/* Left Brand Identifier with Official Logos (Logo 1 & Logo 2) */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle for Left Sidebar */}
            <button
              id="mobile-sidebar-toggle-btn"
              onClick={onOpenSidebar}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Official Logos: State Emblem of India (Logo 1) & VB-GRAM G Act (Logo 2) */}
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white rounded-lg shadow-xs border border-slate-300">
                <NationalEmblemLogo className="w-5 h-7 text-slate-900 drop-shadow-xs" />
              </div>
              <div className="p-1 bg-white rounded-lg shadow-xs border border-slate-300">
                <VbGramGActLogo className="w-12 h-7 drop-shadow-xs" />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase leading-tight">
                  Govt. of West Bengal
                </span>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-400 leading-tight">
                  <span>Panchayats & Rural Development</span>
                  <span className="text-slate-400 hidden sm:inline">• Bathuary Gram Panchayat, Egra-II</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Bar (Enhanced 3D Buttons) */}
          <div className="flex items-center gap-2.5 text-[11px]">
            <button
              id="header-link-sheet-btn"
              onClick={onOpenSyncModal}
              className="flex items-center gap-1.5 text-white btn-3d-save px-3.5 py-1.5 rounded-xl font-bold cursor-pointer"
              title="Auto-Link Google Sheet or upload master Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">⚡ LINK GOOGLE SHEET</span>
              <span className="sm:hidden">LINK SHEET</span>
            </button>

            <button
              id="header-refresh-btn"
              onClick={onRefreshData}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-white btn-3d-sync px-3.5 py-1.5 rounded-xl font-bold cursor-pointer disabled:opacity-50"
              title="Refresh and re-synchronize records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-200' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? "SYNCING..." : "SYNC"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar: Deep/Light Header with Breadcrumb & Village Stats (100% English) */}
      <div className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Trigger (if on narrow screen) */}
          <button
            onClick={onOpenSidebar}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs shadow-xs"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
            <span>Menu</span>
          </button>

          {/* Active Section Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-800">Bathuary GP</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">
              {getTabTitle(currentTab)}
            </h2>
          </div>
        </div>

        {/* Master 29 Villages Badge & Sync Indicator */}
        <div className="flex items-center gap-2">
          {syncedSheetInfo && syncedSheetInfo.totalRecords > 0 ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{syncedSheetInfo.totalRecords.toLocaleString()} Verified Records</span>
              <span className="text-emerald-300">•</span>
              <span className="text-emerald-700">29 Canonical Villages</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Official Master Database</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-800">29 Canonical Villages</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
