import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Users, 
  Clock, 
  ShieldCheck, 
  LogOut, 
  Layers,
  ChevronDown,
  RefreshCw,
  Cpu,
  Database
} from 'lucide-react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import ikioLogo from '../ikio-logo.png';

interface NavbarProps {
  currentUser: User;
  onOpenRoleSwitcher?: () => void;
  onOpenStaffManager: () => void;
  onToggleAlerts: () => void;
  onSignOut: () => void;
  unreadAlertCount: number;
  activeTab: 'entry' | 'dashboard' | 'logs' | 'shortages' | 'inventory';
  setActiveTab: (tab: 'entry' | 'dashboard' | 'logs' | 'shortages' | 'inventory') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenRoleSwitcher,
  onOpenStaffManager,
  onToggleAlerts,
  onSignOut,
  unreadAlertCount,
  activeTab,
  setActiveTab
}) => {
  const [time, setTime] = useState<string>('');
  const [currentShift, setCurrentShift] = useState<string>('Shift 1');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(StorageService.isSoundEnabled());
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const hour = now.getHours();
      if (hour >= 6 && hour < 14) {
        setCurrentShift('Shift 1 (06:00 - 14:00)');
      } else if (hour >= 14 && hour < 22) {
        setCurrentShift('Shift 2 (14:00 - 22:00)');
      } else {
        setCurrentShift('Shift 3 / Night (22:00 - 06:00)');
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    StorageService.setSoundEnabled(next);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50';
      case 'Production Supervisor':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      case 'Store Manager':
        return 'bg-violet-900/40 text-violet-300 border-violet-700/50';
      case 'Quality Inspector':
        return 'bg-rose-900/40 text-rose-300 border-rose-700/50';
      default:
        return 'bg-sky-900/40 text-sky-300 border-sky-700/50';
    }
  };

  return (
    <header className="bg-surface-sunken border-b border-line-subtle text-content sticky top-0 z-40 shadow-xl">
      {/* Top Banner Line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Plant Info */}
          <div className="flex items-center space-x-3">
            {/* Imported rather than referenced as /ikio-logo.png: the file lives in
                src/, not public/, so Vite must fingerprint and emit it. The wordmark
                already contains the IKIO lettering, hence no separate text label, and
                its black type needs a light tile to read against the dark navbar. */}
            <img
              src={ikioLogo}
              alt="IKIO — Innovations Only"
              className="h-10 w-auto rounded-lg bg-white px-2 py-1 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent/30 text-emerald-300 border border-accent/60 tracking-wider">
                  MATERIAL MANAGEMENT PORTAL
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/70 font-medium hidden sm:block">
                Internal Portal for Material Management
              </p>
            </div>
          </div>

          {/* Center: Live Plant Time, Shift Info & Cloud Database Status */}
          <div className="hidden md:flex items-center space-x-3.5 bg-surface px-4 py-1.5 rounded-full border border-line-strong text-xs">
            <div className="flex items-center space-x-1.5 text-content-soft">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-mono font-semibold text-content">{time}</span>
            </div>
            <span className="text-emerald-700">|</span>
            <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{currentShift}</span>
            </div>
            <span className="text-emerald-700">|</span>
            <div className="flex items-center space-x-1 text-emerald-300 font-medium text-[11px]" title="Connected to Google Cloud Firebase Firestore">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firestore Sync</span>
            </div>
          </div>

          {/* Right Controls: Sound, Alerts, User Profile */}
          <div className="flex items-center space-x-3">
            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              title={soundEnabled ? 'Live Audio Chime Enabled' : 'Live Audio Chime Muted'}
              className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                soundEnabled 
                  ? 'bg-surface text-emerald-300 border-line-strong hover:bg-surface-raised' 
                  : 'bg-surface-sunken text-emerald-700 border-ikio-750 hover:text-emerald-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Real-time Alerts Bell */}
            <button
              id="btn-navbar-alerts"
              onClick={onToggleAlerts}
              className="relative p-2 rounded-xl bg-surface text-content-soft border border-line-strong hover:bg-surface-raised hover:text-white transition-colors cursor-pointer"
              title="Real-time alerts & live events"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-bounce shadow-sm">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Admin Staff Management Quick Button (if admin) */}
            {currentUser.role === 'Administrator' && (
              <button
                id="btn-nav-manage-staff"
                onClick={onOpenStaffManager}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-ikio-600 text-emerald-100 border border-accent-hover hover:bg-ikio-550 text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage Staff & Roles</span>
              </button>
            )}

            {/* User Profile / Role Dropdown */}
            <div className="relative">
              <button
                id="btn-user-dropdown"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-xl bg-surface border border-line-strong hover:border-accent transition cursor-pointer"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${currentUser.avatarColor}`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-content leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-300/70 leading-none">
                    {currentUser.employeeId}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-sunken border border-line shadow-2xl py-2 z-50 text-xs"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-4 py-2 border-b border-line-subtle">
                    <div className="font-semibold text-content">{currentUser.name}</div>
                    <div className="text-emerald-300/70 text-[11px]">{currentUser.email}</div>
                    <div className="mt-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeColor(currentUser.role)}`}>
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {currentUser.role === 'Administrator' && (
                      <button
                        id="btn-staff-manager-option"
                        onClick={onOpenStaffManager}
                        className="w-full text-left px-4 py-2 text-content-soft hover:bg-surface hover:text-white flex items-center space-x-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Staff Directory & Access Control</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-line-subtle pt-1">
                    <button
                      id="btn-reset-demo-data"
                      onClick={() => {
                        if (confirm('Reset system data to initial IKIO EMS defaults?')) {
                          StorageService.resetAllData();
                        }
                      }}
                      className="w-full text-left px-4 py-1.5 text-emerald-300/60 hover:bg-surface hover:text-emerald-200 text-[11px] cursor-pointer"
                    >
                      Reset Demo Data
                    </button>
                    <button
                      id="btn-signout"
                      onClick={onSignOut}
                      className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out from Console</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none border-t border-ikio-700">
          
          {/* Tab 1: Input Screen (Data Entry) */}
          <button
            id="tab-data-entry"
            onClick={() => setActiveTab('entry')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'entry'
                ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent-bright'
                : 'text-emerald-100/80 hover:bg-surface hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Material & Line Entry</span>
          </button>

          {/* Tab 2: Admin Dashboard */}
          <button
            id="tab-admin-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-surface-active text-white shadow-md border border-accent-bright'
                : 'text-emerald-100/80 hover:bg-surface hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Center & Approvals</span>
          </button>

          {/* Tab 3: Production Log Sheet */}
          <button
            id="tab-production-logs"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-surface-active text-white shadow-sm border border-accent-bright'
                : 'text-emerald-100/80 hover:bg-surface hover:text-white'
            }`}
          >
            <span>Production Matrix & Logs</span>
          </button>

          {/* Tab 4: Shortages & Requisitions */}
          <button
            id="tab-shortages"
            onClick={() => setActiveTab('shortages')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'shortages'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-emerald-100/80 hover:bg-surface hover:text-white'
            }`}
          >
            <span>Material Shortages & Store</span>
          </button>

          {/* Tab 5: Inventory Stock */}
          <button
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent-bright'
                : 'text-emerald-100/80 hover:bg-surface hover:text-white'
            }`}
          >
            <span>BOM Inventory Balance</span>
          </button>

        </div>
      </div>
    </header>
  );
};
