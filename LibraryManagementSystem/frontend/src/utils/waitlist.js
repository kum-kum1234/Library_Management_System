import { submitBookRequest } from './bookRequests';

const WAITLIST_KEY = 'waitlist';
const NOTIFY_KEY = 'waitlist_notifications';
const RESERVE_HOURS = 24;

export const WAITLIST_STATUS = {
  WAITING: 'waiting',
  NOTIFIED: 'notified',
  RESERVED: 'reserved',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  REMOVED: 'removed'
};

const ROLE_PRIORITY = { admin: 0, faculty: 0, librarian: 1, student: 2 };

function dispatchUpdate() {
  window.dispatchEvent(new Event('waitlist-updated'));
}

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(WAITLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(entries) {
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
  dispatchUpdate();
}

function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotifications(list) {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(list));
  dispatchUpdate();
}

export function addWaitlistNotification({ userId, bookId, title, message }) {
  const list = getNotifications();
  list.unshift({
    id: Date.now(),
    userId,
    bookId,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });
  saveNotifications(list);
}

export function getUserWaitlistNotifications(userId) {
  return getNotifications().filter((n) => n.userId === userId);
}

export function markNotificationRead(id) {
  const list = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(list);
}

function sortQueue(entries) {
  return [...entries].sort((a, b) => {
    const pa = ROLE_PRIORITY[a.userRole] ?? 2;
    const pb = ROLE_PRIORITY[b.userRole] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.joined_at) - new Date(b.joined_at);
  });
}

export function getQueueForBook(bookId, status = WAITLIST_STATUS.WAITING) {
  return sortQueue(
    getAll().filter((w) => w.book_id === bookId && w.status === status)
  );
}

export function countWaitingForBook(bookId) {
  return getAll().filter(
    (w) =>
      w.book_id === bookId &&
      (w.status === WAITLIST_STATUS.WAITING || w.status === WAITLIST_STATUS.NOTIFIED)
  ).length;
}

export function getPosition(userId, bookId) {
  const queue = getQueueForBook(bookId);
  const idx = queue.findIndex((w) => w.user_id === userId);
  return idx === -1 ? null : idx + 1;
}

export function estimateWaitDays(position) {
  if (!position || position <= 0) return 0;
  return Math.max(1, position * 3);
}

export function isUserOnWaitlist(userId, bookId) {
  return getAll().some(
    (w) =>
      w.user_id === userId &&
      w.book_id === bookId &&
      [WAITLIST_STATUS.WAITING, WAITLIST_STATUS.NOTIFIED, WAITLIST_STATUS.RESERVED].includes(
        w.status
      )
  );
}

/** Simulates POST /api/waitlist/join */
export function joinWaitlist({ user_id, book_id, username, userRole, book }) {
  const all = getAll();
  const exists = all.find(
    (w) =>
      w.user_id === user_id &&
      w.book_id === book_id &&
      [WAITLIST_STATUS.WAITING, WAITLIST_STATUS.NOTIFIED, WAITLIST_STATUS.RESERVED].includes(
        w.status
      )
  );

  if (exists) {
    return { ok: false, duplicate: true, entry: exists };
  }

  const entry = {
    id: Date.now(),
    user_id,
    book_id,
    username: username || `User #${user_id}`,
    userRole: userRole || 'student',
    bookTitle: book?.title || `Book #${book_id}`,
    bookAuthor: book?.author || '',
    bookCategory: book?.category || '',
    joined_at: new Date().toISOString(),
    status: WAITLIST_STATUS.WAITING
  };

  all.push(entry);
  saveAll(all);

  const position = getPosition(user_id, book_id);
  const waitDays = estimateWaitDays(position);

  return { ok: true, entry, position, estimatedWaitDays: waitDays };
}

/** Simulates DELETE /api/waitlist/:id */
export function cancelWaitlist(id) {
  const all = getAll().map((w) =>
    w.id === id ? { ...w, status: WAITLIST_STATUS.CANCELLED } : w
  );
  saveAll(all);
}

export function removeFromWaitlist(id) {
  const all = getAll().map((w) =>
    w.id === id ? { ...w, status: WAITLIST_STATUS.REMOVED } : w
  );
  saveAll(all);
}

