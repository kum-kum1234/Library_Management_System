#pragma once

#include <crow.h>

namespace api_utils {

inline crow::response jsonRes(int code, crow::json::wvalue body) {
    crow::response res(code, body);
    res.set_header("Content-Type", "application/json");
    res.set_header("Access-Control-Allow-Origin", "*");
    return res;
}

inline crow::response errRes(int code, const std::string& msg) {
    crow::json::wvalue body;
    body["error"] = msg;
    return jsonRes(code, body);
}

} // namespace api_utils
