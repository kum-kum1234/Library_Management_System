cmake_minimum_required(VERSION 3.16)

project(LibraryManagementBackend)

set(CMAKE_CXX_STANDARD 17)

# MySQL paths (Windows default installation)
set(MYSQL_INCLUDE_DIR "C:/Program Files/MySQL/MySQL Server 8.0/include")
set(MYSQL_LIB_DIR "C:/Program Files/MySQL/MySQL Server 8.0/lib")

# Include directories for Crow (header-only)
include_directories(/usr/include)
include_directories(C:/vcpkg/installed/x64-windows/include)

include_directories(existing_cpp_code)
include_directories(database)
include_directories(api)
include_directories(models)
include_directories(utils)
include_directories(${MYSQL_INCLUDE_DIR})

link_directories(${MYSQL_LIB_DIR})
link_directories(C:/vcpkg/installed/x64-windows/lib)

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

target_link_libraries(library-api PRIVATE
    libmysql
    winhttp
)