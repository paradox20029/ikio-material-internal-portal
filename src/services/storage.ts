import { 
  ProductionEntry, 
  User, 
  InventoryComponent, 
  LiveAlert, 
  MaterialShortageItem,
  ApprovalStatus 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_PRODUCTION_ENTRIES, 
  INITIAL_INVENTORY, 
  INITIAL_ALERTS 
} from '../data/initialData';
import { FirebaseService } from './firebase';

const STORAGE_KEYS = {
  USERS: 'ikio_ems_users_v1',
  PRODUCTION_ENTRIES: 'ikio_ems_production_entries_v1',
  INVENTORY: 'ikio_ems_inventory_v1',
  ALERTS: 'ikio_ems_alerts_v1',
  CURRENT_USER: 'ikio_ems_current_user_v1',
  SOUND_ENABLED: 'ikio_ems_sound_enabled_v1'
};

// Event emitter for cross-component and cross-tab real-time communication
type Listener = () => void;
const listeners: Set<Listener> = new Set();

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ikio_ems_channel')
  : null;

if (broadcastChannel) {
  broadcastChannel.onmessage = () => {
    listeners.forEach(fn => fn());
  };
}

export const subscribeToRealtimeUpdates = (callback: Listener) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const notifyStateChange = () => {
  listeners.forEach(fn => fn());
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    } catch {
      // Ignore broadcast errors
    }
  }
};

// Helper to enrich legacy/cached entries with Work Order and Role if missing
export const enrichProductionEntry = (entry: ProductionEntry): ProductionEntry => {
  let workOrder = entry.workOrderNumber;
  if (!workOrder) {
    if (entry.productCode?.includes('REFRIG') || entry.product?.includes('Refrigeration')) workOrder = 'WO-2026-REF-089';
    else if (entry.productCode?.includes('HB-150W') || entry.product?.includes('High-Bay')) workOrder = 'WO-2026-LUM-104';
    else if (entry.productCode?.includes('WAVE') || entry.product?.includes('Wave Solder')) workOrder = 'WO-2026-MIF-042';
    else if (entry.productCode?.includes('DRV') || entry.product?.includes('Driver')) workOrder = 'WO-2026-MI-310';
    else if (entry.productCode?.includes('BLE') || entry.product?.includes('Bluetooth')) workOrder = 'WO-2026-SMT-715';
    else if (entry.productCode?.includes('STR') || entry.product?.includes('Streetlight')) workOrder = 'WO-2026-SMT-714';
    else workOrder = `WO-2026-PRD-${entry.id ? entry.id.slice(-4).toUpperCase() : '101'}`;
  }

  let role = entry.enteredByRole;
  if (!role) {
    if (entry.enteredBy?.includes('ADM') || entry.enteredByName?.includes('Rajesh')) role = 'Administrator';
    else if (entry.enteredBy?.includes('SUP') || entry.enteredByName?.includes('Amit')) role = 'Production Supervisor';
    else if (entry.enteredByName?.includes('Suresh')) role = 'Store Manager';
    else role = 'Data Entry Staff';
  }

  return { ...entry, workOrderNumber: workOrder, enteredByRole: role };
};

// Setup Firestore real-time cloud sync
let firestoreInitialized = false;

export const initFirestoreSync = () => {
  if (firestoreInitialized || typeof window === 'undefined') return;
  firestoreInitialized = true;

  // Seed Firestore if empty
  FirebaseService.seedInitialDataIfEmpty().catch(console.warn);

  // 1. Subscribe to Production Entries from Firestore
  FirebaseService.subscribeProductionEntries((remoteEntries) => {
    const enriched = remoteEntries.map(enrichProductionEntry);
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(enriched));
    notifyStateChange();
  });

  // 2. Subscribe to Users from Firestore
  FirebaseService.subscribeUsers((remoteUsers) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remoteUsers));
    notifyStateChange();
  });

  // 3. Subscribe to Inventory from Firestore
  FirebaseService.subscribeInventory((remoteInventory) => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(remoteInventory));
    notifyStateChange();
  });

  // 4. Subscribe to Alerts from Firestore
  FirebaseService.subscribeAlerts((remoteAlerts) => {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(remoteAlerts));
    notifyStateChange();
  });
};

// Audio notification chime using Web Audio API
export const playNotificationChime = (type: 'info' | 'warning' | 'critical' | 'success' = 'info') => {
  try {
    const isSoundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
    if (!isSoundEnabled || typeof window === 'undefined') return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'critical') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.1);
      osc.frequency.setValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Graceful fallback
  }
};

