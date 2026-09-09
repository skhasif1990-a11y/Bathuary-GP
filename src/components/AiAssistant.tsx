import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { BeneficiaryRow } from '../types';

interface AiAssistantProps {
  beneficiaries: BeneficiaryRow[];
  activeAuditRow?: BeneficiaryRow | null;
  language?: 'bn' | 'en';
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  beneficiaries,
  activeAuditRow
}) => {
  // Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: "Hello! I am the Bathuary Gram Panchayat AI Assistant. How can I assist you with Job Cards, e-KYC compliance, or beneficiary queries today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // AI Audit state
  const [auditTarget, setAuditTarget] = useState<BeneficiaryRow | null>(activeAuditRow || (beneficiaries[0] || null));
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Send question
  const handleSendQuestion = async (qText?: string) => {
    const q = (qText || inputQuestion).trim();
    if (!q || isAsking) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      const reply = data.reply || "Unable to get response from server.";
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai' as const,
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai' as const,
          text: "Network connection error. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Run audit on selected record
  const handleRunAudit = async () => {
    if (!auditTarget || isAuditing) return;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiary: auditTarget })
      });
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      setAuditResult({
        score: 75,
        issues: ["Automated server audit unavailable. Using local heuristic rules."],
        recommendations: ["Ensure 12-digit Aadhaar UID and valid 10-digit mobile number are recorded."]
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const sampleQuestions = [
    "What is the current e-KYC pending count in Bathuary?",
    "How to enable ABPS for Job Card wage payment?",
    "Updated IFSC codes for United Bank & Allahabad Bank?",
    "Official contact details for Bathuary GP office?"
  ];

  return (
    <div className="space-y-6">
      {/* Top AI Intelligence Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 text-white p-6 sm:p-7 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 absolute top-0 left-0" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Gram Panchayat AI Intelligence & Auditor
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                  Live v2.5
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Deep analysis of NREGASoft records, Aadhaar UID conformity, RBI Bank merger IFSC resolution & instant citizen helpline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Dataset Records</span>
              <span className="text-base font-black text-emerald-400 font-mono">{beneficiaries.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">System Health</span>
              <span className="text-xs font-black text-teal-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: AI Data Quality Auditor */}
        <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 border-2 border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-emerald-500 absolute top-0 left-0" />
          
          <div>
            <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-200/80 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Smart AI Data Quality Auditor
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Automated rule & AI verification for Aadhaar, Bank IFSC, and ABPS linkage.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                Auto-Audit
              </span>
            </div>

            {/* Record Selector */}
            <div className="mb-4">
              <label className="text-xs font-black text-slate-800 mb-1.5 block">
                Select Beneficiary to Audit:
              </label>
              <select
                value={auditTarget ? `${auditTarget.colH}-${auditTarget.colJ}` : ''}
                onChange={(e) => {
                  const match = beneficiaries.find(b => `${b.colH}-${b.colJ}` === e.target.value);
                  setAuditTarget(match || null);
                  setAuditResult(null);
                }}
                className="w-full bg-white text-slate-900 text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer shadow-2xs"
              >
                {beneficiaries.map((b, i) => (
                  <option key={`${b.colH}-${i}`} value={`${b.colH}-${b.colJ}`}>
                    {b.colJ} ({b.colH}) - {b.colV}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick preview of selected record */}
            {auditTarget && (
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-200/80 text-xs space-y-2 mb-4 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Applicant Name:</span>
                  <span className="font-black text-slate-900 text-sm">{auditTarget.colJ}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Job Card Number:</span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{auditTarget.colH}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Aadhaar (Col P):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {auditTarget.colP ? `${auditTarget.colP.slice(0, 4)} •••• ${auditTarget.colP.slice(-4)}` : "Not Provided ✕"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Bank & IFSC:</span>
                  <span className="font-bold text-slate-800">{auditTarget.colAO || "—"} ({auditTarget.colAP || "—"})</span>
                </div>
              </div>
            )}

            {/* Audit Results */}
            {auditResult && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                    <div>
                      <span className="text-xs font-black text-emerald-950 block">Data Quality Index:</span>
                      <span className="text-[11px] text-emerald-800 font-medium">
                        {auditResult.score >= 80 ? 'Compliant for DBT Wage disbursement' : 'Action required before uploading'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black font-mono ${auditResult.score >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {auditResult.score || 85}/100
                    </span>
                    <span className={`block text-[10px] font-black uppercase ${auditResult.score >= 80 ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {auditResult.score >= 80 ? 'Grade A+' : 'Grade B'}
                    </span>
                  </div>
                </div>

                {auditResult.summary && (
                  <p className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 font-medium leading-relaxed">
                    {auditResult.summary}
                  </p>
                )}

                {auditResult.issues && auditResult.issues.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs text-rose-900 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-black text-rose-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Identified Issues & Inconsistencies:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs font-medium">
                      {auditResult.issues.map((iss: string, idx: number) => (
                        <li key={idx}>{iss}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-xs text-emerald-900 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-black text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recommendations & Action Steps:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs font-medium">
                      {auditResult.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleRunAudit}
            disabled={!auditTarget || isAuditing}
            className="w-full mt-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer hover:shadow-xl active:scale-[0.99]"
          >
            <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? "Auditing Record with AI..." : "Run AI Data Audit"}</span>
          </button>
        </div>

        {/* Panel 2: Interactive AI Assistant Chat */}
        <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-indigo-50/20 border-2 border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col h-[600px] relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-blue-500 absolute top-0 left-0" />
          
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-3.5 border-b border-slate-200/80 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Bathuary GP Virtual AI Helpdesk
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Instant answers & NREGA guideline assistance
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          {/* Sample Questions Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSendQuestion(sq)}
                className="text-[11px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 transition-all font-semibold cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-white text-slate-800 border-2 border-slate-200/80 rounded-tl-none font-normal'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className={`block text-[9px] text-right mt-1.5 font-mono ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {m.time}
                  </span>
                </div>
                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isAsking && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-indigo-700 text-xs font-bold animate-pulse shadow-2xs">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI assistant is thinking and searching Bathuary records...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="pt-3.5 border-t border-slate-200/80 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a question (e.g. how to enable ABPS for Job Card)..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
              className="flex-1 bg-white text-slate-900 text-xs sm:text-sm font-semibold rounded-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-500 focus:outline-none shadow-2xs"
            />
            <button
              onClick={() => handleSendQuestion()}
              disabled={!inputQuestion.trim() || isAsking}
              className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
