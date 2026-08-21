import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from '../types';
import { StorageService } from './storage';
import { INITIAL_USERS } from '../data/initialData';

/**
 * Staff sign-in is Firebase Email/Password auth, layered over the existing
 * staff directory: Firebase proves *who* you are, the `users` collection
 * says what your role and employee record are. The two are joined on email.
 *
 * A Firebase account with no matching staff record cannot use the app.
 */

export class AuthError extends Error {}

/**
 * The staff directory to authenticate against.
 *
 * StorageService.getUsers() reads localStorage, which the Firestore listener
 * overwrites with whatever the `users` collection holds. Staff added in code
 * but not yet present in Firestore would therefore vanish from that list and
 * be unable to sign in at all. Merging the compiled-in roster back over the
 * top keeps them resolvable, with the stored record winning when both exist
 * so live edits (role changes, deactivations) still take effect.
 */
const staffDirectory = (): User[] => {
  const stored = StorageService.getUsers();
  const seen = new Set(stored.map(u => u.email.toLowerCase()));
  return [...stored, ...INITIAL_USERS.filter(u => !seen.has(u.email.toLowerCase()))];
};

// Staff may type either an Employee ID or an email; Firebase only knows emails.
export const resolveEmail = (employeeIdOrEmail: string): string | null => {
  const input = employeeIdOrEmail.trim().toLowerCase();
  if (!input) return null;
  if (input.includes('@')) return input;

  const match = staffDirectory().find(u => u.employeeId.toLowerCase() === input);
  return match ? match.email.toLowerCase() : null;
};

export const findStaffProfile = (email: string | null): User | null => {
  if (!email) return null;
  const target = email.toLowerCase();
  return staffDirectory().find(u => u.email.toLowerCase() === target) ?? null;
};

// Firebase error codes are not presentable; map the ones staff will actually hit.
const describeAuthError = (code: string): string => {
  switch (code) {
    case 'auth/invalid-email':
      return 'That is not a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact an Administrator.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect Employee ID / email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Cannot reach the authentication server. Check your connection.';
    case 'auth/operation-not-allowed':
      return 'That sign-in method is not enabled on this Firebase project.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups and retry.';
    default:
      return 'Sign-in failed. Please try again or contact an Administrator.';
  }
};

export const AuthService = {
  /**
   * Signs in and returns the matching staff profile. Any failure after the
   * Firebase credential check signs back out, so we never leave a session
   * open for someone the app cannot place in the staff directory.
   */
  async signIn(employeeIdOrEmail: string, password: string): Promise<User> {
    const email = resolveEmail(employeeIdOrEmail);
    if (!email) {
      throw new AuthError('No staff account found for that Employee ID.');
    }

    let credentialEmail: string | null;
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      credentialEmail = credential.user.email;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      throw new AuthError(describeAuthError(code));
    }

    const profile = findStaffProfile(credentialEmail);
    if (!profile) {
      await firebaseSignOut(auth);
      throw new AuthError('This login is not linked to a staff record. Contact an Administrator.');
    }

    if (profile.status !== 'Active') {
      await firebaseSignOut(auth);
      throw new AuthError('This staff account is currently inactive. Contact an Administrator.');
    }

    return profile;
  },

  /**
   * Google sign-in. Any Google account can authenticate against the project,
   * so the staff-directory check below is what actually limits access — and it
   * is mirrored in firestore.rules, which is the boundary that counts.
   */
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let credentialEmail: string | null;
    try {
      const credential = await signInWithPopup(auth, provider);
      credentialEmail = credential.user.email;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      throw new AuthError(describeAuthError(code));
    }

    const profile = findStaffProfile(credentialEmail);
    if (!profile) {
      await firebaseSignOut(auth);
      throw new AuthError(
        `${credentialEmail ?? 'That account'} is not registered as IKIO staff.`
      );
    }

    if (profile.status !== 'Active') {
      await firebaseSignOut(auth);
      throw new AuthError('This staff account is currently inactive. Contact an Administrator.');
    }

    return profile;
  },

  signOut(): Promise<void> {
    return firebaseSignOut(auth);
  },

  /**
   * Fires once on load with the restored session (or null), then on every
   * sign-in/sign-out. The initial call is what tells the app it is safe to
   * stop showing the loading gate.
   */
  subscribe(callback: (staff: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      const profile = findStaffProfile(firebaseUser.email);
      callback(profile && profile.status === 'Active' ? profile : null);
    });
  }
};
