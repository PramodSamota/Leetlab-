import jwt from "jsonwebtoken";
import { ApiError, asyncHandler, env } from "../utils/index.js";

const verifyUser = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    throw new ApiError(401, "User does not have accessToken");
  }
  const decodedToken = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);

  req.user = decodedToken;

  next();
});

export { verifyUser };
