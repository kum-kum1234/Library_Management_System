#include "crow.h"
#include "db.h"

#include <mysql.h>
#include <string>

template<typename App>
void registerIssueRoutes(App& app) {

    CROW_ROUTE(app, "/api/issue")
    .methods("POST"_method)
    ([](const crow::request& req){

        auto body = crow::json::load(req.body);

        if (!body) {
            return crow::response(400, "Invalid JSON");
        }

        int bookId =
            body["bookId"].i();

        int userId =
            body["userId"].i();

        std::string issueDate =
            body["issueDate"].s();

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(
                500,
                "Database connection failed"
            );
        }

        // =========================
        // CHECK BOOK AVAILABILITY
        // =========================

        std::string checkQuery =
            "SELECT available FROM books WHERE id=" +
            std::to_string(bookId);

        if (mysql_query(conn, checkQuery.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        if (!result) {

            Database::close(conn);

            return crow::response(
                500,
                "Query failed"
            );
        }

        MYSQL_ROW row =
            mysql_fetch_row(result);

        if (!row) {

            mysql_free_result(result);

            Database::close(conn);

            return crow::response(
                404,
                "Book not found"
            );
        }

        int available =
            std::stoi(row[0]);

        mysql_free_result(result);

        if (available <= 0) {

            Database::close(conn);

            return crow::response(
                409,
                "Book is not available"
            );
        }

        Database::ensureTransactionSchema(conn);

        std::string finesQuery =
            "SELECT COUNT(*) FROM transactions WHERE user_id=" +
            std::to_string(userId) +
            " AND fine > 0 AND COALESCE(payment_status, 'PENDING') != 'PAID'";

        if (mysql_query(conn, finesQuery.c_str()) == 0) {
            MYSQL_RES* finesRes = mysql_store_result(conn);
            MYSQL_ROW finesRow = finesRes ? mysql_fetch_row(finesRes) : nullptr;
            if (finesRow && finesRow[0] && std::stoi(finesRow[0]) > 0) {
                if (finesRes) mysql_free_result(finesRes);
                Database::close(conn);
                crow::json::wvalue blocked;
                blocked["error"] =
                    "Please clear pending fines before issuing new books.";
                blocked["hasUnpaidFines"] = true;
                crow::response res(403, blocked);
                res.set_header("Content-Type", "application/json");
                res.set_header("Access-Control-Allow-Origin", "*");
                return res;
            }
            if (finesRes) mysql_free_result(finesRes);
        }

        // =========================
        // UPDATE AVAILABLE COUNT
        // =========================

        std::string updateQuery =
            "UPDATE books SET available = available - 1 "
            "WHERE id=" +
            std::to_string(bookId);

        if (mysql_query(conn, updateQuery.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        // =========================
        // CREATE TRANSACTION
        // =========================

        std::string transactionQuery =
            "INSERT INTO transactions "
            "(user_id, book_id, issue_date, status) "
            "VALUES (" +
            std::to_string(userId) + ", " +
            std::to_string(bookId) + ", '" +
            issueDate + "', 'issued')";

        if (mysql_query(conn, transactionQuery.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        Database::close(conn);

        return crow::response(
            200,
            "Book issued successfully"
        );
    });
}