import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  User, 
  ProductionEntry, 
  InventoryComponent, 
  LiveAlert, 
  ApprovalStatus,
  WorkOrder
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_PRODUCTION_ENTRIES, 
  INITIAL_INVENTORY, 
  INITIAL_ALERTS,
  INITIAL_WORK_ORDERS
} from '../data/initialData';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId and resilient settings
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true
  }, databaseId);
} catch {
  try {
    firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } catch (e) {
    console.warn('Firestore fallback init:', e);
  }
}

export const db = firestoreInstance;

// Firebase Authentication instance (Email/Password provider)
export const auth = getAuth(app);

// Collection References
const USERS_COLLECTION = 'users';
const PRODUCTION_COLLECTION = 'production_entries';
const INVENTORY_COLLECTION = 'inventory';
const ALERTS_COLLECTION = 'alerts';
const WORK_ORDERS_COLLECTION = 'work_orders';

// Audio chime helper
const playChime = (type: 'info' | 'warning' | 'critical' | 'success' = 'info') => {
  try {
    if (typeof window === 'undefined') return;
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
    // ignore audio failure
  }
};

export const FirebaseService = {
  // Seed initial data if Firestore collections are empty
  async seedInitialDataIfEmpty() {
    try {
      const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
      if (usersSnap.empty) {
        console.log('Seeding initial users to Firestore...');
        const batch = writeBatch(db);
        INITIAL_USERS.forEach(u => {
          batch.set(doc(db, USERS_COLLECTION, u.id), u);
        });
        await batch.commit();
      }

      const prodSnap = await getDocs(collection(db, PRODUCTION_COLLECTION));
      if (prodSnap.empty) {
        console.log('Seeding initial production runs to Firestore...');
        const batch = writeBatch(db);
        INITIAL_PRODUCTION_ENTRIES.forEach(entry => {
          batch.set(doc(db, PRODUCTION_COLLECTION, entry.id), entry);
        });
        await batch.commit();
      }

      const invSnap = await getDocs(collection(db, INVENTORY_COLLECTION));
      if (invSnap.empty) {
        console.log('Seeding initial inventory to Firestore...');
        const batch = writeBatch(db);
        INITIAL_INVENTORY.forEach(item => {
          batch.set(doc(db, INVENTORY_COLLECTION, item.partNumber), item);
        });
        await batch.commit();
      }

      const alertsSnap = await getDocs(collection(db, ALERTS_COLLECTION));
      if (alertsSnap.empty) {
        console.log('Seeding initial alerts to Firestore...');
        const batch = writeBatch(db);
        INITIAL_ALERTS.forEach(a => {
          batch.set(doc(db, ALERTS_COLLECTION, a.id), a);
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore seed check/commit error:', err);
    }
  },

  // Real-time Subscriptions
  subscribeUsers(onUpdate: (users: User[]) => void) {
    const q = collection(db, USERS_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const users = snapshot.docs.map(d => d.data() as User);
        onUpdate(users);
      } else {
        onUpdate(INITIAL_USERS);
      }
    }, (err) => {
      console.warn('Users Firestore listener error:', err);
    });
  },

  subscribeProductionEntries(onUpdate: (entries: ProductionEntry[]) => void) {
    const q = collection(db, PRODUCTION_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const entries = snapshot.docs.map(d => d.data() as ProductionEntry);
        // sort by date desc or enteredAt desc
        entries.sort((a, b) => new Date(b.enteredAt || b.date).getTime() - new Date(a.enteredAt || a.date).getTime());
        onUpdate(entries);
      } else {
        onUpdate(INITIAL_PRODUCTION_ENTRIES);
      }
    }, (err) => {
      console.warn('Production Firestore listener error:', err);
    });
  },

  subscribeWorkOrders(onUpdate: (orders: WorkOrder[]) => void) {
    const q = collection(db, WORK_ORDERS_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        onUpdate(snapshot.docs.map(d => d.data() as WorkOrder));
      } else {
        onUpdate(INITIAL_WORK_ORDERS);
      }
    }, (err) => {
      console.warn('Work Orders Firestore listener error:', err);
    });
  },

  subscribeInventory(onUpdate: (inventory: InventoryComponent[]) => void) {
    const q = collection(db, INVENTORY_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(d => d.data() as InventoryComponent);
        onUpdate(items);
      } else {
        onUpdate(INITIAL_INVENTORY);
      }
    }, (err) => {
      console.warn('Inventory Firestore listener error:', err);
    });
  },

  subscribeAlerts(onUpdate: (alerts: LiveAlert[]) => void) {
    const q = collection(db, ALERTS_COLLECTION);
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const alerts = snapshot.docs.map(d => d.data() as LiveAlert);
        onUpdate(alerts);
      } else {
        onUpdate(INITIAL_ALERTS);
      }
    }, (err) => {
      console.warn('Alerts Firestore listener error:', err);
    });
  },

  // USERS
  async saveUser(user: Omit<User, 'id' | 'lastActive'>): Promise<User> {
    const id = `usr-${Date.now()}`;
    const newUser: User = {
      ...user,
      id,
      lastActive: 'Just now'
    };
    await setDoc(doc(db, USERS_COLLECTION, id), newUser);

    await this.addAlert({
      type: 'staff_added',
      title: 'New Staff Profile Created',
      message: `${newUser.name} (${newUser.employeeId}) registered as ${newUser.role}.`,
      severity: 'info',
      meta: { userId: newUser.id }
    });

    return newUser;
  },

  async updateUser(user: User): Promise<void> {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
  },

  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  },

  // PRODUCTION ENTRIES
  async addProductionEntry(entryData: Omit<ProductionEntry, 'id' | 'efficiencyPercent' | 'variance' | 'unitsPerManHour' | 'adminApprovalStatus'>): Promise<ProductionEntry> {
    const efficiencyPercent = entryData.plan > 0 
      ? Number(((entryData.achieved / entryData.plan) * 100).toFixed(1))
      : 0;
    
    const variance = entryData.achieved - entryData.plan;
    const totalHours = entryData.totalWorkingHrs * entryData.manpowerUsed;
    const unitsPerManHour = totalHours > 0
      ? Number((entryData.achieved / totalHours).toFixed(2))
      : 0;

    const id = `prod-rec-${Date.now()}`;
    const newEntry: ProductionEntry = {
      ...entryData,
      id,
      efficiencyPercent,
      variance,
      unitsPerManHour,
      adminApprovalStatus: 'Pending Approval'
    };

    await setDoc(doc(db, PRODUCTION_COLLECTION, id), newEntry);

    const hasCriticalShortage = newEntry.shortages.some(s => s.severity.includes('Critical'));
    if (newEntry.shortages.length > 0) {
      await this.addAlert({
        type: hasCriticalShortage ? 'line_stop_warning' : 'shortage_reported',
        title: hasCriticalShortage ? '⚠️ CRITICAL LINE SHORTAGE REPORTED' : 'Material Shortage Logged',
        message: `${newEntry.enteredByName} reported ${newEntry.shortages.length} shortage item(s) on ${newEntry.productionLine} - ${newEntry.subLine} (${newEntry.product}).`,
        line: newEntry.productionLine,
        subLine: newEntry.subLine,
        severity: hasCriticalShortage ? 'critical' : 'warning',
        meta: { entryId: newEntry.id }
      });
      playChime(hasCriticalShortage ? 'critical' : 'warning');
    } else {
      await this.addAlert({
        type: 'production_entry',
        title: 'New Production Run Logged',
        message: `${newEntry.enteredByName} submitted ${newEntry.productionLine} (${newEntry.subLine}) run: ${newEntry.achieved} / ${newEntry.plan} units (${efficiencyPercent}% Eff).`,
        line: newEntry.productionLine,
        subLine: newEntry.subLine,
        severity: 'info',
        meta: { entryId: newEntry.id }
      });
      playChime('info');
    }

    return newEntry;
  },

  async updateProductionEntry(entry: ProductionEntry): Promise<void> {
    await setDoc(doc(db, PRODUCTION_COLLECTION, entry.id), entry, { merge: true });
  },

  async approveProductionEntry(id: string, entry: ProductionEntry, notes: string, adminName: string, status: ApprovalStatus = 'Approved'): Promise<void> {
    const updated: ProductionEntry = {
      ...entry,
      adminApprovalStatus: status,
      adminApprovalNotes: notes,
      adminApprovedBy: adminName,
      adminApprovedAt: new Date().toLocaleString(),
      status: status === 'Approved' ? ('Verified' as const) : ('Action Required' as const)
    };
    await setDoc(doc(db, PRODUCTION_COLLECTION, id), updated, { merge: true });

    await this.addAlert({
      type: 'approval_action',
      title: `Production Entry ${status}`,
      message: `Admin ${adminName} updated approval status to "${status}" with remarks: "${notes || 'No remarks'}".`,
      severity: status === 'Approved' ? 'success' : 'warning',
      meta: { entryId: id }
    });
    playChime(status === 'Approved' ? 'success' : 'warning');
  },

  async updateShortageApproval(
    entry: ProductionEntry,
    shortageId: string, 
    status: ApprovalStatus, 
    remarks: string, 
    adminName: string
  ): Promise<void> {
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

    const updatedEntry: ProductionEntry = { ...entry, shortages: updatedShortages };
    await setDoc(doc(db, PRODUCTION_COLLECTION, entry.id), updatedEntry, { merge: true });

    await this.addAlert({
      type: 'approval_action',
      title: `Material Shortage Request ${status}`,
      message: `Admin ${adminName} set shortage status to "${status}": "${remarks}".`,
      severity: status === 'Approved' ? 'success' : 'warning',
      meta: { entryId: entry.id, shortageId }
    });
    playChime(status === 'Approved' ? 'success' : 'warning');
  },

  // INVENTORY
  async updateInventoryItem(item: InventoryComponent): Promise<void> {
    await setDoc(doc(db, INVENTORY_COLLECTION, item.partNumber), item, { merge: true });
  },

  // ALERTS
  async addAlert(alertData: Omit<LiveAlert, 'id' | 'timestamp' | 'read'>): Promise<LiveAlert> {
    const id = `alt-${Date.now()}`;
    const newAlert: LiveAlert = {
      ...alertData,
      id,
      timestamp: 'Just now',
      read: false
    };
    await setDoc(doc(db, ALERTS_COLLECTION, id), newAlert);
    return newAlert;
  },

  async markAlertAsRead(alertId: string): Promise<void> {
    await setDoc(doc(db, ALERTS_COLLECTION, alertId), { read: true }, { merge: true });
  },

  async markAllAlertsAsRead(alerts: LiveAlert[]): Promise<void> {
    const batch = writeBatch(db);
    alerts.forEach(a => {
      batch.update(doc(db, ALERTS_COLLECTION, a.id), { read: true });
    });
    await batch.commit();
  }
};
