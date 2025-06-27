import express from "express";
const router = express.Router();

import { executeCode } from "../controller/executeCode.controller.js";
import { verifyUser } from "../middleware/auth.middleware.js";

router.post("/:pid/:type", verifyUser, executeCode);

export default router;
