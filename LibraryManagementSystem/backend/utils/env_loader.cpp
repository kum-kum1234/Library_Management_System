#include "env_loader.h"

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

namespace {

std::string trim(const std::string& value) {
    size_t start = value.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    size_t end = value.find_last_not_of(" \t\r\n");
    return value.substr(start, end - start + 1);
}

void setEnvIfEmpty(const std::string& key, const std::string& value) {
    if (key.empty() || value.empty()) return;

    const char* existing = std::getenv(key.c_str());
    if (existing && existing[0]) return;

#ifdef _WIN32
    _putenv_s(key.c_str(), value.c_str());
#else
    setenv(key.c_str(), value.c_str(), 0);
#endif
}

void parseEnvLine(const std::string& line) {
    if (line.empty() || line[0] == '#') return;

    size_t eq = line.find('=');
    if (eq == std::string::npos) return;

    std::string key = trim(line.substr(0, eq));
    std::string value = trim(line.substr(eq + 1));

    if (!value.empty() && value.front() == '"' && value.back() == '"') {
        value = value.substr(1, value.size() - 2);
    }

    setEnvIfEmpty(key, value);
}

bool loadEnvFile(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) return false;

    std::string line;
    while (std::getline(file, line)) {
        parseEnvLine(trim(line));
    }

    std::cout << "Loaded environment from " << path << std::endl;
    return true;
}

} // namespace

void loadEnvironmentFiles() {
    const std::vector<std::string> paths = {
        ".env",
        "../.env",
        "../../.env",
        "../../../.env",
        ".env.example",
        "../.env.example",
        "../../.env.example",
        "../../../.env.example"
    };

    for (const auto& path : paths) {
        loadEnvFile(path);
    }
}
