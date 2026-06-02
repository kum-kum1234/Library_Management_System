import api from '../services/api';
import {
  addDays,
  computeFine,
  daysBetween,
  enrichTransactions,
  isOverdue,
  LOAN_PERIOD_DAYS,
  normalizeStatus,
  parseDate
} from './libraryData';
import { getStudentRequests, REQUEST_STATUS } from './bookRequests';

const DUE_SOON_DAYS = 3;

export function filterByUser(transactions, userId) {
  if (!userId) return [];
  return (transactions || []).filter((t) => t.userId === userId);
}

export function getEffectiveDueDate(tx) {
  const renewals = JSON.parse(localStorage.getItem('student_renewals') || '{}');
  const extra = renewals[tx.id] || 0;
  return addDays(tx.issueDate, LOAN_PERIOD_DAYS + extra);
}

export function daysUntilDue(tx, today = new Date()) {
  const due = parseDate(getEffectiveDueDate(tx));
  if (!due) return 0;
  return Math.max(0, Math.ceil((due - today) / (1000 * 60 * 60 * 24)));
}

export function isDueSoon(tx, today = new Date()) {
  if (normalizeStatus(tx.status) !== 'issued') return false;
  const left = daysUntilDue(tx, today);
  return left > 0 && left <= DUE_SOON_DAYS;
}

export function hasUnpaidFine(tx) {
  const fine = Number(tx.fine) || 0;
  const paymentStatus = (tx.paymentStatus || 'PENDING').toUpperCase();
  return fine > 0 && paymentStatus !== 'PAID';
}

export function studentStatus(tx) {
  const normalized = normalizeStatus(tx.status);
  if (normalized === 'payment_pending') return 'payment_pending';
  if (normalized === 'returned') return 'returned';
  const due = parseDate(getEffectiveDueDate(tx));
  const today = new Date();
  if (due && due < today) return 'overdue';
  return 'issued';
}

export function enrichStudentTransactions(transactions, books, userId) {
  const mine = filterByUser(transactions, userId);
  const enriched = enrichTransactions(mine, books, []);
  return enriched.map((tx) => {
    const displayStatus = studentStatus(tx);
    const dueDate = getEffectiveDueDate(tx);
    const paymentStatus = (tx.paymentStatus || 'PENDING').toUpperCase();
    let fine = Number(tx.fine) || 0;
    if (fine <= 0 && displayStatus === 'overdue') {
      fine = computeFine({ ...tx, issueDate: tx.issueDate });
    }
    const lateDays =
      fine > 0 && tx.returnDate
        ? daysBetween(tx.issueDate, tx.returnDate) - LOAN_PERIOD_DAYS
        : displayStatus === 'overdue'
          ? daysBetween(tx.issueDate, new Date().toISOString().slice(0, 10)) -
            LOAN_PERIOD_DAYS
          : 0;

    return {
      ...tx,
      dueDate,
      displayStatus,
      daysLeft: daysUntilDue(tx),
      fine: Math.max(0, fine),
      lateDays: Math.max(0, lateDays),
      paymentStatus
    };
  });
}

export function studentStats(enriched) {
  const active = enriched.filter(
    (t) => t.displayStatus === 'issued' || t.displayStatus === 'overdue'
  );
  const dueSoon = enriched.filter((t) => isDueSoon(t));

  const pendingFine = enriched.reduce((sum, t) => {
    if (hasUnpaidFine(t)) return sum + (t.fine || 0);
    return sum;
  }, 0);

  const paidFine = enriched.reduce((sum, t) => {
    if (t.paymentStatus === 'PAID' && t.fine > 0) return sum + t.fine;
    return sum;
  }, 0);

  const hasUnpaidFines = enriched.some((t) => hasUnpaidFine(t));

  return {
    currentlyIssued: active.filter((t) => t.displayStatus === 'issued').length,
    overdueCount: active.filter((t) => t.displayStatus === 'overdue').length,
    dueSoonCount: dueSoon.length,
    totalFine: pendingFine,
    paidFine,
    hasUnpaidFines,
    totalBorrowed: enriched.length
  };
}

