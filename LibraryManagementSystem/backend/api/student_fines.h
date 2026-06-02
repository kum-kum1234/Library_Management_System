#pragma once

#include "db.h"
#include "jwt.h"
#include "common.h"

#include <crow.h>
#include <mysql.h>
#include <string>

namespace {

bool authUserId(const crow::request& req, int& userId, std::string& role) {
    auto auth = req.get_header_value("Authorization");
    if (auth.empty()) return false;

    const std::string prefix = "Bearer ";
    if (auth.rfind(prefix, 0) != 0) return false;

    std::string token = auth.substr(prefix.size());
    if (!Jwt::verifyToken(token)) return false;

    auto decoded = Jwt::decodeToken(token);
    role = decoded.role;

    MYSQL* conn = Database::connect();
    if (!conn) return false;

    std::string query =
        "SELECT id FROM users WHERE username='" + decoded.username + "'";

    if (mysql_query(conn, query.c_str())) {
        Database::close(conn);
        return false;
    }

    MYSQL_RES* result = mysql_store_result(conn);
    MYSQL_ROW row = result ? mysql_fetch_row(result) : nullptr;
    if (!row) {
        if (result) mysql_free_result(result);
        Database::close(conn);
        return false;
    }

    userId = std::stoi(row[0]);
    if (result) mysql_free_result(result);
    Database::close(conn);
    return true;
}

} // namespace

