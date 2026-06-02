import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiCreditCard, FiDownload, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { downloadFineReceipt } from '../utils/paymentReceipt';
import { FINE_RATE, LOAN_PERIOD_DAYS, STRIPE_MIN_INR } from '../utils/libraryData';

function PaymentStatusBadge({ status }) {
  const key = (status || 'PENDING').toUpperCase();
  const variant =
    key === 'PAID' ? 'success' : key === 'FAILED' ? 'danger' : 'warning';
  return <span className={`badge badge-${variant}`}>{key}</span>;
}

export default function PaymentCard({
  transactionId,
  fine,
  lateDays,
  studentName,
  bookName,
  dueDate,
  onPaymentVerified,
  variant = 'student'
}) {
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [upiId, setUpiId] = useState('library@upi');

  const loadPayment = useCallback(async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/payment/${transactionId}`);
      setPayment(res.data);
      if (res.data?.upiId) setUpiId(res.data.upiId);
    } catch {
      setPayment({
        paymentStatus: 'PENDING',
        studentName,
        bookName,
        fine
      });
    } finally {
      setLoading(false);
    }
  }, [transactionId, studentName, bookName, fine]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  const paymentStatus = (payment?.paymentStatus || 'PENDING').toUpperCase();
  const isPaid = paymentStatus === 'PAID';
  const fineAmount = Number(payment?.fine ?? fine);
  const stripeChargeAmount = Math.max(fineAmount, STRIPE_MIN_INR);
  const stripeUsesMinimum = fineAmount > 0 && stripeChargeAmount > fineAmount;
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Library&am=${fineAmount.toFixed(2)}`;

  const handleStripePay = async () => {
    if (stripeUsesMinimum) {
      const ok = window.confirm(
        `Stripe requires a minimum charge of ₹${STRIPE_MIN_INR}.\n\n` +
          `Your library fine: ₹${fineAmount.toFixed(2)}\n` +
          `Stripe checkout amount: ₹${stripeChargeAmount.toFixed(2)}\n\n` +
          'Continue to Stripe?'
      );
      if (!ok) return;
    }
    setStripeLoading(true);
    try {
      const res = await api.post('/create-payment', {
        transaction_id: Number(transactionId),
        fine_amount: fineAmount
      });
      if (res.data?.upiId) setUpiId(res.data.upiId);
      const url = res.data?.checkoutUrl;
      if (!url) throw new Error('Checkout URL missing');
      window.location.href = url;
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Stripe payment failed');
      setStripeLoading(false);
    }
  };

  const handleVerify = async (method = 'STRIPE') => {
    setLoading(true);
    try {
      const res = await api.post('/payment/verify', {
        transaction_id: Number(transactionId),
        payment_method: method,
        stripe_session_id: payment?.stripePaymentId || undefined
      });
      const next = res.data?.payment || res.data;
      setPayment(next);
      setShowSuccessModal(true);
      toast.success('Payment verified successfully');
      onPaymentVerified?.(next);
      await loadPayment();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!isPaid) {
      toast.warning('Complete payment before downloading receipt');
      return;
    }
    downloadFineReceipt({
      studentName: payment?.studentName || studentName,
      bookName: payment?.bookName || bookName,
      transactionId,
      fineAmount: fineAmount,
      paymentMethod: payment?.paymentMethod,
      paymentDate: payment?.paymentDate,
      paymentStatus: payment?.paymentStatus || 'PAID',
      stripePaymentId: payment?.stripePaymentId
    });
    toast.success('Receipt downloaded');
  };

  if (!transactionId || fineAmount <= 0) return null;

  const isStudent = variant === 'student';

  return (
    <div className={`payment-card ${isPaid ? 'payment-card-paid' : ''}`}>
      <div className="payment-card-header">
        <h3>{isStudent ? 'Complete Fine Payment' : 'Fine Payment'}</h3>
        <PaymentStatusBadge status={paymentStatus} />
      </div>

      {loading && !payment ? (
        <LoadingSpinner label="Loading payment details..." />
      ) : (
        <>
          <div className="payment-section">
            <h4>Book Information</h4>
            <p>
              <span className="payment-label">Book Name</span>{' '}
              <strong>{payment?.bookName || bookName}</strong>
            </p>
            {dueDate && (
              <p>
                <span className="payment-label">Due Date</span> <strong>{dueDate}</strong>
              </p>
            )}
            <p>
              <span className="payment-label">Late Days</span> <strong>{lateDays}</strong>
            </p>
          </div>

          <div className="payment-section">
            <h4>Fine Details</h4>
            <p>
              Fine Rate: <strong>₹{FINE_RATE}/day</strong>
            </p>
            <p>
              Total Fine:{' '}
              <strong className="payment-fine-amount">₹{fineAmount.toFixed(2)}</strong>
            </p>
          </div>

          <div className="payment-section">
            <h4>Payment Options</h4>
            <div className="payment-qr-block">
              <div className={`payment-qr-wrap ${isPaid ? 'payment-qr-paid' : ''}`}>
                <QRCode value={upiPayload} size={168} />
              </div>
              <div className="payment-qr-meta">
                <p>
                  <span>UPI ID:</span> {upiId}
                </p>
                <p>
                  <span>Payment Status:</span>{' '}
                  <PaymentStatusBadge status={paymentStatus} />
                </p>
              </div>
            </div>
          </div>

          {!isPaid && stripeUsesMinimum && (
            <p className="payment-stripe-hint muted">
              Stripe minimum is ₹{STRIPE_MIN_INR}. Your fine is ₹{fineAmount.toFixed(2)} — checkout
              will charge ₹{stripeChargeAmount.toFixed(2)} (library fine on record stays ₹
              {fineAmount.toFixed(2)}).
            </p>
          )}

          <div className="payment-actions">
            {!isPaid && (
              <>
                <button
                  type="button"
                  className="btn-primary payment-btn"
                  onClick={handleStripePay}
                  disabled={stripeLoading}
                >
                  <FiCreditCard />
                  {stripeLoading
                    ? 'Redirecting to Stripe...'
                    : stripeUsesMinimum
                      ? `Pay ₹${stripeChargeAmount.toFixed(0)} with Stripe`
                      : 'Pay with Stripe'}
                </button>
                <button
                  type="button"
                  className="btn-secondary payment-btn"
                  onClick={() => handleVerify('UPI')}
                  disabled={loading}
                >
                  <FiRefreshCw />
                  Verify Payment
                </button>
              </>
            )}
            <button
              type="button"
              className={isPaid ? 'btn-primary payment-btn' : 'btn-secondary payment-btn'}
              onClick={handleDownloadReceipt}
              disabled={!isPaid}
            >
              <FiDownload />
              Download Receipt
            </button>
          </div>

          {isPaid && (
            <div className="payment-success-banner">
              <FiCheckCircle />
              <span>
                {isStudent
                  ? 'Payment completed — admin will verify and close your return.'
                  : 'Payment completed — you can verify and complete the return.'}
              </span>
            </div>
          )}
        </>
      )}

      {showSuccessModal && (
        <div
          className="payment-modal-overlay"
          onClick={() => setShowSuccessModal(false)}
        >
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-icon payment-animate-success">
              <FiCheckCircle />
            </div>
            <h3>Payment Successful</h3>
            <p>
              Fine of ₹{fineAmount.toFixed(2)} recorded for transaction #{transactionId}.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowSuccessModal(false)}
            >
              {isStudent ? 'Done' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
