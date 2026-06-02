#pragma once
#include <crow.h>
#include "auth.h"
#include "books.h"
#include "issue.h"
#include "return.h"
#include "transactions.h"
#include "stats.h"
#include "payment.h"
#include "student_fines.h"
#include "reservations.h"
#include "waitlists.h"
template<typename App>
void registerRoutes(App& app) {
    registerAuthRoutes(app);
    registerBookRoutes(app);
    registerIssueRoutes(app);
    registerReturnRoutes(app);
    registerTransactionRoutes(app);
    registerStatsRoutes(app);
    registerPaymentRoutes(app);
    registerStudentFinesRoutes(app);
    registerWaitlistRoutes(app);
    registerReservationRoutes(app);
}