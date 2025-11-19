import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from './auth-context';
import { BookingsContext } from './bookings-context';
import { ensureBookingThread } from '../util/messaging';

function toDateMaybe(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return null;
}

export const MessagesContext = createContext({
  threads: [],
  messagesByThread: {},
  unreadCount: 0,
  observeThread: () => () => {},
  sendMessage: async () => {},
});

export function MessagesContextProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { myBookings, hostBookings } = useContext(BookingsContext);

  const [threads, setThreads] = useState([]);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const listenersRef = useRef({});
  const ensuredThreadsRef = useRef(new Set());

  const bookingLookup = useMemo(() => {
    const map = new Map();
    myBookings.forEach(b => map.set(b.id, { ...b, scope: 'renter' }));
    hostBookings.forEach(b => {
      if (!map.has(b.id)) {
        map.set(b.id, { ...b, scope: 'host' });
      }
    });
    return map;
  }, [myBookings, hostBookings]);

  useEffect(() => {
    setThreads([]);
    setMessagesByThread({});
    Object.values(listenersRef.current).forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    listenersRef.current = {};

    if (!user?.uid) return undefined;

    const threadsQuery = query(
      collection(db, 'threads'),
      where(`members.${user.uid}.uid`, '==', user.uid)
    );

    const unsubscribe = onSnapshot(threadsQuery, snapshot => {
      const next = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const createdAt = toDateMaybe(data.createdAt);
        const lastMessage = data.lastMessage
          ? {
              ...data.lastMessage,
              createdAt: toDateMaybe(data.lastMessage.createdAt),
            }
          : null;
        return {
          id: docSnap.id,
          ...data,
          createdAt,
          lastMessage,
        };
      });
      setThreads(next);

      // Calculate unread messages
      let count = 0;
      next.forEach(thread => {
        const messages = messagesByThread[thread.id] || [];
        const lastReadAt = thread.members?.[user.uid]?.lastReadAt;
        if (thread.lastMessage && 
            thread.lastMessage.senderId !== user.uid && 
            (!lastReadAt || toDateMaybe(thread.lastMessage.createdAt) > toDateMaybe(lastReadAt))) {
          count++;
        }
      });
      setUnreadCount(count);
    });

    return () => {
      unsubscribe();
      Object.values(listenersRef.current).forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      listenersRef.current = {};
      setMessagesByThread({});
    };
  }, [user?.uid]);

  const observeThread = useCallback(threadId => {
    if (!threadId) return () => {};

    const messageQuery = query(
      collection(db, 'threads', threadId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    if (listenersRef.current[threadId]) {
      const existing = listenersRef.current[threadId];
      if (typeof existing === 'function') existing();
    }

    const unsubscribe = onSnapshot(messageQuery, snapshot => {
      setMessagesByThread(prev => ({
        ...prev,
        [threadId]: snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: toDateMaybe(data.createdAt),
          };
        }),
      }));
    });

    listenersRef.current[threadId] = unsubscribe;

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      delete listenersRef.current[threadId];
      setMessagesByThread(prev => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
    };
  }, []);

  const sendMessage = useCallback(
    async (threadId, text) => {
      if (!threadId) throw new Error('Thread id is required.');
      if (!user?.uid) throw new Error('Must be signed in to send messages.');
      const trimmed = text?.trim();
      if (!trimmed) return;

      const thread = threads.find(t => t.id === threadId);
      if (thread?.booking) {
        const { booking } = thread;
        await ensureBookingThread({
          bookingId: threadId,
          vehicleTitle: booking.vehicleTitle,
          hostId: booking.hostId,
          renterId: booking.renterId,
          createdBy: user.uid,
        });
      }

      const messagePayload = {
        text: trimmed,
        type: 'text',
        senderId: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'threads', threadId, 'messages'), messagePayload);
      await updateDoc(doc(db, 'threads', threadId), {
        lastMessage: {
          text: trimmed,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        },
      });
    },
    [threads, user?.uid]
  );

  const enrichedThreads = useMemo(() => {
    const sorted = [...threads].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || b.createdAt || 0;
      return bTime - aTime;
    });

    return sorted.map(thread => ({
      ...thread,
      booking: bookingLookup.get(thread.id) || null,
    }));
  }, [threads, bookingLookup]);

  useEffect(() => {
    if (!user?.uid) {
      ensuredThreadsRef.current = new Set();
      return;
    }

    const combined = [...myBookings, ...hostBookings];
    combined.forEach(booking => {
      if (!booking?.id) return;
      if (booking.status === 'canceled') return;
      if (ensuredThreadsRef.current.has(booking.id)) return;

      ensuredThreadsRef.current.add(booking.id);
      ensureBookingThread({
        bookingId: booking.id,
        vehicleTitle: booking.vehicleTitle,
        hostId: booking.hostId,
        renterId: booking.renterId,
        createdBy: booking.renterId,
      }).catch(err => {
        if (__DEV__) {
          console.warn('ensureBookingThread (context) failed', err?.code || err?.message || err);
        }
      });
    });
  }, [user?.uid, myBookings, hostBookings]);

  return (
    <MessagesContext.Provider
      value={{
        threads: enrichedThreads,
        messagesByThread,
        observeThread,
        sendMessage,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}
