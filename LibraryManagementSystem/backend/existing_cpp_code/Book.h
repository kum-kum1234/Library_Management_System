#pragma once
#include <string>

class Book {
public:
    int id;
    std::string name;
    std::string author;
    bool issued;
    int issueDate;
    std::string issuedTo;

    Book();
    static Book fromFileString(const std::string& line);
    std::string toFileString() const;
};
