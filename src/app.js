import express from "express";

import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import problemRouter from "./routes/problem.routes.js";
import executeCodeRouter from "./routes/executeCode.route.js";
import submissionRouter from "./routes/submission.route.js";
import playlistRouter from "./routes/playlist.route.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/problem", problemRouter);
app.use("/api/v1/execute-code", executeCodeRouter);
app.use("/api/v1/submission", submissionRouter);
app.use("/api/v1/playlist", playlistRouter);

export { app };
