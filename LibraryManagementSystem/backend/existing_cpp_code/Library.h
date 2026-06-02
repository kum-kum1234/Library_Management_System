#pragma once
#include <string>
#include <vector>
#include "Book.h"

struct LibraryStats {
    int totalBooks;
    int issuedBooks;
    int availableBooks;
};

std::vector<Book> loadBooks();
void saveBooks(const std::vector<Book>& books);

bool addBook(const Book& book);
std::vector<Book> getBooks();

bool issueBook(int bookId, const std::string& username, int& outIssueDate);

bool returnBook(int bookId, int daysKept, int& fine);

std::vector<Book> searchBooks(const std::string& keyword);
LibraryStats getStats();

bool deleteBook(int bookId);
std::vector<std::string> getTransactions();
