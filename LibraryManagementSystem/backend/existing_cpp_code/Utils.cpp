#include "Utils.h"
#include <ctime>

int getToday() {
    std::time_t t = std::time(nullptr);
    std::tm* now = std::localtime(&t);
    return now->tm_yday + 1;
}
