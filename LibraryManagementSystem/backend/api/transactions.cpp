#include "crow.h"
#include "db.h"

#include <mysql.h>
#include <string>

template<typename App>
void registerTransactionRoutes(App& app) {

    CROW_ROUTE(app, "/api/transactions")
    .methods("GET"_method)
    ([](){

        crow::json::wvalue response;

        response["transactions"] =
            crow::json::wvalue::list();

        MYSQL* conn = Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        Database::ensureTransactionSchema(conn);

        std::string query =
            "SELECT "
            "id, "
            "user_id, "
            "book_id, "
            "issue_date, "
            "return_date, "
            "status, "
            "fine, "
            "COALESCE(payment_status, 'PENDING'), "
            "payment_method, "
            "stripe_payment_id, "
            "payment_date "
            "FROM transactions "
            "ORDER BY id DESC";

        if (mysql_query(conn, query.c_str())) {

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

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            crow::json::wvalue item;

            item["id"] =
                std::stoi(row[0]);

            item["userId"] =
                std::stoi(row[1]);

            item["bookId"] =
                std::stoi(row[2]);

            item["issueDate"] =
                row[3] ? row[3] : "";

            item["returnDate"] =
                row[4] ? row[4] : "";

            item["status"] =
                row[5] ? row[5] : "";

            item["fine"] =
                row[6] ? std::stod(row[6]) : 0.0;

            item["paymentStatus"] =
                row[7] ? row[7] : "PENDING";

            item["paymentMethod"] =
                row[8] ? row[8] : "";

            item["stripePaymentId"] =
                row[9] ? row[9] : "";

            item["paymentDate"] =
                row[10] ? row[10] : "";

            response["transactions"][index++] =
                std::move(item);
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(200, response);
    });
}