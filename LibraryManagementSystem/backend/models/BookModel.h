#pragma once

#include <string>
#include <crow.h>

struct BookModel {

    int id;

    std::string title;

    std::string author;

    std::string category;
    std::string thumbnail;

    int quantity;

    int available;

    crow::json::wvalue toJson() const {

        crow::json::wvalue json;

        json["id"] = id;
        json["title"] = title;
        json["author"] = author;
        json["category"] = category;
        json["thumbnail"] = thumbnail;
        json["quantity"] = quantity;
        json["available"] = available;

        return json;
    }
};