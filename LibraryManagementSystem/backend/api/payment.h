#pragma once

#include "db.h"
#include "common.h"

#include <crow.h>
#include <mysql.h>

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include <winhttp.h>
#pragma comment(lib, "winhttp.lib")
#endif

#include <cctype>
#include <cstdlib>
#include <iomanip>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>

namespace {

std::string envOr(const char* key, const char* fallback) {
    const char* v = std::getenv(key);
    return (v && v[0]) ? std::string(v) : std::string(fallback);
}

std::string urlEncode(const std::string& value) {
    static const char hex[] = "0123456789ABCDEF";
    std::ostringstream encoded;
    for (unsigned char c : value) {
        if (std::isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            encoded << c;
        } else {
            encoded << '%' << hex[c >> 4] << hex[c & 15];
        }
    }
    return encoded.str();
}

std::string buildFormBody(const std::map<std::string, std::string>& fields) {
    std::ostringstream body;
    bool first = true;
    for (const auto& [key, value] : fields) {
        if (!first) body << '&';
        first = false;
        body << urlEncode(key) << '=' << urlEncode(value);
    }
    return body.str();
}

#ifdef _WIN32

std::wstring toWide(const std::string& value) {
    if (value.empty()) return L"";
    int size = MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, nullptr, 0);
    std::wstring out(size - 1, L'\0');
    MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, out.data(), size);
    return out;
}

