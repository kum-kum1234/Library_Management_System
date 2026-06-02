#include "Utils.h"
#include <ctime>

int getToday() {
    time_t t = time(0);
    tm* now = localtime(&t);
    return now->tm_yday;
}