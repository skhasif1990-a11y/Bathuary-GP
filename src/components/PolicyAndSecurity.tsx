import React from 'react';
import { ShieldCheck, Lock, EyeOff, FileText, Mail, Building } from 'lucide-react';

interface PolicyAndSecurityProps {
  language?: 'bn' | 'en';
}

export const PolicyAndSecurity: React.FC<PolicyAndSecurityProps> = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Data Security & Privacy Policy
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Official data protection, Aadhaar privacy compliance, and terms of use for Bathuary Gram Panchayat.
            </p>
          </div>
        </div>
      </div>

      {/* Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">
            Aadhaar Privacy & Masking
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            In strict compliance with Aadhaar Act Section 29, the first 8 digits of Aadhaar are securely masked (XXXX-XXXX-1234) on all public screens.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">
            Role-Based Access Control (RBAC)
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Only verified GP officers (Secretary, GRS, VLE) hold editing permissions with authenticated sessions.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">
            Tamper-Proof Audit Trail
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            All data updates log the editor's identity and timestamp for full administrative transparency and accountability.
          </p>
        </div>
      </div>

      {/* Official Contact Box (No mobile helpline number as requested) */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">
          Official Office Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">Official Email:</span>
              <a href="mailto:bathuarygp@gmail.com" className="font-bold text-slate-900 hover:text-sky-700">bathuarygp@gmail.com</a>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">Field Office Address:</span>
              <span className="font-bold text-slate-900">Hatbaincha, Egra-II Development Block, Purba Medinipur</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <p className="font-bold text-slate-800">
            © 2026 Bathuary Gram Panchayat, Govt. of West Bengal. All Rights Reserved.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            VB-GRAM G Act Field Portal
          </p>
        </div>
      </div>
    </div>
  );
};
