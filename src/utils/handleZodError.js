import { ApiError } from "./index.js";

const handleZodError = (result) => {
  if (!result.success) {
    const missing = result.error.issues.find(
      (issue) =>
        issue.code === "invalid_type" && issue.received === "undefined",
    );

    if (missing) {
      throw new ApiError(
        500,
        `Missing required field: [${result.error.issues[0].path.join(".").toUpperCase()}]`,
      );
    }

    throw new ApiError(500, result.error.issues[0].message);
  }

  return result.data;
};

export { handleZodError };
