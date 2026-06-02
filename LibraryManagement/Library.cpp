#include "Library.h"
#include "Book.h"
#include "Utils.h"
#include <fstream>
#include <vector>
#include <limits>
#include <algorithm>
using namespace std;

string clean(string s) {
    string result;
    for (char c : s) {
        if (c != ' ')
            result += tolower(c);
    }
    return result;
}
vector<Book> loadBooks() {
    vector<Book> books;
    ifstream file("books.txt");
    string line;

    while (getline(file, line)) {
        Book b;
        b.fromFileString(line);
        books.push_back(b);
    }
    return books;
}

void saveBooks(vector<Book>& books) {
    ofstream file("books.txt");
    for (auto &b : books) {
        file << b.toFileString() << endl;
    }
}

void addBook() {
    Book b;
    b.input();

    vector<Book> books = loadBooks();

    // 🔥 Check duplicate ID
    for (auto &bk : books) {
        if (bk.id == b.id) {
            cout << "Book ID already exists!\n";
            return;
        }
    }

    ofstream file("books.txt", ios::app);
    file << b.toFileString() << endl;

    cout << "Book Added\n";
}
void viewBooks() {
    vector<Book> books = loadBooks();

    cout << "\n===== BOOK LIST =====\n";
    for (auto &b : books) {
        b.display();
    }
}

void issueBook() {
    int id;
    cout << "Enter Book ID: ";
    cin >> id;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    string user;
    cout << "Enter User Name: ";
    getline(cin, user);

    vector<Book> books = loadBooks();
    bool found = false;

    for (auto &b : books) {
        if (b.id == id) {

            if (b.issued) {
                cout << "Book already issued to " << b.issuedTo << "\n";
                return;
            }

            b.issued = true;
            b.issueDate = getToday();
            b.issuedTo = user;
            found = true;

            cout << "Book Issued to " << user << "\n";

            // ✅ Logging
            ofstream log("transactions.txt", ios::app);
            log << "Book " << b.id 
                << " Issued to " << user 
                << " on day " << b.issueDate << endl;

            break; // stop loop once found
        }
    }

    saveBooks(books);

    if (!found)
        cout << "Book not found\n";
}

void returnBook() {
    int id;
    cout << "Enter Book ID: ";
    cin >> id;

    vector<Book> books = loadBooks();
    bool found = false;

    for (auto &b : books) {
        if (b.id == id && b.issued) {
            int days;
            cout << "Enter number of days book was kept: ";
            cin >> days;

            int fine = (days > 7) ? (days - 7) * 5 : 0;

            cout << "Book Returned\n";
            cout << "Days: " << days << endl;
            cout << "Fine: Rs" << fine << endl;

            // ✅ Logging INSIDE loop
            ofstream log("transactions.txt", ios::app);
            log << "Book " << b.id << " Returned | Fine: ₹" << fine << endl;

            b.issued = false;
            b.issueDate = 0;
            b.issuedTo = "";
            found = true;
        }
    }

    saveBooks(books);

    if (!found)
        cout << "Invalid Return\n";
}
void searchBook() {
    vector<Book> books = loadBooks();
    string keyword;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Enter Book Name or Author: ";
    getline(cin, keyword);

    string key = clean(keyword);
    bool found = false;

    cout << "\nSearch Results:\n";

    for (auto &b : books) {
        if (clean(b.name).find(key) != string::npos ||
            clean(b.author).find(key) != string::npos) {
            b.display();
            found = true;
        }
    }

    if (!found) {
        cout << "No matching books found\n";
    }
}
void showStats() {
    vector<Book> books = loadBooks();

    int total = books.size();
    int issued = 0;

    for (auto &b : books) {
        if (b.issued) issued++;
    }

    cout << "\n===== STATS =====\n";
    cout << "Total Books: " << total << endl;
    cout << "Issued Books: " << issued << endl;
    cout << "Available Books: " << total - issued << endl;
}
void deleteBook() {
    int id;
    cout << "Enter Book ID to delete: ";
    cin >> id;

    vector<Book> books = loadBooks();
    vector<Book> updated;

    for (auto &b : books) {
        if (b.id != id)
            updated.push_back(b);
    }

    saveBooks(updated);
    cout << "Book Deleted\n";
}
void viewTransactions() {
    ifstream file("transactions.txt");
    string line;

    cout << "\n===== TRANSACTION HISTORY =====\n";

    while (getline(file, line)) {
        cout << line << endl;
    }
}
