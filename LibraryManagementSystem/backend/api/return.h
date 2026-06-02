#pragma once

#include "crow.h"
#include "db.h"
#include "common.h"

#include <mysql.h>
#include <string>

namespace {

int calculateFine(int daysKept) {
    return daysKept > 7 ? (daysKept - 7) * 5 : 0;
}

bool paymentColumnsReady(MYSQL* conn) {
    Database::ensureTransactionSchema(conn);
    return true;
}

} // namespace

template<typename App>
void registerReturnRoutes(App& app) {

    CROW_ROUTE(app, "/api/return")
    .methods("POST"_method)
    ([](const crow::request& req){

        auto body = crow::json::load(req.body);

        if (!body) {
            return crow::response(400, "Invalid JSON");
        }

        int transactionId = body["transactionId"].i();
        std::string returnDate = body["returnDate"].s();
        int daysKept = body["daysKept"].i();

        int fine = calculateFine(daysKept);

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(500, "Database connection failed");
        }

        std::string query =
            "SELECT book_id, COALESCE(payment_status, 'PENDING'), status "
            "FROM transactions "
            "WHERE id=" + std::to_string(transactionId) +
            " AND status='issued'";

        if (mysql_query(conn, query.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return crow::response(500, err);
        }

        MYSQL_RES* result = mysql_store_result(conn);

        if (!result) {
            Database::close(conn);
            return crow::response(500, "Query failed");
        }

        MYSQL_ROW row = mysql_fetch_row(result);

        if (!row) {
            mysql_free_result(result);
            Database::close(conn);
            return crow::response(404, "Transaction not found or already returned");
        }

        int bookId = std::stoi(row[0]);
        mysql_free_result(result);

        std::string updateBookQuery =
            "UPDATE books SET available = available + 1 WHERE id=" +
            std::to_string(bookId);

        if (mysql_query(conn, updateBookQuery.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return crow::response(500, err);
        }

        std::string updateTransactionQuery;

        if (fine > 0) {
            updateTransactionQuery =
                "UPDATE transactions SET "
                "return_date='" + returnDate + "', "
                "fine=" + std::to_string(fine) + ", "
                "status='payment_pending', "
                "payment_status='PENDING', "
                "payment_method=NULL, "
                "payment_date=NULL "
                "WHERE id=" + std::to_string(transactionId);
        } else {
            updateTransactionQuery =
                "UPDATE transactions SET "
                "return_date='" + returnDate + "', "
                "status='returned', "
                "fine=0";

            if (paymentColumnsReady(conn)) {
                updateTransactionQuery += ", payment_status='PAID', payment_method='NONE'";
            }

            updateTransactionQuery +=
                " WHERE id=" + std::to_string(transactionId);
        }

        if (mysql_query(conn, updateTransactionQuery.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return crow::response(500, err);
        }

        Database::close(conn);

        crow::json::wvalue response;
        response["fine"] = fine;
        response["paymentStatus"] = fine > 0 ? "PENDING" : "PAID";
        response["transactionStatus"] = fine > 0 ? "payment_pending" : "returned";
        response["message"] = fine > 0
            ? "Book received. Fine pending — student must pay before return is finalized."
            : "Book returned successfully";

        return api_utils::jsonRes(200, response);
    });

    CROW_ROUTE(app, "/api/return/complete")
    .methods("POST"_method)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return crow::response(400, "Invalid JSON");

        int transactionId = body["transactionId"].i();
        if (transactionId <= 0) return crow::response(400, "transactionId is required");

        MYSQL* conn = Database::connect();
        if (!conn) return crow::response(500, "Database connection failed");

        Database::ensureTransactionSchema(conn);

        std::string query =
            "SELECT status, COALESCE(payment_status, 'PENDING'), fine "
            "FROM transactions WHERE id=" + std::to_string(transactionId);

        if (mysql_query(conn, query.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return crow::response(500, err);
        }

        MYSQL_RES* result = mysql_store_result(conn);
        MYSQL_ROW row = result ? mysql_fetch_row(result) : nullptr;

        if (!row) {
            if (result) mysql_free_result(result);
            Database::close(conn);
            return crow::response(404, "Transaction not found");
        }

        std::string status = row[0] ? row[0] : "";
        std::string paymentStatus = row[1] ? row[1] : "PENDING";
        double fine = row[2] ? std::stod(row[2]) : 0.0;
        mysql_free_result(result);

        if (status != "payment_pending") {
            Database::close(conn);
            crow::json::wvalue errBody;
            errBody["error"] = "Transaction is not awaiting payment verification";
            return api_utils::jsonRes(409, errBody);
        }

        if (fine > 0 && paymentStatus != "PAID") {
            Database::close(conn);
            crow::json::wvalue blocked;
            blocked["error"] = "Student payment not completed yet";
            blocked["paymentStatus"] = paymentStatus;
            blocked["requiresPayment"] = true;
            return api_utils::jsonRes(402, blocked);
        }

        std::string completeQuery =
            "UPDATE transactions SET status='returned' WHERE id=" +
            std::to_string(transactionId);

        if (mysql_query(conn, completeQuery.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return crow::response(500, err);
        }

        Database::close(conn);

        crow::json::wvalue response;
        response["message"] = "Return verified and transaction completed";
        response["paymentStatus"] = paymentStatus;
        response["transactionStatus"] = "returned";
        return api_utils::jsonRes(200, response);
    });
}
