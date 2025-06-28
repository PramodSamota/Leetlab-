import { ApiResponse, asyncHandler, logger } from "../utils/index.js";
import { db } from "../libs/db.js";

const getAllSubmissions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const submissions = await db.submission.findMany({
    where: {
      userId,
    },
  });

  const getProblemDetails = submissions.map(async (submission) => {
    const problem = await db.problem.findUnique({
      where: {
        id: submission.problemId,
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true,
      },
    });

    const { problemId, ...restSubmission } = submission;

    return {
      ...restSubmission,
      problem,
    };
  });
  const resolvedSubmissions = await Promise.all(getProblemDetails);
  logger.info("All Submissions Fetched Successfully");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        resolvedSubmissions,
        "All Submissions Fetched Succesfully",
      ),
    );
});

const getAllSubmissionForProblem = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const userId = req.user.id;
  const submissions = await db.submission.findMany({
    where: {
      userId,
      problemId: pid,
    },
  });
  logger.info("Submissions for the problem Fetched Successfully");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        submissions,
        "Submissions for the problem Fetched Successfully",
      ),
    );
});

const getAllTheSubmissionForProblem = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const submission = await db.submission.count({
    where: {
      problemId: pid,
    },
  });
  res
    .status(200)
    .json(
      new ApiResponse(200, submission, "Submission Count Fetched Successfully"),
    );
});

export {
  getAllSubmissions,
  getAllTheSubmissionForProblem,
  getAllSubmissionForProblem,
};
