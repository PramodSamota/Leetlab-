import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../utils/index.js";

function generateToken() {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes;

  return { unHashedToken, hashedToken, tokenExpiry };
}

function generateAccessToken({ id, email, username, role }) {
  return jwt.sign({ id, email, username, role }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  });
}

export { generateAccessToken, generateRefreshToken, generateToken };
