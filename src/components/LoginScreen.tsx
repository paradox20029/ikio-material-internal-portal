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
import { User } from '../types';
import { AuthService, AuthError } from '../services/auth';
import ikioLogo from '../ikio-logo.png';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [employeeIdOrEmail, setEmployeeIdOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const staff = await AuthService.signIn(employeeIdOrEmail, password);
      onLoginSuccess(staff);
    } catch (err) {
      setErrorMessage(
        err instanceof AuthError ? err.message : 'Sign-in failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const staff = await AuthService.signInWithGoogle();
      onLoginSuccess(staff);
    } catch (err) {
      setErrorMessage(
        err instanceof AuthError ? err.message : 'Google sign-in failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#173d26] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Subtle Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#368453]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#2d6e45]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <img
          src={ikioLogo}
          alt="IKIO — Innovations Only"
          className="mx-auto h-16 w-auto rounded-xl bg-white px-3 py-2 shadow-xl shadow-black/20 mb-5"
        />
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Internal Portal for Material Management
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-emerald-200/80">
          Material, Line Tracking &amp; Central Admin System
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
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#1b432a] border border-[#2d6d45] rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#368453] focus:border-transparent"
                />
                <Key className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#368453] hover:bg-[#3f9961] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-[#368453]/25 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Signing In…' : 'Sign In to Plant Console'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Google sign-in: staff accounts are Google Workspace / Gmail based */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#245938]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#122e1d] px-3 text-[10px] uppercase tracking-wider text-emerald-300/60 font-bold">
                or
              </span>
            </div>
          </div>

          <button
            id="btn-google-signin"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center space-x-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>{isSubmitting ? 'Signing In…' : 'Sign in with Google'}</span>
          </button>


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
