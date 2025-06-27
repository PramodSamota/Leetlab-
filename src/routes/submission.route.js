import express from "express";
import {
  getAllSubmissions,
  getAllTheSubmissionForProblem,
  getAllSubmissionForProblem,
} from "../controller/submission.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/get-all-submissions", verifyUser, getAllSubmissions);
router.get(
  "/:pid/submissionForProblem",
  verifyUser,
  getAllSubmissionForProblem,
);
router.get(
  "/get-submissionProblem-count",
  verifyUser,
  getAllTheSubmissionForProblem,
);
export default router;
