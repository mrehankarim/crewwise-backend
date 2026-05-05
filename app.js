import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"))
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("Hello")
})

import authRouter from "./routes/authRouter.js";
app.use("/api/v1/auth", authRouter);

export default app;
