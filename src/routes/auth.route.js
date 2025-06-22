import express from "express";

const router = express.Router();

import {
  loginUser,
  register,
  verifyEmail,
  logoutUser,
  resendEmailVerification,
  resetForgottenPassword,
  forgotPasswordRequest,
  changeCurrentPassword,
  refreshAccessToken,
  allUsers,
  getCurrentUser,
} from "../controller/auth.controller.js";

import { verifyUser } from "../middleware/auth.middleware.js";

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", loginUser);
router.get("/logout", verifyUser, logoutUser);
router.post("/resendVerifyEmail", resendEmailVerification);
router.post("/forgotPassword/request", forgotPasswordRequest);
router.post("/resetForgotPassword/:token", resetForgottenPassword);
router.post("/changePassword", verifyUser, changeCurrentPassword);
router.get("/refreshAccessToken", refreshAccessToken);
router.get("/allUser", allUsers);
router.get("/currentUser", verifyUser, getCurrentUser);
export default router;