export const StorageService = {
  // Users / Staff
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUser(user: Omit<User, 'id' | 'lastActive'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      lastActive: 'Just now'
    };
    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Save to Firebase Firestore in background
    FirebaseService.saveUser(user).catch(console.warn);

    this.addAlert({
      type: 'staff_added',
      title: 'New Staff Profile Created',
      message: `${newUser.name} (${newUser.employeeId}) assigned as ${newUser.role}.`,
      severity: 'info',
      meta: { userId: newUser.id }
    });

    notifyStateChange();
    return newUser;
  },

  updateUser(updatedUser: User): void {
    const users = this.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    FirebaseService.updateUser(updatedUser).catch(console.warn);
    notifyStateChange();
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    FirebaseService.deleteUser(userId).catch(console.warn);
    notifyStateChange();
  },

  // Active Authenticated User
  getCurrentUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    const defaultUser = this.getUsers()[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
    return defaultUser;
  },

  setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    notifyStateChange();
  },

  // Production Entries
  getProductionEntries(): ProductionEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTION_ENTRIES);
      if (!data) {
        const seeded = INITIAL_PRODUCTION_ENTRIES.map(enrichProductionEntry);
        localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(seeded));
        return seeded;
      }
      // Always enrich on read so Work Order + Role are present even for entries
      // cached locally before those fields existed (offline / Firestore down).
      return (JSON.parse(data) as ProductionEntry[]).map(enrichProductionEntry);
    } catch {
      return INITIAL_PRODUCTION_ENTRIES.map(enrichProductionEntry);
    }
  },

  addProductionEntry(entryData: Omit<ProductionEntry, 'id' | 'efficiencyPercent' | 'variance' | 'unitsPerManHour' | 'adminApprovalStatus'>): ProductionEntry {
    const entries = this.getProductionEntries();
    
    const efficiencyPercent = entryData.plan > 0 
      ? Number(((entryData.achieved / entryData.plan) * 100).toFixed(1))
      : 0;
    
    const variance = entryData.achieved - entryData.plan;
    
    const totalHours = entryData.totalWorkingHrs * entryData.manpowerUsed;
    const unitsPerManHour = totalHours > 0
      ? Number((entryData.achieved / totalHours).toFixed(2))
      : 0;

    const newEntry: ProductionEntry = enrichProductionEntry({
      ...entryData,
      id: `prod-rec-${Date.now()}`,
      efficiencyPercent,
      variance,
      unitsPerManHour,
      adminApprovalStatus: 'Pending Approval'
    });

    entries.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(entries));

    // Save to Firebase Firestore in real-time
    FirebaseService.addProductionEntry(entryData).catch(console.warn);

    notifyStateChange();
    return newEntry;
  },

  updateProductionEntry(updated: ProductionEntry): void {
    const entries = this.getProductionEntries().map(e => e.id === updated.id ? updated : e);
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(entries));
    FirebaseService.updateProductionEntry(updated).catch(console.warn);
    notifyStateChange();
  },

  approveProductionEntry(id: string, notes: string, adminName: string, status: ApprovalStatus = 'Approved'): void {
    const target = this.getProductionEntries().find(e => e.id === id);
    const entries = this.getProductionEntries().map(e => {
      if (e.id === id) {
        return {
          ...e,
          adminApprovalStatus: status,
          adminApprovalNotes: notes,
          adminApprovedBy: adminName,
          adminApprovedAt: new Date().toLocaleString(),
          status: status === 'Approved' ? ('Verified' as const) : ('Action Required' as const)
        };
      }
      return e;
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(entries));

    if (target) {
      FirebaseService.approveProductionEntry(id, target, notes, adminName, status).catch(console.warn);
    }

    notifyStateChange();
  },

  // Shortages across all runs
  getAllShortages(): { shortage: MaterialShortageItem; entry: ProductionEntry }[] {
    const entries = this.getProductionEntries();
    const list: { shortage: MaterialShortageItem; entry: ProductionEntry }[] = [];
    
    entries.forEach(entry => {
      entry.shortages.forEach(shortage => {
        list.push({ shortage, entry });
      });
    });
    return list;
  },

  updateShortageApproval(
    entryId: string, 
    shortageId: string, 
    status: ApprovalStatus, 
    remarks: string, 
    adminName: string
  ): void {
    const targetEntry = this.getProductionEntries().find(e => e.id === entryId);

    const entries = this.getProductionEntries().map(entry => {
      if (entry.id === entryId) {
        const updatedShortages = entry.shortages.map(sh => {
          if (sh.id === shortageId) {
            return {
              ...sh,
              status,
              adminRemarks: remarks,
              reviewedBy: adminName,
              reviewedAt: new Date().toLocaleString()
            };
          }
          return sh;
        });
        return { ...entry, shortages: updatedShortages };
      }
      return entry;
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(entries));

    if (targetEntry) {
      FirebaseService.updateShortageApproval(targetEntry, shortageId, status, remarks, adminName).catch(console.warn);
    }

    notifyStateChange();
  },

  // Inventory Stock
  getInventory(): InventoryComponent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
        return INITIAL_INVENTORY;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_INVENTORY;
    }
  },

  updateInventoryItem(updated: InventoryComponent): void {
    const items = this.getInventory().map(item => 
      item.partNumber === updated.partNumber ? updated : item
    );
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    FirebaseService.updateInventoryItem(updated).catch(console.warn);
    notifyStateChange();
  },

  // Alerts
  getAlerts(): LiveAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
        return INITIAL_ALERTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ALERTS;
    }
  },

  addAlert(alertData: Omit<LiveAlert, 'id' | 'timestamp' | 'read'>): LiveAlert {
    const alerts = this.getAlerts();
    const newAlert: LiveAlert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    alerts.unshift(newAlert);
    const trimmed = alerts.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(trimmed));
    FirebaseService.addAlert(alertData).catch(console.warn);
    return newAlert;
  },

  markAlertAsRead(id: string): void {
    const alerts = this.getAlerts().map(a => a.id === id ? { ...a, read: true } : a);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    FirebaseService.markAlertAsRead(id).catch(console.warn);
    notifyStateChange();
  },

  markAllAlertsAsRead(): void {
    const alerts = this.getAlerts().map(a => ({ ...a, read: true }));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    FirebaseService.markAllAlertsAsRead(this.getAlerts()).catch(console.warn);
    notifyStateChange();
  },

  // Sound preference
  isSoundEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== 'false';
  },

  setSoundEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  },

  // Reset demo data
  resetAllData(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_ENTRIES, JSON.stringify(INITIAL_PRODUCTION_ENTRIES));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    FirebaseService.seedInitialDataIfEmpty().catch(console.warn);
    notifyStateChange();
  }
};
