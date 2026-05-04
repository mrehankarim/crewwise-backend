import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(cors())
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"))
app.use(cookieParser())

import adminRouter from "./routes/adminRouter.js"
import contractorRouter from "./routes/contractorRouter.js"
import technicianRouter from "./routes/technicianRouter.js"
import managerRouter from "./routes/managerRouter.js"

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/contractor", contractorRouter);
app.use("/api/v1/technician", technicianRouter);
app.use("/api/v1/manager", managerRouter);

export default app;
