import React, { useState } from 'react';
import { Search, IdCard, CheckCircle2, Clock, Printer, FileCheck, MapPin, Building, CreditCard, User } from 'lucide-react';
import { BeneficiaryRow } from '../types';
import { formatKycDate } from '../utils/dateFormatter';

interface CitizenSearchCornerProps {
  beneficiaries: BeneficiaryRow[];
  onPrintSlip: (row: BeneficiaryRow) => void;
  onPrintA5Slip: (row: BeneficiaryRow) => void;
}

export const CitizenSearchCorner: React.FC<CitizenSearchCornerProps> = ({
  beneficiaries,
  onPrintSlip,
  onPrintA5Slip
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const trimmed = searchTerm.trim().toLowerCase();
  const searchResults = trimmed
    ? beneficiaries.filter(b => 
        (b.colH && String(b.colH).toLowerCase().includes(trimmed)) ||
        (b.colJ && String(b.colJ).toLowerCase().includes(trimmed)) ||
        (b.colAF && String(b.colAF).toLowerCase().includes(trimmed)) ||
        (b.colAG && String(b.colAG).toLowerCase().includes(trimmed)) ||
        (b.colP && String(b.colP).toLowerCase().includes(trimmed)) ||
        (b.colQ && String(b.colQ).toLowerCase().includes(trimmed)) ||
        (b.colV && String(b.colV).toLowerCase().includes(trimmed))
      ).slice(0, 15)
    : [];

  return (
    <div className="space-y-6">
      {/* Search Hero Box */}
      <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <IdCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Citizen Search & Verification Corner</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Check Your Job Card & e-KYC Status
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Search using Job Card Number, Applicant Name, Head of Household, Aadhaar Number, or Mobile.
          </p>

          {/* Search Input Bar */}
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="e.g. WB-14-012-005... or MANAS MANNA or 9832104561 or HATBAINCHA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-sm sm:text-base font-semibold rounded-2xl pl-12 pr-4 py-3.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-inner transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {trimmed ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
            <span>Search Results: {searchResults.length} records found</span>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((row, idx) => {
                const isDone = (row.colR || '').toUpperCase() === 'YES' || (row.colR || '').toUpperCase() === 'Y';
                const isDead = (row.colT || '').toLowerCase().includes('death');

                return (
                  <div
                    key={`${row.colH}-${row.colJ}-${idx}`}
                    className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group"
                  >
                    {/* Top Card Bar */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          {row.colF || 'BATHUARY'} GP • {row.colB}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 tracking-tight group-hover:text-emerald-700 transition-colors">
                          {row.colJ}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                        isDone 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDead 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{isDone ? "e-KYC Completed" : isDead ? "Deceased / Inactive" : "e-KYC Pending"}</span>
                      </span>
                    </div>

                    {/* Card Body Details with Col AG, AF, H, B, V, W */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Job Card Number:</span>
                        <span className="font-mono font-bold text-emerald-800 truncate block">{row.colH}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Head of Household (Col AG):</span>
                        <span className="font-bold text-slate-800 truncate block">{row.colAG || row.colJ || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Father/Husband Name of HH (Col AF):</span>
                        <span className="text-slate-700 truncate block">{row.colAF || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Village Name (Col V):</span>
                        <span className="font-bold text-slate-800 truncate block">{row.colV || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Sansad Name (Col B):</span>
                        <span className="font-medium text-slate-700 truncate block">{row.colB || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Job Card Submitted (Col W):</span>
                        <span className="font-bold text-emerald-700 truncate block">{row.colW || "Yes"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">ABPS Status (Col O):</span>
                        <span className={`font-bold text-[11px] ${row.colO === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {row.colO === 'Yes' ? "Active" : "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block">Aadhaar (Masked):</span>
                        <span className="font-mono text-slate-600 truncate block">
                          {row.colP ? `•••• •••• ${row.colP.slice(-4)}` : "Not Seeded"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons: Print Slip + Job Card Print (3D & Dynamic) */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isDone ? `Verified: ${formatKycDate(row.colS) || "Done"}` : (row.colT || "e-KYC Pending")}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onPrintSlip(row)}
                          className="px-3.5 py-2 rounded-xl btn-3d-slip text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm transition-all"
                          title="Print Citizen Acknowledgement Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>

                        <button
                          onClick={() => onPrintA5Slip(row)}
                          className="px-4 py-2 rounded-xl btn-3d-jobcard text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all"
                          title="Official Job Card Print (Family Verification Certificate)"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Job Card Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-sm">
              No matching citizen records found. Please verify the Job Card number or name.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
