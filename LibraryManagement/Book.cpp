#include "Book.h"
#include <sstream>

void Book::input() {
    cout << "Enter Book ID: ";
    cin >> id;
    cin.ignore();

    do {
    cout << "Enter Book Name: ";
    getline(cin, name);
    } while (name.empty());

   do {
    cout << "Enter Author: ";
    getline(cin, author);
  } while (author.empty());

    issued = false;
    issueDate = 0;
}

void Book::display() {
    cout << id << " | " << name << " | " << author 
     << " | " << (issued ? "Issued to: " + issuedTo : "Available") << endl;
}

string Book::toFileString() {
    return to_string(id) + "|" + name + "|" + author + "|" +
       to_string(issued) + "|" + to_string(issueDate) + "|" + issuedTo;
}

void Book::fromFileString(string line) {
    stringstream ss(line);
    string temp;

    getline(ss, temp, '|'); id = stoi(temp);
    getline(ss, name, '|');
    getline(ss, author, '|');
    getline(ss, temp, '|'); issued = stoi(temp);
    getline(ss, temp, '|'); issueDate = stoi(temp);
    getline(ss, issuedTo, '|');
}