template<typename App>
void registerStudentFinesRoutes(App& app) {

    CROW_ROUTE(app, "/api/student/fines-summary")
    .methods("GET"_method)
    ([](const crow::request& req) {
        int userId = 0;
        std::string role;
        if (!authUserId(req, userId, role)) {
            return api_utils::errRes(401, "Unauthorized");
        }

        MYSQL* conn = Database::connect();
        if (!conn) return api_utils::errRes(500, "Database connection failed");

        Database::ensureTransactionSchema(conn);

        std::string uid = std::to_string(userId);

        auto scalarQuery = [&](const std::string& sql, double& out) {
            out = 0.0;
            if (mysql_query(conn, sql.c_str())) return;
            MYSQL_RES* res = mysql_store_result(conn);
            MYSQL_ROW row = res ? mysql_fetch_row(res) : nullptr;
            if (row && row[0]) out = std::stod(row[0]);
            if (res) mysql_free_result(res);
        };

        double pendingAmount = 0;
        double paidAmount = 0;
        int overdueBooks = 0;
        int pendingCount = 0;

        scalarQuery(
            "SELECT COALESCE(SUM(fine), 0) FROM transactions "
            "WHERE user_id=" + uid +
            " AND fine > 0 AND COALESCE(payment_status, 'PENDING') != 'PAID'",
            pendingAmount
        );

        scalarQuery(
            "SELECT COALESCE(SUM(fine), 0) FROM transactions "
            "WHERE user_id=" + uid +
            " AND fine > 0 AND payment_status='PAID'",
            paidAmount
        );

        if (mysql_query(conn,
            ("SELECT COUNT(*) FROM transactions WHERE user_id=" + uid +
             " AND status='issued' AND issue_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)")
                .c_str()) == 0) {
            MYSQL_RES* res = mysql_store_result(conn);
            MYSQL_ROW row = res ? mysql_fetch_row(res) : nullptr;
            if (row && row[0]) overdueBooks = std::stoi(row[0]);
            if (res) mysql_free_result(res);
        }

        if (mysql_query(conn,
            ("SELECT COUNT(*) FROM transactions WHERE user_id=" + uid +
             " AND fine > 0 AND COALESCE(payment_status, 'PENDING') != 'PAID'")
                .c_str()) == 0) {
            MYSQL_RES* res = mysql_store_result(conn);
            MYSQL_ROW row = res ? mysql_fetch_row(res) : nullptr;
            if (row && row[0]) pendingCount = std::stoi(row[0]);
            if (res) mysql_free_result(res);
        }

        Database::close(conn);

        crow::json::wvalue response;
        response["pendingAmount"] = pendingAmount;
        response["paidAmount"] = paidAmount;
        response["overdueBooks"] = overdueBooks;
        response["overallPaymentStatus"] = pendingCount > 0 ? "PENDING" : "PAID";
        response["hasUnpaidFines"] = pendingCount > 0;

        return api_utils::jsonRes(200, response);
    });

    CROW_ROUTE(app, "/api/student/fines")
    .methods("GET"_method)
    ([](const crow::request& req) {
        int userId = 0;
        std::string role;
        if (!authUserId(req, userId, role)) {
            return api_utils::errRes(401, "Unauthorized");
        }

        MYSQL* conn = Database::connect();
        if (!conn) return api_utils::errRes(500, "Database connection failed");

        Database::ensureTransactionSchema(conn);

        std::string query =
            "SELECT t.id, t.book_id, t.issue_date, t.return_date, "
            "DATE_ADD(t.issue_date, INTERVAL 7 DAY) AS due_date, "
            "t.fine, t.status, "
            "COALESCE(t.payment_status, 'PENDING'), "
            "t.payment_method, t.payment_date, "
            "b.title, b.author, b.category, "
            "GREATEST(0, DATEDIFF(COALESCE(t.return_date, CURDATE()), t.issue_date) - 7) AS late_days "
            "FROM transactions t "
            "JOIN books b ON b.id = t.book_id "
            "WHERE t.user_id=" + std::to_string(userId) +
            " AND (t.fine > 0 OR t.status='payment_pending' "
            "OR (t.status='issued' AND t.issue_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY))) "
            "ORDER BY t.id DESC";

        if (mysql_query(conn, query.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return api_utils::errRes(500, err);
        }

        crow::json::wvalue response;
        response["fines"] = crow::json::wvalue::list();

        MYSQL_RES* result = mysql_store_result(conn);
        MYSQL_ROW row;
        int index = 0;

        while (result && (row = mysql_fetch_row(result))) {
            crow::json::wvalue item;
            item["id"] = std::stoi(row[0]);
            item["bookId"] = std::stoi(row[1]);
            item["issueDate"] = row[2] ? row[2] : "";
            item["returnDate"] = row[3] ? row[3] : "";
            item["dueDate"] = row[4] ? row[4] : "";
            item["fine"] = row[5] ? std::stod(row[5]) : 0.0;
            item["status"] = row[6] ? row[6] : "";
            item["paymentStatus"] = row[7] ? row[7] : "PENDING";
            item["paymentMethod"] = row[8] ? row[8] : "";
            item["paymentDate"] = row[9] ? row[9] : "";
            item["bookTitle"] = row[10] ? row[10] : "";
            item["bookAuthor"] = row[11] ? row[11] : "";
            item["bookCategory"] = row[12] ? row[12] : "";
            item["coverImage"] = "";
            item["lateDays"] = row[13] ? std::stoi(row[13]) : 0;

            response["fines"][index++] = std::move(item);
        }

        if (result) mysql_free_result(result);
        Database::close(conn);

        return api_utils::jsonRes(200, response);
    });

    CROW_ROUTE(app, "/api/student/has-unpaid-fines")
    .methods("GET"_method)
    ([](const crow::request& req) {
        int userId = 0;
        std::string role;
        if (!authUserId(req, userId, role)) {
            return api_utils::errRes(401, "Unauthorized");
        }

        MYSQL* conn = Database::connect();
        if (!conn) return api_utils::errRes(500, "Database connection failed");

        Database::ensureTransactionSchema(conn);

        std::string query =
            "SELECT COUNT(*) FROM transactions WHERE user_id=" +
            std::to_string(userId) +
            " AND fine > 0 AND COALESCE(payment_status, 'PENDING') != 'PAID'";

        bool hasUnpaid = false;
        if (mysql_query(conn, query.c_str()) == 0) {
            MYSQL_RES* res = mysql_store_result(conn);
            MYSQL_ROW row = res ? mysql_fetch_row(res) : nullptr;
            if (row && row[0]) hasUnpaid = std::stoi(row[0]) > 0;
            if (res) mysql_free_result(res);
        }

        Database::close(conn);

        crow::json::wvalue response;
        response["hasUnpaidFines"] = hasUnpaid;
        return api_utils::jsonRes(200, response);
    });
}
