import React, { useState } from 'react';
import { Users, UserPlus, Shield, Key, Trash2, History, CheckCircle2, Phone, Mail } from 'lucide-react';
import { AppUser, AuditLog } from '../types';

interface UserManagementProps {
  users: AppUser[];
  auditLogs: AuditLog[];
  onAddUser: (user: Partial<AppUser>) => Promise<boolean>;
  onDeleteUser: (mobile: string) => Promise<boolean>;
  language: 'bn' | 'en';
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  auditLogs,
  onAddUser,
  onDeleteUser,
  language
}) => {
  const isBn = language === 'bn';

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<Partial<AppUser>>({
    name: '',
    mobile: '',
    role: 'SAHAYAK',
    designation: 'Sahayak',
    email: '',
    assignedVillages: 'HATBAINCHA'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.mobile) return;
    const success = await onAddUser(newUser);
    if (success) {
      setShowAddModal(false);
      setNewUser({
        name: '',
        mobile: '',
        role: 'SAHAYAK',
        designation: 'Sahayak',
        email: '',
        assignedVillages: 'HATBAINCHA'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Officer & Staff Management (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Role-Based Access Control and authorized field user accounts for Bathuary GP.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div
            key={u.mobile}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md relative group transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center border border-emerald-200">
                {(u.name || 'U').charAt(0)}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                u.role === 'ADMIN' 
                  ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {u.role}
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-extrabold text-slate-900 text-sm truncate">{u.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{u.designation}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{u.mobile}</span>
              </div>
              {u.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{u.email}</span>
                </div>
              )}
            </div>

            {u.mobile !== '9002736997' && (
              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => onDeleteUser(u.mobile)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Audit Log Trail */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900">
              System Audit Trail & Update History
            </h4>
            <p className="text-xs text-slate-500">
              Immutable record of all beneficiary modifications and officer actions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Job Card No</th>
                <th className="py-3 px-3">Beneficiary Name</th>
                <th className="py-3 px-3">Updated By (Staff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{log.jobCardNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{log.beneficiaryName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.updatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h4 className="text-base sm:text-lg font-black text-slate-900 mb-4">
              Add Officer Account
            </h4>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUBRATA JANA"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Mobile Number (Phone / Login ID):</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="10 digit mobile"
                  value={newUser.mobile}
                  onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Designation & Role:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full bg-slate-50 text-slate-800 rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                >
                  <option value="SECRETARY">SECRETARY (Panchayat Secretary)</option>
                  <option value="GRS">GRS (Gram Rozgar Sahayak)</option>
                  <option value="VLE">VLE (Village Level Entrepreneur)</option>
                  <option value="SAHAYAK">SAHAYAK (Assistant)</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Email Address:</label>
                <input
                  type="email"
                  placeholder="staff@bathuarygp.gov.in"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 rounded-xl px-3 py-2 border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full shadow-md cursor-pointer transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
