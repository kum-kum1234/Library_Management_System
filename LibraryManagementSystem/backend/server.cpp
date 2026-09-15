#include <crow.h>

#include "api/routes.h"
#include "env_loader.h"

// ========================================
// CUSTOM CORS MIDDLEWARE
// ========================================

// ========================================
// CUSTOM CORS MIDDLEWARE
// ========================================

struct CORSMiddleware {

    struct context {};

    void set_cors_headers(
        crow::request& req,
        crow::response& res
    ) {

        std::string origin = req.get_header_value("Origin");

        // Your current production frontend
        const std::string productionOrigin =
            "https://library-management-system-gules-eta.vercel.app";

        // Allow local development + production Vercel frontend
        if (
            origin == "http://localhost:3000" ||
            origin == "http://localhost:5173" ||
            origin == productionOrigin
        ) {
            res.set_header(
                "Access-Control-Allow-Origin",
                origin
            );
        }

        res.set_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );

        res.set_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );

        res.set_header(
            "Access-Control-Allow-Credentials",
            "true"
        );
    }

    void before_handle(
        crow::request& req,
        crow::response& res,
        context& ctx
    ) {

        set_cors_headers(req, res);

        // Handle browser CORS preflight request
        if (req.method == crow::HTTPMethod::Options) {

            res.code = 204;
            res.end();

            return;
        }
    }

    void after_handle(
        crow::request& req,
        crow::response& res,
        context& ctx
    ) {

        set_cors_headers(req, res);
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