export function approveWaitlistReserve(entry) {
  const reservedUntil = new Date();
  reservedUntil.setHours(reservedUntil.getHours() + RESERVE_HOURS);
  const all = getAll().map((w) =>
    w.id === entry.id
      ? {
          ...w,
          status: WAITLIST_STATUS.RESERVED,
          reservedUntil: reservedUntil.toISOString()
        }
      : w
  );
  saveAll(all);
  addWaitlistNotification({
    userId: entry.user_id,
    bookId: entry.book_id,
    title: entry.bookTitle,
    message: `📚 "${entry.bookTitle}" is reserved for you for ${RESERVE_HOURS} hours.`
  });
}

export function notifyWaitlistStudent(entry) {
  const all = getAll().map((w) =>
    w.id === entry.id ? { ...w, status: WAITLIST_STATUS.NOTIFIED } : w
  );
  saveAll(all);
  addWaitlistNotification({
    userId: entry.user_id,
    bookId: entry.book_id,
    title: entry.bookTitle,
    message: `📚 ${entry.bookTitle} is now available for you.`
  });
}

export function getUserWaitlist(userId) {
  return getAll()
    .filter(
      (w) =>
        w.user_id === userId &&
        w.status !== WAITLIST_STATUS.CANCELLED &&
        w.status !== WAITLIST_STATUS.REMOVED
    )
    .map((w) => {
      const pos =
        w.status === WAITLIST_STATUS.WAITING ? getPosition(w.user_id, w.book_id) : null;
      return {
        ...w,
        position: pos,
        estimatedWait: pos ? `${estimateWaitDays(pos)} days` : '—'
      };
    });
}

export function getAllWaitlistEntries() {
  return getAll()
    .filter(
      (w) =>
        w.status !== WAITLIST_STATUS.CANCELLED && w.status !== WAITLIST_STATUS.REMOVED
    )
    .map((w) => ({
      ...w,
      position: getPosition(w.user_id, w.book_id)
    }));
}

export function getMostWaitlistedBooks(limit = 5) {
  const counts = {};
  getAll()
    .filter((w) => w.status === WAITLIST_STATUS.WAITING)
    .forEach((w) => {
      counts[w.book_id] = counts[w.book_id] || {
        bookId: w.book_id,
        title: w.bookTitle,
        count: 0
      };
      counts[w.book_id].count += 1;
    });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function checkExpiredReservations() {
  const now = Date.now();
  const all = getAll();
  let changed = false;

  const updated = all.map((w) => {
    if (w.status === WAITLIST_STATUS.RESERVED && w.reservedUntil) {
      if (new Date(w.reservedUntil).getTime() < now) {
        changed = true;
        return { ...w, status: WAITLIST_STATUS.EXPIRED };
      }
    }
    return w;
  });

  if (changed) {
    saveAll(updated);
    updated
      .filter((w) => w.status === WAITLIST_STATUS.EXPIRED)
      .forEach((w) => {
        processBookReturned(w.book_id, { title: w.bookTitle });
      });
  }

  return changed;
}

/** Auto-flow when a book is returned — notify next in queue */
export function processBookReturned(bookId, book = {}) {
  checkExpiredReservations();

  const queue = getQueueForBook(bookId, WAITLIST_STATUS.WAITING);
  if (queue.length === 0) return null;

  const next = queue[0];
  const title = book.title || next.bookTitle;

  const reservedUntil = new Date();
  reservedUntil.setHours(reservedUntil.getHours() + RESERVE_HOURS);

  const all = getAll().map((w) =>
    w.id === next.id
      ? {
          ...w,
          status: WAITLIST_STATUS.RESERVED,
          reservedUntil: reservedUntil.toISOString(),
          notifiedAt: new Date().toISOString()
        }
      : w
  );
  saveAll(all);

  addWaitlistNotification({
    userId: next.user_id,
    bookId,
    title,
    message: `📚 ${title} is now available for you. Reserved for ${RESERVE_HOURS} hours.`
  });

  submitBookRequest({
    book: {
      id: bookId,
      title,
      author: next.bookAuthor,
      category: next.bookCategory
    },
    userId: next.user_id,
    username: next.username
  });

  return next;
}

export function countActiveWaitlist() {
  return getAll().filter((w) => w.status === WAITLIST_STATUS.WAITING).length;
}
