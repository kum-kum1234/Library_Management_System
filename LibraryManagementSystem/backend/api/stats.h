#pragma once

#include "crow.h"
#include "db.h"

#include <mysql.h>
#include <string>

template<typename App>
void registerStatsRoutes(App& app) {

    CROW_ROUTE(app, "/api/stats")
    .methods("GET"_method)
    ([](){

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "SELECT "
            "(SELECT COUNT(*) FROM users) AS totalUsers, "
            "(SELECT COUNT(*) FROM books) AS totalBooks, "
            "(SELECT COUNT(*) FROM transactions "
            "WHERE status='issued') AS activeTransactions";

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

        MYSQL_ROW row =
            mysql_fetch_row(result);

        crow::json::wvalue response;

        if (row) {

            response["totalUsers"] =
                std::stoi(row[0]);

            response["totalBooks"] =
                std::stoi(row[1]);

            response["activeTransactions"] =
                std::stoi(row[2]);
        }
        else {

            response["totalUsers"] = 0;
            response["totalBooks"] = 0;
            response["activeTransactions"] = 0;
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(200, response);
    });
}
