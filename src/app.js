import express from "express";

import authRouter from "./routes/auth.route.js";
import problemRouter from "./routes/problem.routes.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/problems", problemRouter);

export { app };
