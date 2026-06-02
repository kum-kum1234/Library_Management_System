CREATE DATABASE IF NOT EXISTS library_db;

USE library_db;

-- =====================================
-- USERS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS users (

    id INT PRIMARY KEY AUTO_INCREMENT,

    username VARCHAR(100)
        UNIQUE
        NOT NULL,

    email VARCHAR(150)
        UNIQUE,

    password VARCHAR(255)
        NOT NULL,

    role ENUM('ADMIN', 'LIBRARIAN', 'STUDENT')
        DEFAULT 'STUDENT',

    profile_image VARCHAR(255),

    phone VARCHAR(20),

    department VARCHAR(100),

    is_blocked BOOLEAN
        DEFAULT FALSE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- BOOKS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS books (

    id INT PRIMARY KEY AUTO_INCREMENT,

    title VARCHAR(255)
        NOT NULL,

    author VARCHAR(255)
        NOT NULL,

    category VARCHAR(100)
        NOT NULL,

    isbn VARCHAR(100)
        UNIQUE,

    description TEXT,

    image VARCHAR(255),

    quantity INT
        DEFAULT 0,

    available INT
        DEFAULT 0,

    publisher VARCHAR(255),

    published_year YEAR,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- TRANSACTIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS transactions (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    book_id INT
        NOT NULL,

    issue_date DATE
        NOT NULL,

    due_date DATE
        NOT NULL,

    return_date DATE NULL,

    fine DECIMAL(10,2)
        DEFAULT 0,

    payment_status VARCHAR(20)
        DEFAULT 'PENDING',

    payment_method VARCHAR(50) NULL,

    stripe_payment_id VARCHAR(255) NULL,

    payment_date TIMESTAMP NULL,

    status ENUM('ISSUED', 'RETURNED', 'OVERDUE')
        DEFAULT 'ISSUED',

    renewed_count INT
        DEFAULT 0,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);

-- =====================================
-- BOOK REQUESTS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS book_requests (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    book_id INT
        NOT NULL,

    request_date TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'WAITLISTED'
    )
        DEFAULT 'PENDING',

    admin_message TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);

-- =====================================
-- WAITLIST TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS waitlist (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    book_id INT
        NOT NULL,

    joined_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    position_number INT,

    status ENUM(
        'WAITING',
        'NOTIFIED',
        'COMPLETED',
        'CANCELLED'
    )
        DEFAULT 'WAITING',

    expires_at DATETIME,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);

-- =====================================
-- NOTIFICATIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS notifications (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    title VARCHAR(255),

    message TEXT,

    type ENUM(
        'DUE_REMINDER',
        'OVERDUE',
        'BOOK_AVAILABLE',
        'BOOK_APPROVED',
        'GENERAL'
    ),

    is_read BOOLEAN
        DEFAULT FALSE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================
-- FINE PAYMENTS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS fine_payments (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    transaction_id INT
        NOT NULL,

    amount DECIMAL(10,2),

    payment_method VARCHAR(50),

    payment_status ENUM(
        'PENDING',
        'SUCCESS',
        'FAILED'
    )
        DEFAULT 'PENDING',

    payment_date TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE CASCADE
);

-- =====================================
-- ACTIVITY LOGS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS activity_logs (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    activity_type VARCHAR(100),

    description TEXT,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================
-- REVIEWS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS reviews (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    book_id INT
        NOT NULL,

    rating INT CHECK (rating >= 1 AND rating <= 5),

    review TEXT,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);

-- =====================================
-- FAVORITES TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS favorites (

    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT
        NOT NULL,

    book_id INT
        NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE CASCADE
);