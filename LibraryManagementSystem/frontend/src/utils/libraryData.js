import { countPendingRequests } from './bookRequests';
import { countActiveWaitlist } from './waitlist';

const LOAN_DAYS = 7;
const FINE_PER_DAY = 5;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetween(start, end) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return 0;
  return Math.max(0, Math.floor((e - s) / (1000 * 60 * 60 * 24)));
}

export function addDays(dateStr, days) {
  const d = parseDate(dateStr) || new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(tx, today = new Date()) {
  if (!tx || tx.status !== 'issued') return false;
  const issue = parseDate(tx.issueDate);
  if (!issue) return false;
  const due = new Date(issue);
  due.setDate(due.getDate() + LOAN_DAYS);
  return due < today;
}

export function computeFine(tx, returnDate = new Date().toISOString().slice(0, 10)) {
  if (!tx?.issueDate) return 0;
  const daysKept = daysBetween(tx.issueDate, returnDate);
  return daysKept > LOAN_DAYS ? (daysKept - LOAN_DAYS) * FINE_PER_DAY : 0;
}

export function normalizeStatus(status) {
  return (status || '').toLowerCase();
}

export function statusLabel(tx) {
  const normalized = normalizeStatus(tx.status);
  if (normalized === 'payment_pending') return 'payment_pending';
  if (isOverdue(tx)) return 'overdue';
  return normalized;
}

export function enrichTransactions(transactions, books = [], users = []) {
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return (transactions || []).map((tx) => {
    const book = bookMap[tx.bookId];
    const user = userMap[tx.userId];
    const label = statusLabel(tx);
    const dueDate = tx.issueDate ? addDays(tx.issueDate, LOAN_DAYS) : '';

    return {
      ...tx,
      bookTitle: book?.title || `Book #${tx.bookId}`,
      bookAuthor: book?.author || '',
      bookCategory: book?.category || '',
      username: user?.username || `User #${tx.userId}`,
      userRole: user?.role || '',
      dueDate,
      displayStatus: label,
      fine:
        Number(tx.fine) > 0
          ? Number(tx.fine)
          : tx.returnDate
            ? computeFine(tx, tx.returnDate)
            : isOverdue(tx)
              ? computeFine(tx)
              : 0,
      paymentStatus: (tx.paymentStatus || 'PENDING').toUpperCase()
    };
  });
}

export function countOverdue(transactions) {
  return (transactions || []).filter((tx) => isOverdue(tx)).length;
}

export function countIssuedToday(transactions, date = new Date()) {
  const today = date.toISOString().slice(0, 10);
  return (transactions || []).filter(
    (tx) => normalizeStatus(tx.status) === 'issued' && tx.issueDate?.slice(0, 10) === today
  ).length;
}

export function countReturnedToday(transactions, date = new Date()) {
  const today = date.toISOString().slice(0, 10);
  return (transactions || []).filter(
    (tx) => normalizeStatus(tx.status) === 'returned' && tx.returnDate?.slice(0, 10) === today
  ).length;
}

export function totalFinesCollected(transactions) {
  return enrichTransactions(transactions)
    .filter((tx) => normalizeStatus(tx.status) === 'returned')
    .reduce((sum, tx) => sum + (tx.fine || 0), 0);
}

export function monthlyChartData(transactions, books, year = new Date().getFullYear()) {
  const issued = Array(12).fill(0);
  const returned = Array(12).fill(0);
  const added = Array(12).fill(0);

  (transactions || []).forEach((tx) => {
    const issue = parseDate(tx.issueDate);
    if (issue && issue.getFullYear() === year) {
      issued[issue.getMonth()] += 1;
    }
    const ret = parseDate(tx.returnDate);
    if (ret && ret.getFullYear() === year) {
      returned[ret.getMonth()] += 1;
    }
  });

  (books || []).forEach((book) => {
    const created = parseDate(book.createdAt);
    if (created && created.getFullYear() === year) {
      added[created.getMonth()] += 1;
    }
  });

  return MONTHS.map((month, i) => ({
    month,
    issued: issued[i],
    returned: returned[i],
    added: added[i]
  }));
}

export function categoryDistribution(books) {
  const counts = {};
  (books || []).forEach((b) => {
    const cat = b.category || 'Others';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const colors = ['#4f6ef7', '#22c55e', '#a855f7', '#f59e0b', '#94a3b8', '#ec4899'];

  return Object.entries(counts)
    .map(([name, value], i) => ({
      name,
      value,
      percent: Math.round((value / total) * 100),
      fill: colors[i % colors.length]
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildNotifications({ transactions, books, users }) {
  const items = [];
  const pendingRequests = countPendingRequests();
  const waitlistCount = countActiveWaitlist();
  const overdue = countOverdue(transactions);
  const lowStock = (books || []).filter((b) => b.available === 0).length;
  const issued = (transactions || []).filter((t) => normalizeStatus(t.status) === 'issued').length;
  const pendingFinePayments = (transactions || []).filter(
    (t) =>
      normalizeStatus(t.status) === 'payment_pending' ||
      (Number(t.fine) > 0 && (t.paymentStatus || 'PENDING').toUpperCase() !== 'PAID')
  ).length;
  const awaitingVerification = (transactions || []).filter(
    (t) =>
      normalizeStatus(t.status) === 'payment_pending' &&
      (t.paymentStatus || '').toUpperCase() === 'PAID'
  ).length;

  if (pendingRequests > 0) {
    items.push({
      id: 'book-requests',
      type: 'issued',
      title: 'Book requests',
      message: `${pendingRequests} student request(s) need approval`,
      link: '/'
    });
  }

  if (waitlistCount > 0) {
    items.push({
      id: 'waitlist-queue',
      type: 'stock',
      title: 'Waitlist queue',
      message: `${waitlistCount} student(s) waiting for unavailable books`,
      link: '/waitlists'
    });
  }

  if (overdue > 0) {
    items.push({
      id: 'overdue',
      type: 'overdue',
      title: 'Overdue books',
      message: `${overdue} book(s) are past due date`,
      link: '/transactions?filter=overdue'
    });
  }

  if (pendingFinePayments > 0) {
    items.push({
      id: 'pending-fines',
      type: 'overdue',
      title: 'Pending fine payments',
      message: `${pendingFinePayments} return(s) awaiting student fine payment`,
      link: '/issue-return'
    });
  }

  if (awaitingVerification > 0) {
    items.push({
      id: 'verify-payments',
      type: 'issued',
      title: 'Payment verification pending',
      message: `${awaitingVerification} paid fine(s) need admin verification`,
      link: '/issue-return'
    });
  }

  if (lowStock > 0) {
    items.push({
      id: 'stock',
      type: 'stock',
      title: 'Low stock',
      message: `${lowStock} book(s) have no copies available`,
      link: '/books?filter=unavailable'
    });
  }

  if (issued > 0) {
    items.push({
      id: 'active',
      type: 'issued',
      title: 'Active loans',
      message: `${issued} book(s) currently issued`,
      link: '/transactions?filter=issued'
    });
  }

  const studentCount = (users || []).filter((u) => u.role === 'student').length;
  if (studentCount > 0) {
    items.push({
      id: 'users',
      type: 'user',
      title: 'Library members',
      message: `${studentCount} student account(s) registered`,
      link: '/users'
    });
  }

  return items;
}

export function bookStatus(book) {
  if (book.available <= 0) return 'unavailable';
  if (book.available < book.quantity) return 'issued';
  return 'available';
}

export function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    total: items.length
  };
}

export function issuedCountByUser(transactions, userId) {
  return (transactions || []).filter(
    (t) => t.userId === userId && normalizeStatus(t.status) === 'issued'
  ).length;
}

export function userFines(transactions, userId) {
  return enrichTransactions(transactions)
    .filter((t) => t.userId === userId)
    .reduce((sum, t) => sum + (t.fine || 0), 0);
}

export const LOAN_PERIOD_DAYS = LOAN_DAYS;
export const FINE_RATE = FINE_PER_DAY;
/** Stripe Checkout minimum (~$0.50 USD equivalent in INR) */
export const STRIPE_MIN_INR = 50;
