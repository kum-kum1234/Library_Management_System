import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const sessionId = params.get('session_id');
  const transactionId = params.get('transaction_id');

  useEffect(() => {
    const verify = async () => {
      if (!transactionId) {
        setStatus('error');
        return;
      }
      try {
        await api.post('/payment/verify', {
          transaction_id: Number(transactionId),
          payment_method: 'STRIPE',
          stripe_session_id: sessionId || undefined
        });
        setStatus('success');
        toast.success('Stripe payment verified');
      } catch (err) {
        setStatus('error');
        toast.error(err?.response?.data?.error || 'Payment verification failed');
      }
    };
    verify();
  }, [sessionId, transactionId]);

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        {status === 'loading' && <LoadingSpinner label="Verifying Stripe payment..." />}
        {status === 'success' && (
          <>
            <div className="payment-modal-icon payment-animate-success">
              <FiCheckCircle />
            </div>
            <h1>Payment Successful</h1>
            <p>Transaction #{transactionId} fine payment is confirmed.</p>
            <p className="hint">
              Your receipt is available on the Fines &amp; Payments page. Admin will verify
              and complete your return.
            </p>
            <Link to="/student/fines-payments" className="btn-primary">
              Go to Fines & Payments
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Verification Issue</h1>
            <p>
              We could not confirm the payment automatically. Use Verify Payment on your
              Fines &amp; Payments page after completing UPI payment.
            </p>
            <Link to="/student/fines-payments" className="btn-primary">
              Fines & Payments
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
