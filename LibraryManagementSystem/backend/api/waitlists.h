#pragma once
#include <iostream>
#include <crow.h>
#include "./db.h"

template<typename App>
void registerWaitlistRoutes(App& app) {
    std::cout
        << "REGISTERING WAITLIST ROUTES"
        << std::endl;

    // =========================
    // GET ALL WAITLISTS
    // =========================

    CROW_ROUTE(app, "/api/waitlists")
    .methods("GET"_method)
    ([]() {

        MYSQL* conn = Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "SELECT * FROM waitlists";

        if (mysql_query(conn, query.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
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

        crow::json::wvalue response;

        response["waitlists"] =
            crow::json::wvalue::list();

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            crow::json::wvalue item;

            item["id"] =
                std::stoi(row[0]);

            item["user_id"] =
                std::stoi(row[1]);

            item["book_id"] =
                std::stoi(row[2]);

            item["status"] =
                row[3];

            response["waitlists"][index++] =
                std::move(item);
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(
            200,
            response
        );
    });
    // =========================
// ADD TO WAITLIST
// =========================

CROW_ROUTE(app, "/api/waitlists")
.methods("POST"_method)
([](const crow::request& req) {

    std::cout
        << "WAITLIST POST HIT"
        << std::endl;

    auto body = crow::json::load(req.body);

    if (!body) {
        return crow::response(
            400,
            "Invalid JSON"
        );
    }
    int user_id =
        body["user_id"].i();

    int book_id =
        body["book_id"].i();

    MYSQL* conn =
        Database::connect();

    if (!conn) {

        return crow::response(
            500,
            "Database connection failed"
        );
    }

    std::string query =
        "INSERT INTO waitlists "
        "(user_id, book_id, status) "
        "VALUES (" +
        std::to_string(user_id) +
        "," +
        std::to_string(book_id) +
        ",'waiting')";

    if (mysql_query(
        conn,
        query.c_str()
    )) {

        std::string err =
            mysql_error(conn);

        Database::close(conn);

        return crow::response(
            500,
            err
        );
    }

    Database::close(conn);

    crow::json::wvalue res;

    res["success"] = true;

    return crow::response(
        200,
        res
    );
});

    // =========================
    // APPROVE WAITLIST
    // =========================

    CROW_ROUTE(app,
        "/api/waitlists/<int>/approve")
    .methods("PUT"_method)

    ([](int id) {

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "UPDATE waitlists "
            "SET status='reserved' "
            "WHERE id=" +
            std::to_string(id);

        if (mysql_query(
            conn,
            query.c_str()
        )) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
        }

        Database::close(conn);

        crow::json::wvalue res;

        res["success"] = true;

        return crow::response(
            200,
            res
        );
    });

    // =========================
    // NOTIFY STUDENT
    // =========================

    CROW_ROUTE(app,
        "/api/waitlists/<int>/notify")
    .methods("PUT"_method)

    ([](int id) {

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "UPDATE waitlists "
            "SET status='notified' "
            "WHERE id=" +
            std::to_string(id);

        if (mysql_query(
            conn,
            query.c_str()
        )) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
        }

        Database::close(conn);

        crow::json::wvalue res;

        res["success"] = true;

        return crow::response(
            200,
            res
        );
    });

    // =========================
    // DELETE WAITLIST
    // =========================

    CROW_ROUTE(app,
        "/api/waitlists/<int>")
    .methods("DELETE"_method)

    ([](int id) {

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "DELETE FROM waitlists "
            "WHERE id=" +
            std::to_string(id);

        if (mysql_query(
            conn,
            query.c_str()
        )) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
        }

        Database::close(conn);

        crow::json::wvalue res;

        res["success"] = true;

        return crow::response(
            200,
            res
        );
    });
}