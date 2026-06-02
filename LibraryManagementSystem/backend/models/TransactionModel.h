#pragma once
#include <string>
#include <crow.h>

struct TransactionModel {
    int id;
    int userId;
    int bookId;
    std::string issueDate;
    std::string returnDate;
    std::string status;

    crow::json::wvalue toJson() const {
        crow::json::wvalue json;
        json["id"] = id;
        json["userId"] = userId;
        json["bookId"] = bookId;
        json["issueDate"] = issueDate;
        json["returnDate"] = returnDate;
        json["status"] = status;
        return json;
    }
};
