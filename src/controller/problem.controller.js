import {
  asyncHandler,
  handleZodError,
  ApiError,
  logger,
  ApiResponse,
} from "../utils/index.js";
import { object } from "zod/v4";
import { db } from "../libs/db.js";
import { validateCreateProblem } from "../validator/problem.validate.js";

import {
  getJudge0LanguageById,
  pollBatchResult,
  submitBatch,
} from "../utils/judge0.js";

const createProblem = asyncHandler(async (req, res) => {
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

  console.log(difficulty);

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
  // const referenceSolutions = req.body.referenceSolutions || {};

  // 2. Safely get entries
  // console.log("referenceSolutions...", referenceSolutions);
  const solutionEntries = Object.entries(referenceSolutions);

  // console.log("solutionEntries", solutionEntries);

  for (const [language, solutionCode] of solutionEntries) {
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
    console.log("submissions :", submissions);
    const tokens = await submitBatch(submissions);
    console.log("tokens :", tokens);

    const results = await pollBatchResult(tokens);
    console.log("results :", results);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      // console.log("result : ", result);
      if (result.status.id !== 3) {
        logger.error(`Submission ${i + 1} failed:${result.status.description}`);
        throw new ApiError(400, `Submission ${i + 1}`);
      }
    }

    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty: difficulty.toUpperCase(),
        tags,
        examples,
        constraints,
        hints,
        testcases,
        codeSnippets,
        referenceSolutions,
        userId: req.user.id,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newProblem, "Problem created successfully"));
  }
});

const getProblemById = await asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const problem = await db.problem.findFirst({
    where: { id: pid },
  });

  if (!problem) {
    throw new ApiError(404, "Probelm not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, problem, "Problem feteched successfully"));
});

const getAllProblems = await asyncHandler(async (req, res) => {
  const problems = await db.problem.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      tags: true,
      createdAt: true,
      updateAt: true,
    },
  });

  if (!problems) {
    throw new ApiError(404, "No Problems found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, problems, "All problems feteched successfully"));
});

const deleteProblem = await asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const deletedProblem = await db.problem.deleteMany({ where: { id: pid } });
  if (deletedProblem.count === 0) {
    throw new ApiError(404, "Problem not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Problem deleted successfully"));
});

const updateProblem = await asyncHandler(async (req, res) => {});

const getAllProblemsSolvedByUser = await asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const problems = await db.problem.findMany({
    where: {
      SolvedBy: {
        some: {
          userId,
        },
      },
    },
    include: {
      SolvedBy: {
        where: {
          userId,
        },
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, problems, "Problem Fetched Successfully"));
});

export {
  createProblem,
  deleteProblem,
  updateProblem,
  getProblemById,
  getAllProblems,
  getAllProblemsSolvedByUser,
};
