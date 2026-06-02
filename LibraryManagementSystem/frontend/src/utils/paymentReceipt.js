import { jsPDF } from 'jspdf';

export function downloadFineReceipt({
  studentName,
  bookName,
  transactionId,
  fineAmount,
  paymentMethod,
  paymentDate,
  paymentStatus,
  stripePaymentId
}) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.text('Library Fine Payment Receipt', margin, y);
  y += 14;

  doc.setFontSize(11);
  const lines = [
    ['Student Name', studentName || '—'],
    ['Book Name', bookName || '—'],
    ['Transaction ID', String(transactionId || '—')],
    ['Fine Amount', `₹${Number(fineAmount || 0).toFixed(2)}`],
    ['Payment Method', paymentMethod || '—'],
    ['Payment Date', paymentDate || '—'],
    ['Payment Status', paymentStatus || 'PAID'],
    ['Stripe Payment ID', stripePaymentId || '—']
  ];

  lines.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), margin + 52, y);
    y += 10;
  });

  doc.save(`library-fine-receipt-${transactionId || 'payment'}.pdf`);
}
