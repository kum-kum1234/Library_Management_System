#pragma once

#include <crow.h>
#include "db.h"
#include "jwt.h"

template<typename App>
void registerReservationRoutes(App& app)
{
    // ========================================
    // CREATE RESERVATION
    // ========================================

    CROW_ROUTE(app, "/api/reservations")
    .methods("POST"_method)

    ([](const crow::request& req) {

        auto body = crow::json::load(req.body);

        if (!body) {
            return crow::response(
                400,
                "Invalid JSON"
            );
        }

        int user_id = body["user_id"].i();
        int book_id = body["book_id"].i();

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(
                500,
                "Database connection failed"
            );
        }

        // ========================================
        // CHECK IF BOOK EXISTS
        // ========================================

        std::string checkBookQuery =
            "SELECT available FROM books WHERE id=" +
            std::to_string(book_id);

        if (mysql_query(conn, checkBookQuery.c_str())) {

            Database::close(conn);

            return crow::response(
                500,
                mysql_error(conn)
            );
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        if (!result) {

            Database::close(conn);

            return crow::response(
                404,
                "Book not found"
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

        // ========================================
        // BOOK MUST BE OUT OF STOCK
        // ========================================

        if (available > 0) {

            Database::close(conn);

            return crow::response(
                400,
                "Book is available. No need to reserve."
            );
        }

        // ========================================
        // CHECK DUPLICATE RESERVATION
        // ========================================

        std::string duplicateQuery =
            "SELECT id FROM reservations "
            "WHERE user_id=" +
            std::to_string(user_id) +
            " AND book_id=" +
            std::to_string(book_id) +
            " AND status='pending'";

        if (mysql_query(conn, duplicateQuery.c_str())) {

            Database::close(conn);

            return crow::response(
                500,
                mysql_error(conn)
            );
        }

        MYSQL_RES* duplicateResult =
            mysql_store_result(conn);

        MYSQL_ROW duplicateRow =
            mysql_fetch_row(duplicateResult);

        if (duplicateRow) {

            mysql_free_result(duplicateResult);

            Database::close(conn);

            return crow::response(
                409,
                "Reservation already exists"
            );
        }

        mysql_free_result(duplicateResult);

        // ========================================
        // INSERT RESERVATION
        // ========================================

        std::string insertQuery =
            "INSERT INTO reservations "
            "(user_id, book_id, status) VALUES (" +
            std::to_string(user_id) +
            ", " +
            std::to_string(book_id) +
            ", 'pending')";

        if (mysql_query(conn, insertQuery.c_str())) {

            Database::close(conn);

            return crow::response(
                500,
                mysql_error(conn)
            );
        }

        Database::close(conn);

        return crow::response(
            201,
            "Reservation created successfully"
        );
    });

    // ========================================
    // GET ALL RESERVATIONS
    // ========================================

    CROW_ROUTE(app, "/api/reservations")
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
            "SELECT "
            "reservations.id, "
            "users.username, "
            "books.title, "
            "reservations.status, "
            "reservations.reserved_at "

            "FROM reservations "

            "JOIN users "
            "ON reservations.user_id = users.id "

            "JOIN books "
            "ON reservations.book_id = books.id "

            "ORDER BY reservations.reserved_at DESC";

        if (mysql_query(conn, query.c_str())) {

            Database::close(conn);

            return crow::response(
                500,
                mysql_error(conn)
            );
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        crow::json::wvalue response;

        response["reservations"] =
            crow::json::wvalue::list();

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            crow::json::wvalue reservation;

            reservation["id"] =
                std::stoi(row[0]);

            reservation["username"] =
                row[1];

            reservation["book_title"] =
                row[2];

            reservation["status"] =
                row[3];

            reservation["reserved_at"] =
                row[4];

            response["reservations"][index++] =
                std::move(reservation);
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(
            200,
            response
        );
    });

    // ========================================
    // APPROVE RESERVATION
    // ========================================

    CROW_ROUTE(app, "/api/reservations/<int>/approve")
    .methods("PUT"_method)

    ([](int id) {

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "UPDATE reservations "
            "SET status='approved' "
            "WHERE id=" +
            std::to_string(id);

        if (mysql_query(conn, query.c_str())) {

            std::string err = mysql_error(conn);

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

    // ========================================
    // REJECT RESERVATION
    // ========================================

    CROW_ROUTE(app, "/api/reservations/<int>/reject")
    .methods("PUT"_method)

    ([](int id) {

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "UPDATE reservations "
            "SET status='rejected' "
            "WHERE id=" +
            std::to_string(id);

        if (mysql_query(conn, query.c_str())) {

            std::string err = mysql_error(conn);

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

    // ========================================
    // GET STUDENT RESERVATIONS
    // ========================================

    CROW_ROUTE(app, "/api/student/reservations")
    .methods("GET"_method)

    ([](const crow::request& req) {

        auto authHeader = req.get_header_value("Authorization");

        if (authHeader.empty()) {
            return crow::response(
                401,
                "Authorization header missing"
            );
        }

        std::string authHeaderStr = authHeader;

        if (authHeaderStr.substr(0, 7) != "Bearer ") {
            return crow::response(
                401,
                "Invalid authorization format"
            );
        }

        std::string token = authHeaderStr.substr(7);

        if (!Jwt::verifyToken(token)) {
            return crow::response(
                401,
                "Invalid token"
            );
        }

        auto decoded = Jwt::decodeToken(token);

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string userQuery =
            "SELECT id FROM users "
            "WHERE username='" + decoded.username + "'";

        if (mysql_query(conn, userQuery.c_str())) {

            Database::close(conn);

            return crow::response(
                500,
                mysql_error(conn)
            );
        }

        MYSQL_RES* userResult =
            mysql_store_result(conn);

        if (!userResult) {

            Database::close(conn);

            return crow::response(
                401,
                "Invalid user"
            );
        }

        MYSQL_ROW userRow =
            mysql_fetch_row(userResult);

        if (!userRow) {

            mysql_free_result(userResult);

            Database::close(conn);

            return crow::response(
                401,
                "Invalid user"
            );
        }

        int user_id = std::stoi(userRow[0]);

        mysql_free_result(userResult);

        std::string query =
            "SELECT "
            "reservations.id, "
            "reservations.book_id, "
            "books.title, "
            "books.author, "
            "reservations.status, "
            "reservations.reserved_at "

            "FROM reservations "

            "JOIN books "
            "ON reservations.book_id = books.id "

            "WHERE reservations.user_id=" +
            std::to_string(user_id) +

            " ORDER BY reservations.reserved_at DESC";

        if (mysql_query(conn, query.c_str())) {

            Database::close(conn);

            return crow::response(
                500,
                mysql_error(conn)
            );
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        crow::json::wvalue response;

        response["reservations"] =
            crow::json::wvalue::list();

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            crow::json::wvalue reservation;

            reservation["id"] =
                std::stoi(row[0]);

            reservation["book_id"] =
                std::stoi(row[1]);

            reservation["title"] =
                row[2];

            reservation["author"] =
                row[3];

            reservation["status"] =
                row[4];

            reservation["reserved_at"] =
                row[5];

            response["reservations"][index++] =
                std::move(reservation);
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(
            200,
            response
        );
    });
}
