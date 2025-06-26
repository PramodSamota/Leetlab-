import express from "express";
import {
  createProblem,
  deleteProblem,
  getAllProblems,
  getProblemById,
} from "../controller/problem.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/permission.middleware.js";
const router = express.Router();

router.post(
  "/create-problem",
  verifyUser,
  checkPermission("ADMIN"),
  createProblem,
);
router.get("/:pid/problemById", verifyUser, getProblemById);

router.get("/all", verifyUser, getAllProblems);
router.delete(
  "/:pid/delete",
  verifyUser,
  checkPermission("ADMIN"),
  deleteProblem,
);

export default router;
