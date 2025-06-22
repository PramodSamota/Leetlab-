import { db } from "../libs/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  asyncHandler,
  ApiError,
  ApiResponse,
  sendEmail,
  handleZodError,
  env,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  logger,
} from "../utils/index.js";
import { UserRole } from "../generated/prisma/index.js";
import {
  validateRegisterData,
  validateLoginData,
  validateEmailData,
  validateResetPassword,
  validateChangePassword,
} from "../validator/auth.validator.js";
import {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
} from "../helper/auth.helper.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken(user.id);

    await db.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Generate Access and Refresh Token Error: ", error);
    throw new ApiError(500, "Internal Server Down");
  }
};

const register = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { email, username, password } = handleZodError(
    validateRegisterData(req.body),
  );

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User is alrady present with this email");
  }

  const existingUsername = await db.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUsername) {
    logger.error("username already taken");
    throw new ApiError("username already taken", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { hashedToken, unHashedToken, tokenExpiry } = generateToken();
  console.log("hashedToken", hashedToken);

  const user = await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: UserRole.USER,
      refreshToken: "",
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  console.log(unHashedToken);
  const emailVerificationURL = `${env.BASE_URI}/api/v1/auth/verify-email/${unHashedToken}`;

  sendEmail(
    email,
    "Verify Email",
    emailVerificationMailgenContent(username, emailVerificationURL),
  );

  res
    .status(201)
    .json(new ApiResponse(201, user, "User is created Successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(404, "Token not get");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  if (!updatedUser) {
    throw new ApiError(404, "User is not found");
  }
  res.status(204).json(new ApiResponse(204, null, "email is verified"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = handleZodError(validateLoginData(req.body));

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    logger.error("User not found");
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Email is not verified");
  }

  const verifyPassword = await bcrypt.compare(password, user.password);

  if (!verifyPassword) {
    logger.error("Invalid Credentials");
    throw new ApiError(401, "Invalid Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id,
  );

  const userInfo = await db.user.update({
    where: { email },
    data: {
      refreshToken,
    },
    select: {
      id: true,
      username: true,
      email: true,
      refreshToken: true,
    },
  });
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  };

  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, userInfo, "User logged in Successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      refreshToken: "",
    },
  });

  if (!updatedUser) {
    throw new ApiError(404, "User is not updated");
  }

  res
    .status(204)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(204, null, "user is logout successfully"));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateEmailData(req.body));

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, "No user found for this email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "User is already verified");
  }

  const { hashedToken, unHashedToken, tokenExpiry } = generateToken();

  const userInfo = await db.user.update({
    where: { email },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
    select: {
      id: true,
      username: true,
      email: true,
      isEmailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpiry: true,
    },
  });

  const verificationUrl = `${env.BASE_URI}/api/v1/auth/verify-email/${unHashedToken}`;

  sendEmail(
    user.email,
    "verify email",
    emailVerificationMailgenContent(user.username, verificationUrl),
  );

  res
    .status(200)
    .json(new ApiResponse(200, userInfo, "Reset eamil-veriry mail send"));
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateEmailData(req.body));

  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Reset password link sent successfully. Check Inbox",
        ),
      );
  }

  const { hashedToken, tokenExpiry, unHashedToken } = generateToken();

  await db.user.update({
    where: { id: user.id },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: tokenExpiry,
    },
  });

  const verificationUrl = `${env.BASE_URI}/forgot/password/${unHashedToken}`;

  await sendEmail(
    user.email,
    "Verify Email",
    forgotPasswordMailgenContent(user.username, verificationUrl),
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Reset password link sent successfully. Check Inbox",
      ),
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    logger.error("Unauthorized Request: Refresh token is required");
    throw new ApiError(401, "Unauthorized Request");
  }
  console.log(incomingRefreshToken);
  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    logger.error("Invalid or expired refresh token");
    throw new ApiError(400, "Invalid or expired refresh token", error);
  }

  const user = await db.user.findFirst({
    where: { id: decodedToken.id },
  });

  if (!user) {
    logger.error("Invalid Refresh Token: User not found");
    throw new ApiError(401, "Invalid Refresh Token");
  }

  // if (incomingRefreshToken !== user.refreshToken) {
  //   logger.error("Refresh Token Expired");
  //   throw new ApiError(400, "Refresh Token Expired");
  // }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user.id);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(new ApiResponse(200, null, "Token Refreshed Successfully"));
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const { newPassword } = handleZodError(validateResetPassword(req.body));

  if (!token) {
    throw new ApiError(400, "token required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    logger.error("Invalid User or token expired");
    throw new ApiError(401, "Invalid User or token expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      forgotPasswordToken: null,
      forgotPasswordExpiry: null,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = handleZodError(
    validateChangePassword(req.body),
  );

  const user = req.user;

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  if (!user) {
    logger.error("Unauthorized Request: User not authenticated");
    throw new ApiError(401, "Invalid Token or Token expired");
  }

  const userInfo = await db.user.findUnique({
    where: { id: user.id },
  });

  if (!userInfo) {
    logger.error("User not found");
    throw new ApiError(404, "user not found");
  }

  const oldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!oldPasswordCorrect) {
    logger.error("Invalid old password");
    throw new ApiError(401, "Invalid old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: userInfo.id },
    data: {
      password: hashedPassword,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    logger.error("Unauthorized Request: User not authenticated");
    throw new ApiError(401, "User not authenticated");
  }

  const userInfo = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      avatar: true,
      isEmailVerified: true,
      role: true,
    },
  });

  if (!userInfo) {
    throw new ApiError(401, "User not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, userInfo, "Current User Data Fetched Successfully!"),
    );
});

const allUsers = asyncHandler(async (req, res) => {
  const getUsers = await db.user.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      avatar: true,
      email: true,
      isEmailVerified: true,
    },
  });

  if (!getUsers) {
    throw new ApiError(404, "allUsers not feteched");
  }

  res
    .status(200)
    .json(new ApiResponse(200, getUsers, "All users fetched successfully"));
});

export {
  register,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  resendEmailVerification,
  resetForgottenPassword,
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  allUsers,
};
