#include <crow.h>

#include "api/routes.h"
#include "env_loader.h"

// ========================================
// CUSTOM CORS MIDDLEWARE
// ========================================

struct CORSMiddleware {

    struct context {};

    void set_cors_headers(crow::request& req, crow::response& res) {
        std::string origin = req.get_header_value("Origin");
        
        // Dynamically allow localhost or any Vercel deployment domain ending with .vercel.app
        if (origin == "http://localhost:3000" || (origin.length() >= 11 && origin.compare(origin.length() - 11, 11, ".vercel.app") == 0)) {
            res.set_header("Access-Control-Allow-Origin", origin);
        } else {
            // Default fallback for safety
            res.set_header("Access-Control-Allow-Origin", "https://library-management-system-g5f6.vercel.app");
        }

        res.set_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );

        res.set_header(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
    }

    void before_handle(
        crow::request& req,
        crow::response& res,
        context& ctx
    ) {
        set_cors_headers(req, res);

        if (
            req.method ==
            crow::HTTPMethod::Options
        ) {
            res.code = 200;
            res.end();
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