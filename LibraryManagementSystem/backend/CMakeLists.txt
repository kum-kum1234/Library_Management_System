cmake_minimum_required(VERSION 3.16)

project(LibraryManagementBackend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required standard packages
find_package(Threads REQUIRED)

# Direct include paths for Linux Docker container
include_directories(
    include
    /usr/local/include
    /usr/include
    /usr/include/mysql
    existing_cpp_code
    database
    api
    models
    utils
)

link_directories(
    /usr/lib/x86_64-linux-gnu
)

add_executable(library-api
    server.cpp
    api/routes.cpp
    database/db.cpp
    utils/jwt.cpp
    utils/env_loader.cpp
    existing_cpp_code/Book.cpp
    existing_cpp_code/Library.cpp
    existing_cpp_code/Utils.cpp
)

# Link required Linux libraries including Threads and MySQL
target_link_libraries(library-api PRIVATE
    Threads::Threads
    mysqlclient
    ssl
    crypto
    dl
)