#include "Book.h"
#include <sstream>

Book::Book()
    : id(0), name(""), author(""), issued(false), issueDate(0), issuedTo("") {}

Book Book::fromFileString(const std::string& line) {
    Book book;
    std::stringstream ss(line);
    std::string token;

    getline(ss, token, '|'); book.id = token.empty() ? 0 : stoi(token);
    getline(ss, book.name, '|');
    getline(ss, book.author, '|');
    getline(ss, token, '|'); book.issued = token == "1";
    getline(ss, token, '|'); book.issueDate = token.empty() ? 0 : stoi(token);
    getline(ss, book.issuedTo, '|');

    return book;
}

std::string Book::toFileString() const {
    return std::to_string(id) + "|" + name + "|" + author + "|" +
        (issued ? "1" : "0") + "|" + std::to_string(issueDate) + "|" + issuedTo;
}
