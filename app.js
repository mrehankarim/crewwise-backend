import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://localhost:8081" // Expo Web default
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import authRouter from "./routes/authRouter.js";
import organizationRouter from "./routes/organizationRouter.js";
import workorderRouter from "./routes/workorderRouter.js";
import clientRouter from "./routes/clientRouter.js";
import inventoryRouter from "./routes/inventoryRouter.js";
import scheduleRouter from "./routes/scheduleRouter.js";
import attendanceRouter from "./routes/attendanceRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import auditlogRouter from "./routes/auditlogRouter.js";
import skillRouter from "./routes/skillRouter.js";
import planRouter from "./routes/planRouter.js";
import subscriptionRouter from "./routes/subscriptionRouter.js";
import invoiceRouter from "./routes/invoiceRouter.js";
import paymentRouter from "./routes/paymentRouter.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/work-orders", workorderRouter);
app.use("/api/v1/clients", clientRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/schedules", scheduleRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/audit-logs", auditlogRouter);
app.use("/api/v1/skills", skillRouter);
app.use("/api/v1/plans", planRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/payments", paymentRouter);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

export default app;
