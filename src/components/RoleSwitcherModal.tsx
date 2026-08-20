import React, { useState } from 'react';
import { 
  Users, 
  Key, 
  Check, 
  X, 
  ShieldCheck, 
  Layers, 
  UserCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { User, RoleType } from '../types';
import { StorageService } from '../services/storage';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser
}) => {
  const [users] = useState<User[]>(StorageService.getUsers());
  const [activeTab, setActiveTab] = useState<'quick' | 'login'>('quick');

  // Custom login state
  const [employeeIdInput, setEmployeeIdInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const match = users.find(u => 
      u.employeeId.toUpperCase() === employeeIdInput.trim().toUpperCase() ||
      u.email.toLowerCase() === employeeIdInput.trim().toLowerCase()
    );

    if (match) {
      onSelectUser(match);
      onClose();
    } else {
      setLoginError('Invalid Employee ID or Email. Please check credentials or select a quick profile.');
    }
  };

  const getRoleBadgeStyle = (role: RoleType) => {
    switch (role) {
      case 'Administrator':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';
      case 'Production Supervisor':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'Store Manager':
        return 'bg-violet-950/80 text-violet-300 border-violet-700/60';
      case 'Quality Inspector':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      default:
        return 'bg-sky-950/80 text-sky-300 border-sky-700/60';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">IKIO EMS Authentication & Role Switcher</h3>
              <p className="text-[11px] text-slate-400">Switch profile to test Data Entry, Admin Oversight & Store flows</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'quick' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Role Profiles</span>
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'login' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Staff Credential Login</span>
          </button>
        </div>

        {/* Tab 1: 1-Click Profile Switcher */}
        {activeTab === 'quick' && (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-slate-800 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs ${user.avatarColor}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-100">{user.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({user.employeeId})</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {user.assignedLines === 'ALL' ? 'All Lines' : `Lines: ${Array.isArray(user.assignedLines) ? user.assignedLines.join(', ') : ''}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isCurrent ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-sky-400 bg-sky-950/60 px-2 py-1 rounded-lg border border-sky-800/60">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 group-hover:text-white flex items-center space-x-1">
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Credential Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleCustomLogin} className="space-y-4 pt-1">
            {loginError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Employee ID or Email
              </label>
              <input
                type="text"
                value={employeeIdInput}
                onChange={(e) => setEmployeeIdInput(e.target.value)}
                placeholder="e.g. IKIO-ADM-001 or IKIO-OP-201"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Portal Password / PIN
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                defaultValue="ikio2026"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default demo PIN: any value or default accepted</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow transition cursor-pointer"
            >
              Sign In to EMS Portal
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
