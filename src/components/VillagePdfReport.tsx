import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileCheck,
  Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BeneficiaryRow } from '../types';
import { VILLAGES_LIST, SANSAD_LIST } from '../data/bankMaster';
import { NationalEmblemLogo, VbGramGActLogo } from './Emblems';
import { formatKycDate } from '../utils/dateFormatter';

interface VillagePdfReportProps {
  beneficiaries: BeneficiaryRow[];
  initialCategoryFilter?: 'TOTAL' | 'DONE' | 'PENDING' | 'DEATH' | null;
  onPrintSlip: (row: BeneficiaryRow) => void;
  onPrintA5Slip: (row: BeneficiaryRow) => void;
  language?: 'bn' | 'en';
}

export const VillagePdfReport: React.FC<VillagePdfReportProps> = ({
  beneficiaries,
  initialCategoryFilter,
  onPrintSlip,
  onPrintA5Slip
}) => {
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedSansad, setSelectedSansad] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'TOTAL' | 'DONE' | 'PENDING' | 'DEATH'>(
    initialCategoryFilter || 'ALL'
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Fast memoized filtering for thousands of rows
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return beneficiaries.filter(row => {
      // Village filter
      if (selectedVillage && row.colV !== selectedVillage) {
        return false;
      }

      // Sansad filter (e.g. BATHUARY 1 to BATHUARY 16)
      if (selectedSansad && (row.colB || '').toUpperCase() !== selectedSansad.toUpperCase()) {
        return false;
      }

      // Category filter
      const kyc = (row.colR || '').toUpperCase();
      const err = (row.colT || '').toLowerCase();

      if (selectedCategory === 'DONE') {
        if (kyc !== 'YES' && kyc !== 'Y') return false;
      } else if (selectedCategory === 'DEATH') {
        if (!err.includes('death') && !err.includes('expired') && !err.includes('died')) return false;
      } else if (selectedCategory === 'PENDING') {
        if (kyc === 'YES' || kyc === 'Y' || err.includes('death') || err.includes('expired') || err.includes('died')) {
          return false;
        }
      }

      // Text search inside filtered view
      if (term) {
        const jc = (row.colH || '').toLowerCase();
        const name = (row.colJ || '').toLowerCase();
        const aadh = (row.colP || '').toLowerCase();
        const hoh = (row.colAG || '').toLowerCase();
        if (!jc.includes(term) && !name.includes(term) && !aadh.includes(term) && !hoh.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [beneficiaries, selectedVillage, selectedSansad, selectedCategory, searchTerm]);

  // Total pages
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredRows.length / pageSize) || 1;

  // Paginated slice for instant zero-lag rendering
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return filteredRows;
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = (setter: () => void) => {
    setter();
    setCurrentPage(1);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print blocked or unavailable:', err);
    }
  };

  const handleExportExcel = () => {
    const data = filteredRows.map((r, i) => ({
      "SL No": i + 1,
      "Sansad": r.colB,
      "Job Card Number": r.colH,
      "Applicant Name": r.colJ,
      "Gender": r.colK,
      "Head of Household": r.colAG,
      "Father/Husband Name of HH": r.colAF,
      "Village": r.colV,
      "Aadhaar Number": r.colP,
      "Mobile Number": r.colQ,
      "e-KYC Done": r.colR,
      "e-KYC Date": r.colS,
      "Error / Death": r.colT,
      "Bank Name": r.colAO,
      "IFSC Code": r.colAP,
      "Account No": r.colAR
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Job_Card_Report");
    XLSX.writeFile(wb, `Bathuary_GP_Report_${selectedSansad || selectedVillage || 'ALL'}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Header Banner */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NationalEmblemLogo className="w-10 h-14 text-slate-950" />
            <div>
              <div className="text-xs font-black uppercase text-slate-950 leading-tight">
                Govt. of West Bengal
              </div>
              <div className="text-[11px] font-bold text-emerald-900 uppercase leading-tight mt-0.5">
                Panchayats & Rural Development
              </div>
              <h2 className="text-base font-black text-slate-950 uppercase mt-0.5">
                Bathuary Gram Panchayat • Egra-II Block
              </h2>
            </div>
          </div>
          <div className="text-right">
            <VbGramGActLogo className="w-20 h-10 ml-auto" />
            <span className="text-[10px] font-bold text-slate-700 block mt-1">
              VB-GRAM G ACT • VIKSIT BHARAT 2047
            </span>
          </div>
        </div>
        <div className="mt-2 text-center text-xs font-black uppercase bg-slate-900 text-white py-1">
          OFFICIAL CITIZEN VERIFICATION & e-KYC REGISTER ({selectedSansad || selectedVillage || 'ALL SANSADS'})
        </div>
      </div>

      {/* Top Filter Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Village & Sansad Analytical Report
              </h3>
              <p className="text-xs text-slate-500">
                Instant search, filtration across 29 villages & 16 Sansads with export-ready A4 PDF and Excel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel ({filteredRows.length})</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Report</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          {/* Sansad Filter */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Filter by Sansad:
            </label>
            <select
              value={selectedSansad}
              onChange={(e) => handleFilterChange(() => setSelectedSansad(e.target.value))}
              className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">-- ALL SANSADS (1-16) --</option>
              {SANSAD_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Filter by Village:
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => handleFilterChange(() => setSelectedVillage(e.target.value))}
              className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="">-- ALL 29 VILLAGES --</option>
              {VILLAGES_LIST.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Filter by Status:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange(() => setSelectedCategory(e.target.value as any))}
              className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Records</option>
              <option value="DONE">e-KYC Completed</option>
              <option value="PENDING">e-KYC Pending</option>
              <option value="DEATH">Expired / Death</option>
            </select>
          </div>

          {/* Instant Table Search Filter */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Search Table Records:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Job Card, Name, Aadhaar..."
                value={searchTerm}
                onChange={(e) => handleFilterChange(() => setSearchTerm(e.target.value))}
                className="w-full bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold rounded-xl pl-9 pr-3 py-2.5 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Table */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {/* Table Controls & Pagination Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 no-print">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
              Live Beneficiary Register
              <span className="text-xs font-normal text-slate-500 ml-2">
                (Showing {paginatedRows.length} of {filteredRows.length.toLocaleString()} matching records)
              </span>
            </h4>
          </div>

          {/* Rows Per Page & Pagination Nav */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>All ({filteredRows.length})</option>
              </select>
            </div>

            {pageSize !== -1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white sticky top-0 z-10 font-sans">
              <tr>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800 w-12 text-center">Sl</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800">Sansad</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800">Job Card No</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800">Applicant Name</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800">Head of Household</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800">Village</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800">Aadhaar (Masked)</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-800 text-center">e-KYC Status</th>
                <th className="p-3 text-[10px] font-black uppercase tracking-wider text-center no-print w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const absoluteIndex = pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                  const isDone = (row.colR || '').toUpperCase() === 'YES' || (row.colR || '').toUpperCase() === 'Y';
                  const isDead = (row.colT || '').toLowerCase().includes('death');

                  return (
                    <tr 
                      key={`${row.colH}-${row.colJ}-${idx}`} 
                      className={idx % 2 === 1 ? 'bg-slate-50/70 hover:bg-slate-100 transition-colors' : 'bg-white hover:bg-slate-100 transition-colors'}
                    >
                      <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-200">{absoluteIndex}</td>
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">{row.colB}</td>
                      <td className="p-3 font-mono font-black text-slate-900 border-r border-slate-200 whitespace-nowrap">{row.colH}</td>
                      <td className="p-3 font-bold text-slate-950 uppercase border-r border-slate-200">{row.colJ}</td>
                      <td className="p-3 text-slate-700 uppercase border-r border-slate-200">{row.colAG || "—"}</td>
                      <td className="p-3 text-slate-800 border-r border-slate-200 whitespace-nowrap">{row.colV}</td>
                      <td className="p-3 font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                        {row.colP ? `•••• ${row.colP.slice(-4)}` : "—"}
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : isDead 
                              ? 'bg-rose-100 text-rose-950 border border-rose-300'
                              : 'bg-amber-100 text-amber-950 border border-amber-300'
                        }`}>
                          {isDone ? "✓ Completed" : isDead ? "Expired" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintSlip(row)}
                            className="px-2.5 py-1.5 rounded-xl btn-3d-slip text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-xs hover:shadow-sm transition-all whitespace-nowrap"
                            title="Print Citizen Acknowledgement Slip"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print Slip</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onPrintA5Slip(row)}
                            className="px-3 py-1.5 rounded-xl btn-3d-jobcard text-white font-extrabold text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-xs hover:shadow-md transition-all whitespace-nowrap"
                            title="Official Job Card Print (A5 Verification Certificate)"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Job Card Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500 font-semibold">
                    No beneficiary records found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls */}
        {totalPages > 1 && pageSize !== -1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/80 no-print">
            <span className="text-xs text-slate-500">
              Showing page {currentPage} of {totalPages} ({filteredRows.length.toLocaleString()} total beneficiaries)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