std::string httpRequestWin(
    const std::wstring& method,
    const std::wstring& host,
    const std::wstring& path,
    const std::wstring& authHeader,
    const std::string& body = ""
) {
    HINTERNET session = WinHttpOpen(
        L"LibraryManagement/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0
    );

    if (!session) throw std::runtime_error("WinHttpOpen failed");

    HINTERNET connect = WinHttpConnect(session, host.c_str(), INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (!connect) {
        WinHttpCloseHandle(session);
        throw std::runtime_error("WinHttpConnect failed");
    }

    HINTERNET request = WinHttpOpenRequest(
        connect,
        method.c_str(),
        path.c_str(),
        nullptr,
        WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES,
        WINHTTP_FLAG_SECURE
    );

    if (!request) {
        WinHttpCloseHandle(connect);
        WinHttpCloseHandle(session);
        throw std::runtime_error("WinHttpOpenRequest failed");
    }

    std::wstring headers = L"Authorization: Bearer " + authHeader + L"\r\n";
    if (!body.empty()) {
        headers += L"Content-Type: application/x-www-form-urlencoded\r\n";
    }

    BOOL sent = WinHttpSendRequest(
        request,
        headers.c_str(),
        static_cast<DWORD>(-1),
        body.empty() ? WINHTTP_NO_REQUEST_DATA : (LPVOID)body.data(),
        body.empty() ? 0 : static_cast<DWORD>(body.size()),
        body.empty() ? 0 : static_cast<DWORD>(body.size()),
        0
    );

    if (!sent || !WinHttpReceiveResponse(request, nullptr)) {
        WinHttpCloseHandle(request);
        WinHttpCloseHandle(connect);
        WinHttpCloseHandle(session);
        throw std::runtime_error("WinHttp request failed");
    }

    DWORD statusCode = 0;
    DWORD statusSize = sizeof(statusCode);
    WinHttpQueryHeaders(
        request,
        WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
        WINHTTP_HEADER_NAME_BY_INDEX,
        &statusCode,
        &statusSize,
        WINHTTP_NO_HEADER_INDEX
    );

    std::string response;
    DWORD available = 0;

    do {
        if (!WinHttpQueryDataAvailable(request, &available)) break;
        if (available == 0) break;

        std::string chunk(available, '\0');
        DWORD read = 0;
        if (!WinHttpReadData(request, chunk.data(), available, &read)) break;
        chunk.resize(read);
        response += chunk;
    } while (available > 0);

    WinHttpCloseHandle(request);
    WinHttpCloseHandle(connect);
    WinHttpCloseHandle(session);

    if (statusCode < 200 || statusCode >= 300) {
        throw std::runtime_error("Stripe HTTP error: " + std::to_string(statusCode) + " " + response);
    }

    return response;
}

std::string stripeRequest(
    const std::string& method,
    const std::string& url,
    const std::string& secretKey,
    const std::map<std::string, std::string>& formFields = {}
) {
    const std::string prefix = "https://";
    if (url.rfind(prefix, 0) != 0) {
        throw std::runtime_error("Only HTTPS Stripe URLs are supported");
    }

    size_t hostStart = prefix.size();
    size_t pathStart = url.find('/', hostStart);
    std::string host = pathStart == std::string::npos
        ? url.substr(hostStart)
        : url.substr(hostStart, pathStart - hostStart);
    std::string path = pathStart == std::string::npos ? "/" : url.substr(pathStart);

    std::string body;
    if (!formFields.empty()) {
        body = buildFormBody(formFields);
    }

    return httpRequestWin(
        toWide(method),
        toWide(host),
        toWide(path),
        toWide(secretKey),
        body
    );
}

#else

std::string stripeRequest(
    const std::string&,
    const std::string&,
    const std::string&,
    const std::map<std::string, std::string>&
) {
    throw std::runtime_error("Stripe HTTP client is only implemented for Windows builds");
}

#endif

std::string escapeSql(const std::string& value) {
    std::string out;
    out.reserve(value.size());
    for (char c : value) {
        if (c == '\'') out += "''";
        else if (c == '\\') out += "\\\\";
        else out += c;
    }
    return out;
}

crow::json::wvalue fetchPaymentDetails(MYSQL* conn, int transactionId) {
    Database::ensureTransactionSchema(conn);

    std::string query =
        "SELECT t.id, t.user_id, t.book_id, t.issue_date, "
        "DATE_ADD(t.issue_date, INTERVAL 7 DAY) AS due_date, "
        "t.return_date, t.fine, t.status, "
        "COALESCE(t.payment_status, 'PENDING'), "
        "t.payment_method, t.stripe_payment_id, t.payment_date, "
        "u.username, b.title "
        "FROM transactions t "
        "JOIN users u ON u.id = t.user_id "
        "JOIN books b ON b.id = t.book_id "
        "WHERE t.id = " + std::to_string(transactionId);

    if (mysql_query(conn, query.c_str())) {
        throw std::runtime_error(mysql_error(conn));
    }

    MYSQL_RES* result = mysql_store_result(conn);
    if (!result) throw std::runtime_error("Query failed");

    MYSQL_ROW row = mysql_fetch_row(result);
    if (!row) {
        mysql_free_result(result);
        throw std::runtime_error("Transaction not found");
    }

    crow::json::wvalue item;
    item["transactionId"] = std::stoi(row[0]);
    item["userId"] = std::stoi(row[1]);
    item["bookId"] = std::stoi(row[2]);
    item["issueDate"] = row[3] ? row[3] : "";
    item["dueDate"] = row[4] ? row[4] : "";
    item["returnDate"] = row[5] ? row[5] : "";
    item["fine"] = row[6] ? std::stod(row[6]) : 0.0;
    item["status"] = row[7] ? row[7] : "";
    item["paymentStatus"] = row[8] ? row[8] : "PENDING";
    item["paymentMethod"] = row[9] ? row[9] : "";
    item["stripePaymentId"] = row[10] ? row[10] : "";
    item["paymentDate"] = row[11] ? row[11] : "";
    item["studentName"] = row[12] ? row[12] : "";
    item["bookName"] = row[13] ? row[13] : "";
    item["upiId"] = envOr("UPI_ID", "library@upi");

    mysql_free_result(result);
    return item;
}

std::string stripeSecret() {
    return envOr("STRIPE_SECRET_KEY", "");
}

std::string stripeSuccessUrl() {
    return envOr("STRIPE_SUCCESS_URL", "http://localhost:3000/payment-success");
}

std::string stripeCancelUrl() {
    return envOr("STRIPE_CANCEL_URL", "http://localhost:3000/student/fines-payments");
}

constexpr double STRIPE_MIN_INR = 50.0;

std::string parseStripeErrorMessage(const std::string& raw) {
    auto pos = raw.find('{');
    if (pos == std::string::npos) return raw;

    auto json = crow::json::load(raw.substr(pos));
    if (!json) return raw;

    if (json.has("error")) {
        const auto& err = json["error"];
        if (err.has("message")) return err["message"].s();
        if (err.has("code")) return err["code"].s();
    }

    return raw;
}

int stripeErrorStatusCode(const std::string& raw) {
    const std::string prefix = "Stripe HTTP error: ";
    if (raw.rfind(prefix, 0) != 0) return 502;

    size_t codeStart = prefix.size();
    size_t codeEnd = raw.find(' ', codeStart);
    if (codeEnd == std::string::npos) return 502;

    int stripeCode = std::atoi(raw.substr(codeStart, codeEnd - codeStart).c_str());
    if (stripeCode >= 400 && stripeCode < 500) return 400;
    return 502;
}

} // namespace

