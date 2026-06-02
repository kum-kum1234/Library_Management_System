#pragma once
#include <string>

namespace Jwt {
    std::string base64Encode(const std::string& data);
    std::string generateToken(const std::string& username, const std::string& role);
    bool verifyToken(const std::string& token);
    struct Decoded {
        std::string username;
        std::string role;
        long issuedAt;
    };

    Decoded decodeToken(const std::string& token);
}
