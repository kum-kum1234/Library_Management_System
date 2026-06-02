USE library_db;

ALTER TABLE transactions
ADD fine DECIMAL(10,2) DEFAULT 0;

ALTER TABLE transactions
ADD payment_status VARCHAR(20) DEFAULT 'PENDING',
ADD payment_method VARCHAR(50) NULL,
ADD stripe_payment_id VARCHAR(255) NULL,
ADD payment_date TIMESTAMP NULL;
