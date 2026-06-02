#pragma once

#include <mysql.h>
#include <string>

class Database {
public:
    static MYSQL* connect();
    static void close(MYSQL* conn);
    static void ensureTransactionSchema(MYSQL* conn);
};
