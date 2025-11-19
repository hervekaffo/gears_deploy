import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

function safeName(profile, fallback) {
  if (!profile) return fallback;
  if (profile.name && profile.name.trim().length) return profile.name.trim();
  if (profile.displayName && profile.displayName.trim().length) {
    return profile.displayName.trim();
  }
  if (profile.email) return profile.email;
  return fallback;
}

async function fetchProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    if (__DEV__) {
      console.warn('fetchProfile failed', err?.code || err?.message || err);
    }
    return null;
  }
}

export async function ensureBookingThread({
  bookingId,
  vehicleTitle,
  hostId,
  renterId,
  createdBy,
  hostProfile,
  renterProfile,
}) {
  if (!bookingId || !hostId || !renterId) return;

  const threadRef = doc(db, 'threads', bookingId);
  const existing = await getDoc(threadRef);
  if (existing.exists()) return;

  const [hostData, renterData] = await Promise.all([
    hostProfile ? Promise.resolve(hostProfile) : fetchProfile(hostId),
    renterProfile ? Promise.resolve(renterProfile) : fetchProfile(renterId),
  ]);

  const threadName = vehicleTitle || 'Trip chat';

  const members = {
    [renterId]: {
      uid: renterId,
      role: 'renter',
      displayName: safeName(renterData, 'Guest'),
    },
    [hostId]: {
      uid: hostId,
      role: 'host',
      displayName: safeName(hostData, 'Host'),
    },
  };

  await setDoc(threadRef, {
    type: 'dm',
    name: threadName,
    createdAt: serverTimestamp(),
    createdBy: createdBy || renterId || hostId,
    members,
  });
}
