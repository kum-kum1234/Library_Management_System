#ifndef BOOK_H
#define BOOK_H

#include <iostream>
using namespace std;

class Book {
public:
    int id;
    string name;
    string author;
    bool issued;
    int issueDate;
    string issuedTo;

    void input();
    void display();
    string toFileString();
    void fromFileString(string line);
};

#endif