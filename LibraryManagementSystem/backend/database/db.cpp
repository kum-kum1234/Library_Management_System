#include "db.h"
#include <mysql.h>
#include <cstdlib>
#include <string>
#include <iostream>

namespace {

bool columnExists(MYSQL* conn, const std::string& table, const std::string& column) {
    std::string q =
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = '" + table + "' "
        "AND COLUMN_NAME = '" + column + "'";

    if (mysql_query(conn, q.c_str())) return false;

    MYSQL_RES* res = mysql_store_result(conn);
    if (!res) return false;

    MYSQL_ROW row = mysql_fetch_row(res);
    bool exists = row && std::stoi(row[0]) > 0;
    mysql_free_result(res);
    return exists;
}

void addColumnIfMissing(MYSQL* conn, const std::string& definition) {
    if (mysql_query(conn, ("ALTER TABLE transactions ADD " + definition).c_str())) {
        std::cerr << "Schema migration warning: " << mysql_error(conn) << std::endl;
    }
}

} // namespace

void Database::ensureTransactionSchema(MYSQL* conn) {
    if (!conn) return;

    if (!columnExists(conn, "transactions", "fine")) {
        addColumnIfMissing(conn, "fine DECIMAL(10,2) DEFAULT 0");
    }
    if (!columnExists(conn, "transactions", "payment_status")) {
        addColumnIfMissing(conn, "payment_status VARCHAR(20) DEFAULT 'PENDING'");
    }
    if (!columnExists(conn, "transactions", "payment_method")) {
        addColumnIfMissing(conn, "payment_method VARCHAR(50) NULL");
    }
    if (!columnExists(conn, "transactions", "stripe_payment_id")) {
        addColumnIfMissing(conn, "stripe_payment_id VARCHAR(255) NULL");
    }
    if (!columnExists(conn, "transactions", "payment_date")) {
        addColumnIfMissing(conn, "payment_date TIMESTAMP NULL");
    }
}

MYSQL* Database::connect() {
    const char* host = std::getenv("DB_HOST");
    const char* port_str = std::getenv("DB_PORT");
    const char* user = std::getenv("DB_USER");
    const char* pass = std::getenv("DB_PASS");
    const char* name = std::getenv("DB_NAME");

    const char* host_s = host ? host : "127.0.0.1";
    unsigned int port_i = port_str ? std::atoi(port_str) : 3306;
    const char* user_s = user ? user : "root";
    const char* pass_s = pass ? pass : "Kumkum@9171";
    const char* name_s = name ? name : "library_db";

    MYSQL* conn = mysql_init(NULL);

    if (!conn) {
        std::cerr << "MySQL init failed" << std::endl;
        return nullptr;
    }

    if (!mysql_real_connect(
            conn,
            host_s,
            user_s,
            pass_s,
            nullptr,
            port_i,
            NULL,
            0
        )) {

        std::cerr << "MySQL connection failed: "
                  << mysql_error(conn)
                  << std::endl;

        mysql_close(conn);

        return nullptr;
    }

    if (mysql_select_db(conn, name_s) != 0) {
        std::string createDbQuery = std::string("CREATE DATABASE IF NOT EXISTS `") + name_s + "`";
        if (mysql_query(conn, createDbQuery.c_str())) {
            std::cerr << "MySQL create database failed: "
                      << mysql_error(conn)
                      << std::endl;
            mysql_close(conn);
            return nullptr;
        }

        if (mysql_select_db(conn, name_s) != 0) {
            std::cerr << "MySQL select database failed: "
                      << mysql_error(conn)
                      << std::endl;
            mysql_close(conn);
            return nullptr;
        }
    }

    ensureTransactionSchema(conn);

    return conn;
}

void Database::close(MYSQL* conn) {
    if (conn) {
        mysql_close(conn);
    }
}
