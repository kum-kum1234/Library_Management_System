#pragma once

#include <iostream>
#include <string>
#include <curl/curl.h>

inline bool sendEmail(
    const std::string& to,
    const std::string& subject,
    const std::string& body
) {

    CURL* curl;

    CURLcode res = CURLE_OK;

    curl = curl_easy_init();

    if (!curl) {

        std::cout << "Curl init failed\n";

        return false;
    }

    std::string payload =
        "To: " + to + "\r\n" +
        "From: cursr2006gmail.com\r\n" +
        "Subject: " + subject + "\r\n"
        "\r\n" +
        body + "\r\n";

    struct curl_slist* recipients = NULL;

    curl_easy_setopt(
        curl,
        CURLOPT_USERNAME,
        "cursr2006gmail.com"
    );

    curl_easy_setopt(
        curl,
        CURLOPT_PASSWORD,
        "kumkum@9171"
    );

    curl_easy_setopt(
        curl,
        CURLOPT_URL,
        "smtp://smtp.gmail.com:587"
    );

    curl_easy_setopt(
        curl,
        CURLOPT_USE_SSL,
        (long)CURLUSESSL_ALL
    );

    curl_easy_setopt(
        curl,
        CURLOPT_MAIL_FROM,
        "<yourgmail@gmail.com>"
    );

    recipients =
        curl_slist_append(
            recipients,
            to.c_str()
        );

    curl_easy_setopt(
        curl,
        CURLOPT_MAIL_RCPT,
        recipients
    );

    curl_easy_setopt(
        curl,
        CURLOPT_READFUNCTION,
        NULL
    );

    curl_easy_setopt(
        curl,
        CURLOPT_READDATA,
        NULL
    );

    curl_easy_setopt(
        curl,
        CURLOPT_UPLOAD,
        1L
    );

    curl_easy_setopt(
        curl,
        CURLOPT_COPYPOSTFIELDS,
        payload.c_str()
    );

    res = curl_easy_perform(curl);

    if (res != CURLE_OK) {

        std::cout
            << "Email failed: "
            << curl_easy_strerror(res)
            << std::endl;

        curl_easy_cleanup(curl);

        return false;
    }

    curl_easy_cleanup(curl);

    curl_slist_free_all(recipients);

    std::cout << "Email sent\n";

    return true;
}