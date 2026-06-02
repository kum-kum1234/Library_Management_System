#include "Library.h"
#include <fstream>
#include <algorithm>
#include <sstream>
#include <cctype>

static std::string normalize(const std::string& value) {
    std::string result;
    for (char c : value) {
        if (!std::isspace(static_cast<unsigned char>(c))) {
            result += std::tolower(static_cast<unsigned char>(c));
        }
    }
    return result;
}

std::vector<Book> loadBooks() {
    std::vector<Book> books;
    std::ifstream file("books.txt");
    std::string line;

    while (std::getline(file, line)) {
        if (line.empty()) continue;
        books.push_back(Book::fromFileString(line));
    }
    return books;
}

void saveBooks(const std::vector<Book>& books) {
    std::ofstream file("books.txt");
    for (const auto& book : books) {
        file << book.toFileString() << "\n";
    }
}

bool addBook(const Book& book) {
    auto books = loadBooks();
    for (const auto& existing : books) {
        if (existing.id == book.id)
            return false;
    }

    std::ofstream file("books.txt", std::ios::app);
    file << book.toFileString() << "\n";
    return true;
}

std::vector<Book> getBooks() {
    return loadBooks();
}

bool issueBook(int bookId, const std::string& username, int& outIssueDate) {
    auto books = loadBooks();
    bool found = false;

    for (auto& book : books) {
        if (book.id == bookId) {
            found = true;
            if (book.issued) return false;
            book.issued = true;
            book.issuedTo = username;
            book.issueDate = outIssueDate;
            break;
        }
    }

    if (!found) return false;
    saveBooks(books);

    std::ofstream log("transactions.txt", std::ios::app);
    log << "ISSUE|" << bookId << "|" << username << "|" << outIssueDate << "\n";

    return true;
}

bool returnBook(int bookId, int daysKept, int& fine) {
    auto books = loadBooks();
    bool found = false;

    for (auto& book : books) {
        if (book.id == bookId && book.issued) {
            found = true;
            fine = daysKept > 7 ? (daysKept - 7) * 5 : 0;
            book.issued = false;
            book.issueDate = 0;
            book.issuedTo.clear();
            break;
        }
    }

    if (!found) return false;
    saveBooks(books);

    std::ofstream log("transactions.txt", std::ios::app);
    log << "RETURN|" << bookId << "|" << fine << "\n";
    return true;
}

std::vector<Book> searchBooks(const std::string& keyword) {
    auto books = loadBooks();
    std::vector<Book> results;
    std::string term = normalize(keyword);

    for (const auto& book : books) {
        if (normalize(book.name).find(term) != std::string::npos ||
            normalize(book.author).find(term) != std::string::npos) {
            results.push_back(book);
        }
    }
    return results;
}

LibraryStats getStats() {
    auto books = loadBooks();
    LibraryStats stats{};
    stats.totalBooks = static_cast<int>(books.size());
    for (const auto& book : books) {
        if (book.issued) stats.issuedBooks++;
    }
    stats.availableBooks = stats.totalBooks - stats.issuedBooks;
    return stats;
}

bool deleteBook(int bookId) {
    auto books = loadBooks();
    auto originalSize = books.size();
    books.erase(std::remove_if(books.begin(), books.end(), [bookId](const Book& book) {
        return book.id == bookId;
    }), books.end());

    saveBooks(books);
    return books.size() < originalSize;
}

std::vector<std::string> getTransactions() {
    std::vector<std::string> transactions;
    std::ifstream file("transactions.txt");
    std::string line;

    while (std::getline(file, line)) {
        if (!line.empty()) transactions.push_back(line);
    }
    return transactions;
}
