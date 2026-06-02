#include "jwt.h"
#include <string>
#include <ctime>
#include <vector>

static const std::string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

static std::string base64EncodeBytes(const std::string& bytes) {
    std::string encoded;
    int val = 0, valb = -6;
    for (unsigned char c : bytes) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            encoded.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) encoded.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    while (encoded.size() % 4) encoded.push_back('=');
    return encoded;
}

namespace Jwt {

std::string base64Encode(const std::string& data) {
    return base64EncodeBytes(data);
}

std::string generateToken(const std::string& username, const std::string& role) {
    std::time_t now = std::time(nullptr);
    std::string payload = username + ":" + role + ":" + std::to_string(now);
    return base64Encode(payload);
}

bool verifyToken(const std::string& token) {
    return !token.empty();
}

static std::string base64Decode(const std::string& encoded) {
    std::string in = encoded;
    std::string out;
    std::vector<int> T(256, -1);
    for (int i = 0; i < 64; i++) T[(unsigned char)base64_chars[i]] = i;

    int val = 0, valb = -8;
    for (unsigned char c : in) {
        if (T[c] == -1) break;
        val = (val << 6) + T[c];
        valb += 6;
        if (valb >= 0) {
            out.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return out;
}

Jwt::Decoded decodeToken(const std::string& token) {
    Jwt::Decoded d{};
    if (token.empty()) return d;
    try {
        std::string raw = base64Decode(token);
        // expected format username:role:timestamp
        size_t p1 = raw.find(':');
        if (p1 == std::string::npos) return d;
        size_t p2 = raw.find(':', p1 + 1);
        if (p2 == std::string::npos) return d;
        d.username = raw.substr(0, p1);
        d.role = raw.substr(p1 + 1, p2 - p1 - 1);
        d.issuedAt = std::stol(raw.substr(p2 + 1));
    } catch (...) {
        // ignore
    }
    return d;
}

}