export function buildStudentNotifications(enriched, userId) {
  const items = [];
  const dueSoon = enriched.filter((t) => isDueSoon(t));
  const overdue = enriched.filter((t) => t.displayStatus === 'overdue');
  const pendingPayment = enriched.filter(
    (t) => t.displayStatus === 'payment_pending' || hasUnpaidFine(t)
  );

  dueSoon.forEach((t) => {
    items.push({
      id: `due-${t.id}`,
      type: 'due',
      title: 'Due soon',
      message: `"${t.bookTitle}" is due in ${t.daysLeft} day(s)`,
      link: '/student/my-books',
      read: false
    });
  });

  overdue.forEach((t) => {
    items.push({
      id: `over-${t.id}`,
      type: 'overdue',
      title: 'Overdue',
      message: `"${t.bookTitle}" is overdue. Fine: ₹${t.fine}`,
      link: '/student/fines-payments',
      read: false
    });
  });

  pendingPayment.forEach((t) => {
    if (t.displayStatus === 'payment_pending' || hasUnpaidFine(t)) {
      items.push({
        id: `fine-${t.id}`,
        type: 'payment',
        title: t.paymentStatus === 'PAID' ? 'Payment successful' : 'Fine generated',
        message:
          t.paymentStatus === 'PAID'
            ? `Payment of ₹${t.fine} received for "${t.bookTitle}"`
            : `Fine of ₹${t.fine} due for "${t.bookTitle}" — pay now`,
        link: '/student/fines-payments',
        read: t.paymentStatus === 'PAID'
      });
    }
  });

  if (userId) {
    getStudentRequests(userId).slice(0, 5).forEach((r) => {
      if (r.status === REQUEST_STATUS.PENDING) {
        items.push({
          id: `req-${r.id}`,
          type: 'issue',
          title: 'Request pending',
          message: `Your request for "${r.title}" awaits admin approval`,
          link: '/student/books',
          read: false
        });
      }
      if (r.status === REQUEST_STATUS.APPROVED) {
        items.push({
          id: `appr-${r.id}`,
          type: 'issue',
          title: 'Request approved',
          message: `"${r.title}" has been issued to you`,
          link: '/student/my-books',
          read: false
        });
      }
      if (r.status === REQUEST_STATUS.REJECTED) {
        items.push({
          id: `rej-${r.id}`,
          type: 'overdue',
          title: 'Request rejected',
          message: `Request for "${r.title}" was not approved`,
          link: '/student/books',
          read: true
        });
      }
      if (r.status === REQUEST_STATUS.WAITLIST) {
        items.push({
          id: `wl-${r.id}`,
          type: 'due',
          title: 'On waitlist',
          message: `"${r.title}" is queued — admin will notify you`,
          link: '/student/books',
          read: false
        });
      }
    });
  }

  return items;
}

export function buildActivityFeed(enriched) {
  const activities = [];

  enriched.forEach((t) => {
    if (t.issueDate) {
      activities.push({
        id: `issue-${t.id}`,
        type: 'issued',
        text: `You issued "${t.bookTitle}"`,
        date: t.issueDate
      });
    }
    if (t.returnDate && t.displayStatus === 'returned') {
      activities.push({
        id: `ret-${t.id}`,
        type: 'returned',
        text: `Return completed for "${t.bookTitle}"`,
        date: t.returnDate
      });
    }
    if (t.displayStatus === 'payment_pending') {
      activities.push({
        id: `pend-${t.id}`,
        type: 'payment',
        text: `"${t.bookTitle}" returned — fine ₹${t.fine} pending payment`,
        date: t.returnDate || t.issueDate
      });
    }
    if (t.paymentStatus === 'PAID' && t.fine > 0) {
      activities.push({
        id: `pay-${t.id}`,
        type: 'payment',
        text: `Fine payment of ₹${t.fine} successful for "${t.bookTitle}"`,
        date: t.paymentDate || t.returnDate || t.issueDate
      });
    }
    if (isDueSoon(t)) {
      activities.push({
        id: `rem-${t.id}`,
        type: 'reminder',
        text: `Reminder: "${t.bookTitle}" is due soon`,
        date: new Date().toISOString()
      });
    }
  });

  return activities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
}

export function getRecommendations(books, enriched, limit = 4) {
  const issuedIds = new Set(enriched.map((t) => t.bookId));
  const categories = [...new Set(enriched.map((t) => t.bookCategory).filter(Boolean))];

  const scored = (books || [])
    .filter((b) => b.available > 0 && !issuedIds.has(b.id))
    .map((b) => {
      let score = b.available;
      if (categories.includes(b.category)) score += 10;
      return { ...b, score, rating: 4 + (b.id % 10) / 10 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

export async function checkUnpaidFines() {
  try {
    const res = await api.get('/student/has-unpaid-fines');
    return !!res.data?.hasUnpaidFines;
  } catch {
    return false;
  }
}

export function renewBook(transactionId) {
  const renewals = JSON.parse(localStorage.getItem('student_renewals') || '{}');
  renewals[transactionId] = (renewals[transactionId] || 0) + LOAN_PERIOD_DAYS;
  localStorage.setItem('student_renewals', JSON.stringify(renewals));
}

export { submitBookRequest as addBookRequest } from './bookRequests';
