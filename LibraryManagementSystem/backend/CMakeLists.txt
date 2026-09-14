cmake_minimum_required(VERSION 3.16)

project(LibraryManagementBackend)

set(CMAKE_CXX_STANDARD 17)

# Detect Platform and Configure MySQL / Include Paths
if(UNIX AND NOT APPLE)
    # Linux / Docker Environment (Render)
    find_package(PkgConfig REQUIRED)
    pkg_check_modules(MYSQL REQUIRED mysqlclient)

    include_directories(
        include
        /usr/local/include
        /usr/include
        /usr/include/mysql
        ${MYSQL_INCLUDE_DIRS}
    )
    link_directories(${MYSQL_LIBRARY_DIRS})
else()
    # Windows Local Development Environment
    set(MYSQL_INCLUDE_DIR "C:/Program Files/MySQL/MySQL Server 8.0/include")
    set(MYSQL_LIB_DIR "C:/Program Files/MySQL/MySQL Server 8.0/lib")

    include_directories(
        include
        C:/vcpkg/installed/x64-windows/include
        ${MYSQL_INCLUDE_DIR}
    )
    link_directories(
        ${MYSQL_LIB_DIR}
        C:/vcpkg/installed/x64-windows/lib
    )
endif()

# Project directories
include_directories(
    existing_cpp_code
    database
    api
    models
    utils
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

if(UNIX AND NOT APPLE)
    target_link_libraries(library-api PRIVATE
        mysqlclient
        ssl
        crypto
        pthread
        dl
    )
else()
    target_link_libraries(library-api PRIVATE
        libmysql
        winhttp
    )
endif()