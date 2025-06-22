import express from "express";
import { createProblem } from "../controller/problem.controller.js";

const router = express.Router();

router.post("/create", createProblem);

export default router;
