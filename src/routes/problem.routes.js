import express from "express";
import { createProblem } from "../controller/problem.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/create-problem", verifyUser, createProblem);

export default router;
