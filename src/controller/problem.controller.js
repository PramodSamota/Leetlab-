import {
  asyncHandler,
  handleZodError,
  ApiError,
  logger,
} from "../utils/index.js";

import { db } from "../libs/db.js";
import { validateCreateProblem } from "../validator/problem.validate.js";
import { object } from "zod/v4";
import { getJudge0LanguageById, submitBatch } from "../utils/judge0.js";
const createProblem = await asyncHandler(async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    hints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = handleZodError(validateCreateProblem(req.body));

  const userRole = req.user.role;

  if (userRole.toUpperCase() !== "ADMIN") {
    logger.error("Unauthorized Request");
    throw new ApiError(403, "You are not allowed to create a problem");
  }

  const existingProblem = await db.problem.findFirst({
    where: { title },
  });

  if (existingProblem) {
    throw new ApiError(409, "Problem already exists");
  }

  for (const [language, solutionCode] of object.entries(referenceSolutions)) {
    const languageId = getJudge0LanguageById(language);

    if (!languageId) {
      logger.error(`Invalid language: ${language}`);
      throw new ApiError(400, `Invalid language: ${language}`);
    }

    const submissions = testcases.map((input, output) => {
      return {
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      };
    });
  }
});

const token = await submitBatch(submissions);

const deleteProblem = await asyncHandler(async (req, res) => {});

const updateProblem = await asyncHandler(async (req, res) => {});

const getProblemById = await asyncHandler(async (req, res) => {});

const getAllProblems = await asyncHandler(async (req, res) => {});

export {
  createProblem,
  deleteProblem,
  updateProblem,
  getProblemById,
  getAllProblems,
};