template<typename App>
void registerPaymentRoutes(App& app) {

    CROW_ROUTE(app, "/api/payment/<int>")
    .methods("GET"_method)
    ([](int transactionId) {
        MYSQL* conn = Database::connect();
        if (!conn) return api_utils::errRes(500, "Database connection failed");

        try {
            auto details = fetchPaymentDetails(conn, transactionId);
            Database::close(conn);
            return api_utils::jsonRes(200, details);
        } catch (const std::exception& ex) {
            Database::close(conn);
            std::string msg = ex.what();
            int code = (msg == "Transaction not found") ? 404 : 500;
            return api_utils::errRes(code, msg);
        }
    });

    CROW_ROUTE(app, "/api/create-payment")
    .methods("POST"_method)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return api_utils::errRes(400, "Invalid JSON");

        int transactionId = body["transaction_id"].i();
        if (!transactionId && body.has("transactionId")) {
            transactionId = body["transactionId"].i();
        }

        double fineAmount = body["fine_amount"].d();
        if (fineAmount <= 0 && body.has("fineAmount")) {
            fineAmount = body["fineAmount"].d();
        }

        if (transactionId <= 0) return api_utils::errRes(400, "transaction_id is required");
        if (fineAmount <= 0) return api_utils::errRes(400, "fine_amount must be greater than 0");

        double stripeChargeAmount =
            fineAmount < STRIPE_MIN_INR ? STRIPE_MIN_INR : fineAmount;

        std::string stripeKey = stripeSecret();
        if (stripeKey.empty()) {
            return api_utils::errRes(500, "STRIPE_SECRET_KEY is not configured");
        }

        MYSQL* conn = Database::connect();
        if (!conn) return api_utils::errRes(500, "Database connection failed");

        Database::ensureTransactionSchema(conn);

        std::string statusQuery =
            "SELECT status FROM transactions WHERE id=" +
            std::to_string(transactionId);

        if (mysql_query(conn, statusQuery.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return api_utils::errRes(500, err);
        }

        MYSQL_RES* statusRes = mysql_store_result(conn);
        MYSQL_ROW statusRow = statusRes ? mysql_fetch_row(statusRes) : nullptr;

        if (!statusRow) {
            if (statusRes) mysql_free_result(statusRes);
            Database::close(conn);
            return api_utils::errRes(404, "Transaction not found");
        }

        std::string txStatus = statusRow[0] ? statusRow[0] : "";
        mysql_free_result(statusRes);

        if (txStatus != "issued" && txStatus != "ISSUED" &&
            txStatus != "overdue" && txStatus != "OVERDUE" &&
            txStatus != "payment_pending") {
            Database::close(conn);
            return api_utils::errRes(409, "Transaction is not eligible for payment");
        }

        std::string updateFine =
            "UPDATE transactions SET "
            "fine=" + std::to_string(fineAmount) + ", "
            "payment_status='PENDING', "
            "payment_method=NULL, "
            "stripe_payment_id=NULL, "
            "payment_date=NULL "
            "WHERE id=" + std::to_string(transactionId);

        if (mysql_query(conn, updateFine.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return api_utils::errRes(500, err);
        }

        int amountPaise = static_cast<int>(stripeChargeAmount * 100 + 0.5);

        std::ostringstream productName;
        productName.precision(2);
        productName << std::fixed;
        if (stripeChargeAmount > fineAmount) {
            productName << "Library Fine (owed " << fineAmount
                        << " INR, Stripe min " << stripeChargeAmount << " INR)";
        } else {
            productName << "Library Late Return Fine";
        }

        std::ostringstream fineMeta;
        fineMeta.precision(2);
        fineMeta << std::fixed << fineAmount;

        std::string successUrl =
            stripeSuccessUrl() +
            "?session_id={CHECKOUT_SESSION_ID}&transaction_id=" +
            std::to_string(transactionId);

        std::map<std::string, std::string> fields = {
            {"mode", "payment"},
            {"success_url", successUrl},
            {"cancel_url", stripeCancelUrl()},
            {"client_reference_id", std::to_string(transactionId)},
            {"metadata[transaction_id]", std::to_string(transactionId)},
            {"metadata[fine_amount]", fineMeta.str()},
            {"line_items[0][price_data][currency]", "inr"},
            {"line_items[0][price_data][product_data][name]", productName.str()},
            {"line_items[0][price_data][unit_amount]", std::to_string(amountPaise)},
            {"line_items[0][quantity]", "1"}
        };

        try {
            std::string stripeText = stripeRequest(
                "POST",
                "https://api.stripe.com/v1/checkout/sessions",
                stripeKey,
                fields
            );

            auto session = crow::json::load(stripeText);
            if (!session) {
                Database::close(conn);
                return api_utils::errRes(502, "Invalid Stripe JSON response");
            }

            std::string sessionId = session["id"].s();
            std::string checkoutUrl = session["url"].s();

            if (sessionId.empty() || checkoutUrl.empty()) {
                Database::close(conn);
                return api_utils::errRes(502, "Invalid Stripe response");
            }

            std::string storeSession =
                "UPDATE transactions SET stripe_payment_id='" +
                escapeSql(sessionId) + "' WHERE id=" +
                std::to_string(transactionId);

            mysql_query(conn, storeSession.c_str());
            Database::close(conn);

            crow::json::wvalue response;
            response["checkoutUrl"] = checkoutUrl;
            response["sessionId"] = sessionId;
            response["transactionId"] = transactionId;
            response["fineAmount"] = fineAmount;
            response["stripeChargeAmount"] = stripeChargeAmount;
            response["upiId"] = envOr("UPI_ID", "library@upi");

            return api_utils::jsonRes(200, response);
        } catch (const std::exception& ex) {
            Database::close(conn);
            std::string msg = parseStripeErrorMessage(ex.what());
            int code = stripeErrorStatusCode(ex.what());
            return api_utils::errRes(code, msg);
        }
    });

    CROW_ROUTE(app, "/api/payment/verify")
    .methods("POST"_method)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return api_utils::errRes(400, "Invalid JSON");

        int transactionId = body["transaction_id"].i();
        if (!transactionId && body.has("transactionId")) {
            transactionId = body["transactionId"].i();
        }

        std::string paymentMethod = "STRIPE";
        if (body.has("payment_method")) paymentMethod = body["payment_method"].s();
        else if (body.has("paymentMethod")) paymentMethod = body["paymentMethod"].s();

        std::string sessionId;
        if (body.has("stripe_session_id")) sessionId = body["stripe_session_id"].s();
        else if (body.has("sessionId")) sessionId = body["sessionId"].s();
        else if (body.has("stripe_payment_id")) sessionId = body["stripe_payment_id"].s();

        if (transactionId <= 0) return api_utils::errRes(400, "transaction_id is required");

        MYSQL* conn = Database::connect();
        if (!conn) return api_utils::errRes(500, "Database connection failed");

        Database::ensureTransactionSchema(conn);

        std::string stripePaymentId = sessionId;
        bool paid = false;

        if (paymentMethod == "UPI" || paymentMethod == "upi") {
            paid = true;
            paymentMethod = "UPI";
        } else {
            paymentMethod = "STRIPE";
            std::string stripeKey = stripeSecret();
            if (stripeKey.empty()) {
                Database::close(conn);
                return api_utils::errRes(500, "STRIPE_SECRET_KEY is not configured");
            }

            if (stripePaymentId.empty()) {
                std::string fetchSession =
                    "SELECT stripe_payment_id FROM transactions WHERE id=" +
                    std::to_string(transactionId);
                if (mysql_query(conn, fetchSession.c_str()) == 0) {
                    MYSQL_RES* res = mysql_store_result(conn);
                    MYSQL_ROW row = res ? mysql_fetch_row(res) : nullptr;
                    if (row && row[0]) stripePaymentId = row[0];
                    if (res) mysql_free_result(res);
                }
            }

            if (stripePaymentId.empty()) {
                Database::close(conn);
                return api_utils::errRes(400, "stripe_session_id is required for Stripe verification");
            }

            try {
                std::string stripeText = stripeRequest(
                    "GET",
                    "https://api.stripe.com/v1/checkout/sessions/" + stripePaymentId,
                    stripeKey
                );

                auto session = crow::json::load(stripeText);
                if (!session) {
                    Database::close(conn);
                    return api_utils::errRes(502, "Invalid Stripe JSON response");
                }

                std::string paymentStatus = session["payment_status"].s();
                paid = (paymentStatus == "paid");
                if (session.has("payment_intent") && session["payment_intent"].t() == crow::json::type::String) {
                    stripePaymentId = session["payment_intent"].s();
                }
            } catch (const std::exception& ex) {
                Database::close(conn);
                return api_utils::errRes(502, ex.what());
            }
        }

        if (!paid) {
            std::string failQuery =
                "UPDATE transactions SET payment_status='FAILED' WHERE id=" +
                std::to_string(transactionId);
            mysql_query(conn, failQuery.c_str());
            Database::close(conn);
            return api_utils::errRes(402, "Payment not completed");
        }

        std::string updatePaid =
            "UPDATE transactions SET "
            "payment_status='PAID', "
            "payment_method='" + escapeSql(paymentMethod) + "', "
            "stripe_payment_id='" + escapeSql(stripePaymentId) + "', "
            "payment_date=NOW() "
            "WHERE id=" + std::to_string(transactionId);

        if (mysql_query(conn, updatePaid.c_str())) {
            std::string err = mysql_error(conn);
            Database::close(conn);
            return api_utils::errRes(500, err);
        }

        try {
            auto details = fetchPaymentDetails(conn, transactionId);
            Database::close(conn);
            crow::json::wvalue response;
            response["message"] = "Payment verified successfully";
            response["payment"] = std::move(details);
            return api_utils::jsonRes(200, response);
        } catch (const std::exception& ex) {
            Database::close(conn);
            return api_utils::errRes(500, ex.what());
        }
    });
}
