#include <crow.h>

#include "api/routes.h"
#include "env_loader.h"

// ========================================
// CUSTOM CORS MIDDLEWARE
// ========================================

struct CORSMiddleware {

    struct context {};

    void before_handle(

        crow::request& req,
        crow::response& res,
        context& ctx

    ) {

        // ========================================
        // CORS HEADERS
        // ========================================

        res.set_header(
            "Access-Control-Allow-Origin",
            "http://localhost:3000"
        );

        res.set_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );

        res.set_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );

        // ========================================
        // HANDLE PREFLIGHT REQUEST
        // ========================================

        if (
            req.method ==
            crow::HTTPMethod::Options
        ) {

            res.code = 204;

            res.end();
        }
    }

    void after_handle(

        crow::request& req,
        crow::response& res,
        context& ctx

    ) {

        // ========================================
        // ADD CORS HEADERS TO ALL RESPONSES
        // ========================================

        res.set_header(
            "Access-Control-Allow-Origin",
            "http://localhost:3000"
        );

        res.set_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );

        res.set_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
    }
};

// ========================================
// MAIN FUNCTION
// ========================================

int main() {

    // ========================================
    // LOAD ENVIRONMENT VARIABLES
    // ========================================

    loadEnvironmentFiles();

    // ========================================
    // CREATE APP
    // ========================================

    crow::App<CORSMiddleware> app;

    app.loglevel(
        crow::LogLevel::Info
    );

    // ========================================
    // ROOT ROUTE
    // ========================================

    CROW_ROUTE(app, "/")
    ([]() {

        return crow::response(
            200,
            "Library API Running"
        );
    });

    // ========================================
    // FAVICON ROUTE
    // ========================================

    CROW_ROUTE(app, "/favicon.ico")
    ([]() {

        crow::response res;

        res.code = 204;

        return res;
    });

    // ========================================
    // REGISTER ALL ROUTES
    // ========================================

    registerRoutes(app);

    // ========================================
    // START SERVER
    // ========================================

    std::cout
        << "Starting backend..."
        << std::endl;

    app

        .port(18080)

        .multithreaded()

        .run();

    return 0;
}