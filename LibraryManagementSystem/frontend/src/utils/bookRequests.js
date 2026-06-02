const STORAGE_KEY = 'book_requests';
const LEGACY_KEY = 'student_book_requests';

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLIST: 'waitlist'
};

function migrateLegacy() {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  try {
    const old = JSON.parse(legacy);
    const current = getAllRequests();
    const merged = [
      ...current,
      ...old.map((r) => ({
        id: r.id,
        userId: r.userId ?? null,
        username: r.username ?? 'Student',
        bookId: r.bookId,
        title: r.title,
        author: r.author ?? '',
        category: r.category ?? '',
        status: r.status === 'pending' ? REQUEST_STATUS.PENDING : r.status,
        createdAt: r.createdAt || new Date().toISOString()
      }))
    ];
    saveAll(merged);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function saveAll(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function getAllRequests() {
  migrateLegacy();
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getRequestsByStatus(status) {
  return getAllRequests().filter((r) => r.status === status);
}

export function countPendingRequests() {
  return getRequestsByStatus(REQUEST_STATUS.PENDING).length;
}

export function countWaitlistRequests() {
  return getRequestsByStatus(REQUEST_STATUS.WAITLIST).length;
}

export function submitBookRequest({ book, userId, username }) {
  const requests = getAllRequests();
  const duplicate = requests.find(
    (r) =>
      r.bookId === book.id &&
      r.userId === userId &&
      (r.status === REQUEST_STATUS.PENDING || r.status === REQUEST_STATUS.WAITLIST)
  );

  if (duplicate) {
    return { ok: false, duplicate: true, request: duplicate };
  }

  const request = {
    id: Date.now(),
    userId,
    username: username || `User #${userId}`,
    bookId: book.id,
    title: book.title,
    author: book.author || '',
    category: book.category || '',
    status: REQUEST_STATUS.PENDING,
    createdAt: new Date().toISOString()
  };

  requests.unshift(request);
  saveAll(requests);
  window.dispatchEvent(new Event('book-requests-updated'));
  return { ok: true, request };
}

export function updateRequestStatus(id, status, extra = {}) {
  const requests = getAllRequests().map((r) =>
    r.id === id
      ? { ...r, status, resolvedAt: new Date().toISOString(), ...extra }
      : r
  );
  saveAll(requests);
  window.dispatchEvent(new Event('book-requests-updated'));
  return requests.find((r) => r.id === id);
}

export function getStudentRequests(userId) {
  return getAllRequests().filter((r) => r.userId === userId);
}
