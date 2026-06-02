#include <iostream>
#include "Library.h"

using namespace std;

string role;  // for future role-based system

// Login Function
bool login() {
    string u, p;
    cout << "Username: ";
    cin >> u;
    cout << "Password: ";
    cin >> p;

    if (u == "admin" && p == "1234") {
        role = "admin";
        return true;
    } 
    else if (u == "student" && p == "1234") {
        role = "student";
        return true;
    }

    return false;
}

// Main Function
int main() {
    if (!login()) {
        cout << "Login Failed\n";
        return 0;
    }

    int choice;
    do {
        cout << "\n=================================\n";
        cout << "     LIBRARY MANAGEMENT SYSTEM\n";
        cout << "=================================\n";
        cout << "1. Add Book\n";
        cout << "2. View Books\n";
        cout << "3. Issue Book\n";
        cout << "4. Return Book\n";
        cout << "5. Exit\n";
        cout << "6. Search Book\n";
        cout << "7. Show Stats\n";
        cout << "8. Delete Book\n";
        cout << "9. View Transactions\n";
        cout << "=================================\n";

        cout << "Enter Choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                if (role == "admin") addBook();
                else cout << "Access Denied\n";
                break;

            case 2:
                viewBooks();
                break;

            case 3:
                issueBook();
                break;

            case 4:
                returnBook();
                break;

            case 5:
                cout << "Exiting...\n";
                break;

            case 6:
                searchBook();
                break;

            case 7:
                showStats();
                break;

            case 8:
                if (role == "admin") deleteBook();
                else cout << "Access Denied\n";
                break;
            case 9:
                viewTransactions();
                break;

            default:
                cout << "Invalid Choice\n";
        }

    } while (choice != 5);

    return 0;
}