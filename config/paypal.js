import { Client, Environment, LogLevel, OrdersController, PaymentsController } from "@paypal/paypal-server-sdk";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: process.env.PAYPAL_CLIENT_ID,
        oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment: process.env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
    logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true },
    },
});

export const ordersController = new OrdersController(client);
export const paymentsController = new PaymentsController(client);
