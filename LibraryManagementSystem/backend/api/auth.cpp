#include "crow.h"
#include "jwt.h"
#include "db.h"

#include <mysql.h>
#include <string>

template<typename App>
void registerAuthRoutes(App& app) {

    // =========================
    // LOGIN API
    // =========================
    CROW_ROUTE(app, "/api/login")
    .methods("POST"_method)
    ([](const crow::request& req){

        auto body = crow::json::load(req.body);

        if (!body) {
            return crow::response(400, "Invalid JSON");
        }

        std::string username = body["username"].s();
        std::string password = body["password"].s();

        std::cout
           << "USERNAME: "
           << username
           << std::endl;

         std::cout
            << "PASSWORD: "
            << password
            << std::endl;

        if (username.empty() || password.empty()) {
            return crow::response(400, "Missing credentials");
        }


        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(500, "Database connection failed");
        }
        
        std::string query =
            "SELECT role FROM users WHERE username='" +
            username +
            "' AND password='" +
            password +
            "'";


            std::cout
            << query
            << std::endl;
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

        if (row) {

            std::string role = row[0];

            std::string token =
                Jwt::generateToken(username, role);

            crow::json::wvalue response;

            response["token"] = token;
            response["username"] = username;
            response["role"] = role;

            mysql_free_result(result);

            Database::close(conn);

            crow::response res;

            res.code = 200;

            res.set_header(
                "Content-Type",
                "application/json"
            );

            res.write(response.dump());

            return res;

        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(401, "Invalid username or password");
    });

    // =========================
    // REGISTER API
    // =========================
    CROW_ROUTE(app, "/api/register")
    .methods("POST"_method)
    ([](const crow::request& req){

        auto body = crow::json::load(req.body);

        if (!body) {
            return crow::response(400, "Invalid JSON");
        }

        std::string username = body["username"].s();
        std::string password = body["password"].s();
        std::string role = body["role"].s();

        if (username.empty() ||
            password.empty() ||
            role.empty()) {

            return crow::response(400, "Missing fields");
        }

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(500, "Database connection failed");
        }

        std::string checkQuery =
            "SELECT id FROM users WHERE username='" +
            username +
            "'";

        if (mysql_query(conn, checkQuery.c_str())) {

            std::string err = mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        MYSQL_RES* checkResult =
            mysql_store_result(conn);

        if (!checkResult) {

            Database::close(conn);

            return crow::response(500, "Query failed");
        }

        MYSQL_ROW existingRow =
            mysql_fetch_row(checkResult);

        if (existingRow) {

            mysql_free_result(checkResult);

            Database::close(conn);

            return crow::response(
                409,
                "Username already exists"
            );
        }

        mysql_free_result(checkResult);

        std::string insertQuery =
            "INSERT INTO users "
            "(username, password, role) VALUES ('" +
            username + "', '" +
            password + "', '" +
            role + "')";

        if (mysql_query(conn, insertQuery.c_str())) {

            std::string err = mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        Database::close(conn);

        return crow::response(201, "User registered");
    });

    // =========================
    // CURRENT USER API
    // =========================
    CROW_ROUTE(app, "/api/me")
    .methods("GET"_method)
    ([](const crow::request& req){

        auto auth =
            req.get_header_value("Authorization");

        if (auth.empty()) {
            return crow::response(
                401,
                "Missing Authorization header"
            );
        }

        const std::string prefix = "Bearer ";

        if (auth.rfind(prefix, 0) != 0) {
            return crow::response(
                400,
                "Invalid Authorization header"
            );
        }

        std::string token =
            auth.substr(prefix.size());

        if (!Jwt::verifyToken(token)) {
            return crow::response(401, "Invalid token");
        }

        auto decoded = Jwt::decodeToken(token);

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(500, "Database connection failed");
        }

        std::string query =
            "SELECT id, username, role "
            "FROM users WHERE username='" +
            decoded.username +
            "'";

        if (mysql_query(conn, query.c_str())) {

            std::string err = mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        if (!result) {

            Database::close(conn);

            return crow::response(500, "Query failed");
        }

        MYSQL_ROW row =
            mysql_fetch_row(result);

        if (row) {

            crow::json::wvalue response;

            response["id"] = std::stoi(row[0]);
            response["username"] = row[1];
            response["role"] = row[2];

            mysql_free_result(result);

            Database::close(conn);

            crow::response res;

           res.code = 200;

           res.set_header(
               "Content-Type",
               "application/json"
            );

            res.write(response.dump());

           return res;

        }

        mysql_free_result(result);

        Database::close(conn);

        return crow::response(404, "User not found");
    });

    // =========================
    // USERS LIST API
    // =========================
    CROW_ROUTE(app, "/api/users")
    .methods("GET"_method)
    ([](const crow::request& req){

        auto auth =
            req.get_header_value("Authorization");

        if (auth.empty()) {
            return crow::response(
                401,
                "Missing Authorization header"
            );
        }

        const std::string prefix = "Bearer ";

        if (auth.rfind(prefix, 0) != 0) {
            return crow::response(
                400,
                "Invalid Authorization header"
            );
        }

        std::string token =
            auth.substr(prefix.size());

        if (!Jwt::verifyToken(token)) {
            return crow::response(401, "Invalid token");
        }

        auto decoded = Jwt::decodeToken(token);

        if (decoded.role != "admin") {
            return crow::response(
                403,
                "Admin role required"
            );
        }

        MYSQL* conn = Database::connect();

        if (!conn) {
            return crow::response(500, "Database connection failed");
        }

        std::string query =
            "SELECT id, username, role FROM users";

        if (mysql_query(conn, query.c_str())) {

            std::string err = mysql_error(conn);

            Database::close(conn);

            return crow::response(500, err);
        }

        MYSQL_RES* result =
            mysql_store_result(conn);

        if (!result) {

            Database::close(conn);

            return crow::response(500, "Query failed");
        }

        crow::json::wvalue response;
        response["users"] = crow::json::wvalue::list();

        MYSQL_ROW row;

        int index = 0;

        while ((row = mysql_fetch_row(result))) {

            crow::json::wvalue user;

            user["id"] = std::stoi(row[0]);
            user["username"] = row[1];
            user["role"] = row[2];

            response["users"][index++] = std::move(user);
        }

        mysql_free_result(result);

        Database::close(conn);


        crow::response res;

        res.code = 200;

        res.set_header(
             "Content-Type",
              "application/json"
        );

          res.write(response.dump());

          return res;

    });
}