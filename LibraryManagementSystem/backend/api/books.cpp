#include "crow.h"
#include "db.h"
#include "books.h"

#include <mysql.h>
#include <string>

template<typename App>
void registerBookRoutes(App& app){

    // =========================
    // GET ALL BOOKS
    // =========================

    CROW_ROUTE(app, "/api/books")
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
            "SELECT id, title, author, category, thumbnail, quantity, available FROM books";

        if (mysql_query(conn, query.c_str())) {

            std::string err = mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        if (!result) {

            Database::close(conn);

            return crow::response(
                500,
                "Failed to fetch books"
            );
        }

        crow::json::wvalue response;

        response["books"] =
            crow::json::wvalue::list();

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            BookModel book;

            book.id = std::stoi(row[0]);

            book.title = row[1];

            book.author = row[2];

            book.category = row[3];

            book.thumbnail =
                row[4] ? row[4] : "";

            book.quantity =
                std::stoi(row[5]);

            book.available =
                std::stoi(row[6]);

            response["books"][index++] =
                book.toJson();
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(200, response);
    });

    // =========================
    // GET SINGLE BOOK
    // =========================

    CROW_ROUTE(app, "/api/books/<int>")
    .methods("GET"_method)
    ([](int id){

        MYSQL* conn = Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "SELECT id, title, author, category, thumbnail, quantity, available "
            "FROM books WHERE id=" +
            std::to_string(id);

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

        if (!row) {

            mysql_free_result(result);

            Database::close(conn);

            return crow::response(
                404,
                "Book not found"
            );
        }

        BookModel book;

        book.id = std::stoi(row[0]);

        book.title = row[1];

        book.author = row[2];

        book.category = row[3];

        book.thumbnail =
            row[4] ? row[4] : "";

        book.quantity =
            std::stoi(row[5]);

        book.available =
            std::stoi(row[6]);

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(
            200,
            book.toJson()
        );
    });

    // =========================
    // CREATE BOOK
    // =========================

    CROW_ROUTE(app, "/api/books")
    .methods("POST"_method)
    ([](const crow::request& req){

        auto body =
            crow::json::load(req.body);

        if (!body) {

            return crow::response(
                400,
                "Invalid JSON"
            );
        }

        std::string title =
            body["title"].s();

        std::string author =
            body["author"].s();

        std::string category =
            body["category"].s();

        std::string thumbnail =
            body["thumbnail"].s();

        int quantity =
            body["quantity"].i();

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "INSERT INTO books "
            "(title, author, category, thumbnail, quantity, available) "
            "VALUES ('" +
            title + "', '" +
            author + "', '" +
            category + "', '" +
            thumbnail + "', " +
            std::to_string(quantity) + ", " +
            std::to_string(quantity) + ")";

        if (mysql_query(conn, query.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
        }

        Database::close(conn);

        return crow::response(
            201,
            "Book created"
        );
    });

    // =========================
    // UPDATE BOOK
    // =========================

    CROW_ROUTE(app, "/api/books/<int>")
    .methods("PUT"_method)
    ([](const crow::request& req, int id){

        auto body =
            crow::json::load(req.body);

        if (!body) {

            return crow::response(
                400,
                "Invalid JSON"
            );
        }

        std::string title =
            body["title"].s();

        std::string author =
            body["author"].s();

        std::string category =
            body["category"].s();

        std::string thumbnail =
            body["thumbnail"].s();

        int quantity =
            body["quantity"].i();

        int available =
            body["available"].i();

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "UPDATE books SET "
            "title='" + title +
            "', author='" + author +
            "', category='" + category +
            "', thumbnail='" + thumbnail +
            "', quantity=" + std::to_string(quantity) +
            ", available=" + std::to_string(available) +
            " WHERE id=" + std::to_string(id);

        if (mysql_query(conn, query.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
        }

        Database::close(conn);

        return crow::response(
            200,
            "Book updated"
        );
    });

    // =========================
    // DELETE BOOK
    // =========================

    CROW_ROUTE(app, "/api/books/<int>")
    .methods("DELETE"_method)
    ([](int id){

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "DELETE FROM books WHERE id=" +
            std::to_string(id);

        if (mysql_query(conn, query.c_str())) {

            std::string err =
                mysql_error(conn);

            Database::close(conn);

            return crow::response(
                500,
                err
            );
        }

        Database::close(conn);

        return crow::response(
            200,
            "Book deleted"
        );
    });

    // =========================
    // SEARCH BOOKS
    // =========================

    CROW_ROUTE(app, "/api/books/search")
    .methods("GET"_method)
    ([](const crow::request& req){

        auto q =
            req.url_params.get("q");

        if (!q) {

            return crow::response(
                400,
                "Missing search query"
            );
        }

        MYSQL* conn =
            Database::connect();

        if (!conn) {

            return crow::response(
                500,
                "Database connection failed"
            );
        }

        std::string query =
            "SELECT id, title, author, category, thumbnail, quantity, available "
            "FROM books WHERE "
            "title LIKE '%" + std::string(q) +
            "%' OR author LIKE '%" +
            std::string(q) + "%'";

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

        response["books"] =
            crow::json::wvalue::list();

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            BookModel book;

            book.id = std::stoi(row[0]);

            book.title = row[1];

            book.author = row[2];

            book.category = row[3];

            book.thumbnail =
                row[4] ? row[4] : "";

            book.quantity =
                std::stoi(row[5]);

            book.available =
                std::stoi(row[6]);

            response["books"][index++] =
                book.toJson();
        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(
            200,
            response
        );
    });
    // =========================
// LOW STOCK ALERT API
// =========================

CROW_ROUTE(app, "/api/books/low-stock")
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
        "SELECT id, title, author, available "
        "FROM books "
        "WHERE available < 3";

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

    response["books"] =
        crow::json::wvalue::list();

    MYSQL_ROW row;

    int index = 0;

    while ((row = mysql_fetch_row(result))) {

        crow::json::wvalue book;

        book["id"] =
            std::stoi(row[0]);

        book["title"] =
            row[1];

        book["author"] =
            row[2];

        book["available"] =
            std::stoi(row[3]);

        response["books"][index++] =
            std::move(book);
    }

    mysql_free_result(result);

    Database::close(conn);

    crow::response res;

    res.code = 200;

    res.set_header(
        "Content-Type",
        "application/json"
    );

    res.write(
        response.dump()
    );

    return res;
});
}