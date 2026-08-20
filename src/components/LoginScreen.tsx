import React, { useState } from 'react';
import { 
  Cpu, 
  Key, 
  User as UserIcon, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { User, RoleType } from '../types';
import { StorageService } from '../services/storage';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [users] = useState<User[]>(StorageService.getUsers());
  const [employeeIdOrEmail, setEmployeeIdOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuickStaffList, setShowQuickStaffList] = useState<boolean>(true);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const input = employeeIdOrEmail.trim().toLowerCase();
    const matchedUser = users.find(u => 
      u.employeeId.toLowerCase() === input || 
      u.email.toLowerCase() === input
    );

    if (!matchedUser) {
      setErrorMessage('Invalid Employee ID or Email address. Please check your credentials.');
      return;
    }

    if (!matchedUser.active) {
      setErrorMessage('This staff account is currently inactive. Please contact an Administrator.');
      return;
    }

    // Successfully authenticate
    onLoginSuccess(matchedUser);
  };

  const handleQuickSelect = (user: User) => {
    onLoginSuccess(user);
  };

  const getRoleBadge = (role: RoleType) => {
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
    <div className="min-h-screen bg-[#173d26] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Subtle Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#368453]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#2d6e45]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#368453] to-[#205233] border border-[#4ca96f]/40 flex items-center justify-center text-white shadow-xl shadow-[#368453]/30 mb-4">
          <Cpu className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          IKIO EMS Plant Portal
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-emerald-200/80">
          Electronic Manufacturing Services & Production Line System
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div className="bg-[#122e1d] border border-[#27633e] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="border-b border-[#245938] pb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Staff Authentication Gate</span>
            </h2>
            <p className="text-[11px] text-emerald-300/70 mt-0.5">
              Enter your assigned Employee ID or email to access your role-specific console
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Employee ID or Email Address
              </label>
              <div className="relative">
                <input
                  id="input-login-staff-id"
                  type="text"
                  value={employeeIdOrEmail}
                  onChange={(e) => setEmployeeIdOrEmail(e.target.value)}
                  placeholder="e.g. IKIO-ADM-001 or admin@ikioems.com"
                  required
                  className="w-full bg-[#1b432a] border border-[#2d6d45] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#368453] focus:border-transparent placeholder:text-emerald-300/40"
                />
                <UserIcon className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex justify-between">
                <span>Security PIN / Password</span>
                <span className="text-[10px] text-emerald-300/60 font-normal">Demo: any value</span>
              </label>
              <div className="relative">
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  defaultValue="ikio2026"
                  className="w-full bg-[#1b432a] border border-[#2d6d45] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#368453] focus:border-transparent"
                />
                <Key className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              className="w-full py-3 rounded-xl bg-[#368453] hover:bg-[#3f9961] text-white font-bold text-xs shadow-lg shadow-[#368453]/25 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Sign In to Plant Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Staff Directory for Testing / Onboarding */}
          <div className="pt-2 border-t border-[#245938]">
            <button
              type="button"
              onClick={() => setShowQuickStaffList(!showQuickStaffList)}
              className="w-full flex items-center justify-between text-xs text-emerald-300/80 hover:text-white py-1 cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Pre-registered Demo Accounts ({users.length})</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold underline">
                {showQuickStaffList ? 'Hide List' : 'Show Accounts'}
              </span>
            </button>

            {showQuickStaffList && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-[#1b432a]/60 hover:bg-[#1b432a] border border-[#27633e] hover:border-[#368453] transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-[10px] ${u.avatarColor}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-emerald-300/60 font-mono">{u.employeeId}</div>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-emerald-300/70 space-y-1">
          <p>Protected by IKIO Electronics Role-Based Access Control</p>
          <p>Production Line Isolation: SMT • MI • MI-Finishing • FA-Lum • FA-Ref</p>
        </div>
      </div>

    </div>
  );
};
