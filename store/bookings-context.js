import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from './auth-context';
import { ensureBookingThread } from '../util/messaging';

export const BookingsContext = createContext({
  myBookings: [],
  hostBookings: [],
  requestBooking: async () => {},
  editBooking: async () => {},
  approveBooking: async () => {},
  declineBooking: async () => {},
  markCompleted: async () => {},
  cancelBooking: async () => {},
  refreshVehicleBookings: async () => {},
});

const BOOKING_STATUSES = ['requested', 'approved', 'active', 'completed', 'canceled'];

function nightsBetween(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff));
}

export function BookingsContextProvider({ children }) {
  const { user, profile } = useContext(AuthContext);
  const [myBookings, setMyBookings] = useState([]);
  const [hostBookings, setHostBookings] = useState([]);

  useEffect(() => {
    if (!user) {
      setMyBookings([]);
      setHostBookings([]);
      return;
    }

    const renterQuery = query(
      collection(db, 'bookings'),
      where('renterId', '==', user.uid)
    );
    const hostQuery = query(
      collection(db, 'bookings'),
      where('hostId', '==', user.uid)
    );

    const unsubRenter = onSnapshot(renterQuery, snap => {
      setMyBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubHost = onSnapshot(hostQuery, snap => {
      setHostBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubRenter();
      unsubHost();
    };
  }, [user]);

  const hasConflict = useCallback(async (vehicleId, startISO, endISO, excludeBookingId) => {
    try {
      const qPending = query(
        collection(db, 'bookings'),
        where('vehicleId', '==', vehicleId),
        where('status', 'in', ['requested', 'approved', 'active'])
      );
      const snap = await getDocs(qPending);
      const requestedStart = new Date(startISO);
      const requestedEnd = new Date(endISO);

      return snap.docs.some(docSnap => {
        if (excludeBookingId && docSnap.id === excludeBookingId) return false;
        const data = docSnap.data();
        const existingStart = data.start ? new Date(data.start) : null;
        const existingEnd = data.end ? new Date(data.end) : null;
        if (!existingStart || !existingEnd) return false;
        return requestedStart < existingEnd && requestedEnd > existingStart;
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('Booking conflict check skipped:', err?.code || err?.message || err);
      }
      return false;
    }
  }, []);

  const requestBooking = useCallback(
    async ({
      vehicleId,
      vehicleTitle,
      vehicleImage,
      hostId,
      renterId,
      start,
      end,
      status = 'requested',
      paymentStatus = 'unpaid',
      nightlyRate,
      nights,
      quotedTotal,
      simulated = false,
      guests,
      note,
      payment,
    }) => {
      if (!renterId) throw new Error('Must be signed in to request a booking.');
      if (!vehicleId) throw new Error('Vehicle id missing.');

      const startISO =
        typeof start === 'string' ? start : new Date(start).toISOString();
      const endISO =
        typeof end === 'string' ? end : new Date(end).toISOString();

      if (await hasConflict(vehicleId, startISO, endISO)) {
        throw new Error('This vehicle is already reserved for those dates.');
      }

      const nightly =
        typeof nightlyRate === 'number'
          ? nightlyRate
          : 0;
      const nightsCount =
        typeof nights === 'number'
          ? nights
          : nightsBetween(startISO, endISO);
      const total =
        typeof quotedTotal === 'number' ? quotedTotal : nightly * nightsCount;

      const normalizedGuests = typeof guests === 'number' ? guests : parseInt(guests, 10) || 1;
      const sanitizedNote =
        typeof note === 'string' && note.trim().length ? note.trim() : null;

      const docData = {
        vehicleId: String(vehicleId),
        renterId,
        start: startISO,
        end: endISO,
        status,
        paymentStatus,
        nightlyRate: nightly,
        nights: nightsCount,
        quotedTotal: total,
        createdAt: serverTimestamp(),
        simulated: Boolean(simulated),
        guests: normalizedGuests,
        note: sanitizedNote,
      };

      if (vehicleTitle !== undefined) {
        docData.vehicleTitle =
          vehicleTitle === null
            ? null
            : String(vehicleTitle);
      }
      if (vehicleImage !== undefined) {
        docData.vehicleImage =
          vehicleImage === null
            ? null
            : String(vehicleImage);
      }
      if (hostId) {
        docData.hostId = String(hostId);
      }
      if (payment) {
        docData.payment = {
          status: String(payment.status || 'simulated_paid'),
          processedAt: payment.processedAt || serverTimestamp(),
        };
      }

      if (!docData.vehicleTitle) {
        delete docData.vehicleTitle;
      }
      if (!docData.vehicleImage) {
        delete docData.vehicleImage;
      }

      const bookingRef = await addDoc(collection(db, 'bookings'), docData);

      await ensureBookingThread({
        bookingId: bookingRef.id,
        vehicleTitle,
        hostId,
        renterId,
        createdBy: renterId,
        renterProfile: profile,
      });
    },
    [hasConflict]
  );

  const editBooking = useCallback(
    async ({
      id,
      vehicleId,
      start,
      end,
      nightlyRate,
      nights,
      quotedTotal,
      guests,
      note,
    }) => {
      if (!id) throw new Error('Booking id is required to edit.');
      if (!vehicleId) throw new Error('Vehicle id is required to edit booking.');

      const startISO =
        typeof start === 'string' ? start : new Date(start).toISOString();
      const endISO =
        typeof end === 'string' ? end : new Date(end).toISOString();

      if (await hasConflict(vehicleId, startISO, endISO, id)) {
        throw new Error('These dates overlap with another reservation.');
      }

      const nightly =
        typeof nightlyRate === 'number' ? nightlyRate : 0;
      const nightsCount =
        typeof nights === 'number'
          ? nights
          : nightsBetween(startISO, endISO);
      const total =
        typeof quotedTotal === 'number' ? quotedTotal : nightly * nightsCount;

      const normalizedGuests = typeof guests === 'number' ? guests : parseInt(guests, 10) || 1;
      const sanitizedNote =
        typeof note === 'string' && note.trim().length ? note.trim() : null;

      await updateDoc(doc(db, 'bookings', id), {
        start: startISO,
        end: endISO,
        nightlyRate: nightly,
        nights: nightsCount,
        quotedTotal: total,
        status: 'requested',
        guests: normalizedGuests,
        note: sanitizedNote,
      });
    },
    [hasConflict]
  );

  const updateBooking = useCallback(async (id, payload) => {
    await updateDoc(doc(db, 'bookings', id), payload);
  }, []);

  const approveBooking = useCallback(async (id) => {
    await updateBooking(id, {
      status: 'approved',
      paymentStatus: 'simulated_paid',
      payment: {
        status: 'simulated_paid',
        processedAt: serverTimestamp(),
      },
    });
  }, [updateBooking]);

  const declineBooking = useCallback(async (id) => {
    await updateBooking(id, {
      status: 'canceled',
      paymentStatus: 'void',
    });
  }, [updateBooking]);

  const markCompleted = useCallback(async (id) => {
    await updateBooking(id, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
  }, [updateBooking]);

  const cancelBooking = useCallback(async (id) => {
    await updateBooking(id, {
      status: 'canceled',
      paymentStatus: 'void',
      canceledAt: serverTimestamp(),
    });
  }, [updateBooking]);

  const value = useMemo(() => ({
    myBookings,
    hostBookings,
    requestBooking,
    editBooking,
    approveBooking,
    declineBooking,
    markCompleted,
    cancelBooking,
    refreshVehicleBookings: () => {}, // placeholder for future use
    statuses: BOOKING_STATUSES,
  }), [
    myBookings,
    hostBookings,
    requestBooking,
    approveBooking,
    declineBooking,
    markCompleted,
    cancelBooking,
  ]);

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
}
