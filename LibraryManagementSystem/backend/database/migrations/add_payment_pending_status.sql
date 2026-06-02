-- Allow payment_pending transaction status for fine payment workflow
ALTER TABLE transactions
MODIFY status VARCHAR(32) DEFAULT 'issued';
