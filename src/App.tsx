import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  ProductionEntry, 
  LiveAlert 
} from './types';
import { 
  StorageService, 
  subscribeToRealtimeUpdates,
  initFirestoreSync 
} from './services/storage';
import { AuthService } from './services/auth';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { ProductionDataEntry } from './components/ProductionDataEntry';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductionDataTable } from './components/ProductionDataTable';
import { MaterialShortageHub } from './components/MaterialShortageHub';
import { StaffManagementModal } from './components/StaffManagementModal';
import { RealTimeAlertsDrawer } from './components/RealTimeAlertsDrawer';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Users, 
  Zap, 
  ArrowRight,
  Radio,
  Lock
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Firebase restores an existing session asynchronously. Until it reports back
  // we cannot distinguish "signed out" from "not checked yet", and rendering the
  // login screen in that gap would sign out every returning user on refresh.
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>(() => StorageService.getProductionEntries());
  const [alerts, setAlerts] = useState<LiveAlert[]>(() => StorageService.getAlerts());
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'entry' | 'dashboard' | 'logs' | 'shortages' | 'inventory'>('entry');
  
  // Modals & Drawers
  const [isStaffManagerOpen, setIsStaffManagerOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);

  // Live Toast Notification
  const [latestToast, setLatestToast] = useState<LiveAlert | null>(null);

  // Refresh all state from StorageService
  const refreshAppData = useCallback(() => {
    setProductionEntries(StorageService.getProductionEntries());
    const currentAlerts = StorageService.getAlerts();
    setAlerts(currentAlerts);

    // Update current user if modified
    const currentStoredUser = StorageService.getCurrentUser();
    setCurrentUser(currentStoredUser);

    // Show toast for newest unread alert
    if (currentAlerts.length > 0 && !currentAlerts[0].read) {
      setLatestToast(currentAlerts[0]);
    }
  }, []);

  // Initialize Firebase Firestore sync on mount
  useEffect(() => {
    initFirestoreSync();
  }, []);

  // Firebase Auth is the single source of truth for who is signed in.
  useEffect(() => {
    const unsubscribe = AuthService.subscribe((staff) => {
      if (staff) {
        StorageService.setCurrentUser(staff);
        setCurrentUser(staff);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to real-time broadcast and storage events
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeUpdates(() => {
      refreshAppData();
    });
    return () => unsubscribe();
  }, [refreshAppData]);

  // Handle User Login
  const handleLogin = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    if (user.role === 'Administrator') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('entry');
    }
  };

  // Handle Sign Out
  const handleSignOut = () => {
    // The auth subscription flips isAuthenticated once Firebase confirms;
    // clear it here too so the UI does not linger if the network is slow.
    AuthService.signOut().catch(console.warn);
    setIsAuthenticated(false);
  };


  const unreadAlertCount = alerts.filter(a => !a.read).length;

  // Wait for Firebase to restore any existing session before deciding.
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#173d26] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#368453] to-[#205233] border border-[#4ca96f]/40 flex items-center justify-center animate-pulse">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <p className="text-xs text-emerald-200/80 font-medium">Verifying your session…</p>
      </div>
    );
  }

  // Render Login Gate if unauthenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#1b432a] text-slate-100 font-sans antialiased selection:bg-[#368453] selection:text-white flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenStaffManager={() => setIsStaffManagerOpen(true)}
        onToggleAlerts={() => setIsAlertsDrawerOpen(true)}
        onSignOut={handleSignOut}
        unreadAlertCount={unreadAlertCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Real-time Toast Notification Banner */}
      {latestToast && (
        <div className="bg-[#143320] border-b border-[#368453]/60 px-4 py-2.5 flex items-center justify-between text-xs shadow-md animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#368453]"></span>
              </span>
              <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">Real-Time Update:</span>
              <span className="text-slate-100 font-medium">{latestToast.title} — {latestToast.message}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setLatestToast(null);
                }}
                className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline"
              >
                View in Dashboard
              </button>
              <button
                onClick={() => setLatestToast(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'entry' && (
          <ProductionDataEntry
            currentUser={currentUser}
            onEntrySuccess={refreshAppData}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <AdminDashboard
            currentUser={currentUser}
            productionEntries={productionEntries}
            onOpenStaffManager={() => setIsStaffManagerOpen(true)}
            onNavigateToEntry={() => setActiveTab('entry')}
          />
        )}

        {activeTab === 'logs' && (
          <ProductionDataTable
            entries={productionEntries}
          />
        )}

        {(activeTab === 'shortages' || activeTab === 'inventory') && (
          <MaterialShortageHub
            currentUser={currentUser}
            productionEntries={productionEntries}
          />
        )}
      </main>

      {/* Staff Management Modal (Admin Only) */}
      <StaffManagementModal
        isOpen={isStaffManagerOpen}
        onClose={() => setIsStaffManagerOpen(false)}
        currentUser={currentUser}
      />

      {/* Real-time Alerts Drawer */}
      <RealTimeAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onAlertClick={() => {
          setIsAlertsDrawerOpen(false);
          setActiveTab('dashboard');
        }}
      />

      {/* Signed-in role indicator (read-only: identity now comes from Firebase Auth) */}
      <div className="fixed bottom-4 right-4 z-30">
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-semibold shadow-2xl backdrop-blur-md">
          <div className={`w-2.5 h-2.5 rounded-full ${currentUser.role === 'Administrator' ? 'bg-indigo-400' : 'bg-sky-400'}`} />
          <span>Role: <strong className="text-white">{currentUser.role}</strong></span>
          <span className="text-[10px] text-slate-400">{currentUser.employeeId}</span>
        </div>
      </div>

    </div>
  );
}
