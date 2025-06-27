import { getAverage } from "../helper/executeCode.helper.js";
import { db } from "../libs/db.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import {
  getJudge0LanguageById,
  pollBatchResult,
  submitBatch,
} from "../utils/judge0.js";
import { testcaseSchema } from "../validator/problem.validate.js";
const ExecutionTypeEnum = {
  RUN: "run",
  SUMBMIT: "submit",
};

const executeCode = asyncHandler(async (req, res) => {
  let { source_code, language, stdin = [] } = req.body;

  const userId = req.user.id;
  const { pid, type } = req.params;

  if (type !== ExecutionTypeEnum.RUN && type !== ExecutionTypeEnum.SUMBMIT) {
    return new ApiError(400, "Invalid execution type");
  }

  const userInfo = await db.user.findUnique({
    where: { id: userId },
    select: { isEmailVerified: true },
  });

  if (!userInfo.isEmailVerified) {
    throw new ApiError(404, "Please verify your email before executing code");
  }

  const language_id = getJudge0LanguageById(language);

  // get testcases and refrence_code for this problem form db
  const inputs = await db.problem.findUnique({
    where: { id: pid },
    select: {
      testcases: true,
      referenceSolutions: true,
    },
  });

  //   console.log("inputs:::", inputs);
  const safeTestCases = testcaseSchema.safeParse(inputs?.testcases);

  if (!safeTestCases.success) {
    throw new ApiError(400, "Invalid test cases");
  }

  const executionResults =
    type === ExecutionTypeEnum.RUN
      ? safeTestCases.data.slice(0, 3)
      : safeTestCases.data;

  const standardDbInput = executionResults.map((testcase) => testcase.input);
  const standardDbOutput = executionResults.map((testcase) => testcase.output);

  //   console.log("standardDbInput", standardDbInput);
  //   console.log("standardDbOutput", standardDbOutput);
  let getExpectedOutput;
  //   if (type === ExecutionTypeEnum.RUN && stdin && stdin.length > 0) {
  //     getExpectedOutput = await handleCustomInput(
  //       stdin,
  //       inputs?.referenceSolutions,
  //       language_id,
  //     );
  //   }

  let finalInput;
  let finalOutput;

  if (type === ExecutionTypeEnum.RUN) {
    finalInput = [...standardDbInput, ...stdin];
    finalOutput = [...standardDbOutput, ...(getExpectedOutput || [])];
  } else {
    finalInput = standardDbInput;
    finalOutput = standardDbOutput;
  }
  //   console.log("finalInput;;", finalInput);
  const submisssions = finalInput.map((input) => ({
    source_code,
    language_id,
    stdin: input,
  }));

  //send batch to judge0
  //   console.log("submisssions..", submisssions);
  const submitResponse = await submitBatch(submisssions);

  const tokens = submitResponse.map((res) => ({ token: res.token }));

  const results = await pollBatchResult(tokens);

  //check the results form juge0 output and expected output is ===
  let allPassedCases = true;
  //   console.log("results::", results);
  const detailedResults = results.map((result, index) => {
    const { stdout } = result;
    const expected_output = finalOutput[index];
    const passedTestCases = stdout?.trim() === expected_output?.trim();
    // console.log(`passedTestCases: ${index + 1} : ${passedTestCases}`);
    if (!passedTestCases) {
      allPassedCases = false;
    }

    return {
      testCases: index + 1,
      passedTestCases,
      stdout,
      expected: expected_output,
      stderr: result.stderr || null,
      compileOutput: result.compile_output || null,
      status: result.status.description,
      memory: result.memory ? `${result.memory} KB` : undefined,
      time: result.time ? `${result.time}s` : undefined,
    };
  });

  //   console.log("allPassedCases", allPassedCases);

  const averageMemory = getAverage(detailedResults.map((r) => r.memory));
  const averageTime = getAverage(detailedResults.map((r) => r.time));

  let submissionData = {
    userId,
    problemId: pid,
    sourceCode: source_code,
    language: language,
    stdin: stdin.join("\n"),
    stdout: JSON.stringify(detailedResults.map((result) => result.stdout)),
    stderr: detailedResults.some((result) => result.stderr)
      ? JSON.stringify(detailedResults.some((result) => result.stderr))
      : null,
    compileOutput: detailedResults.some((result) => result.compileOutput)
      ? JSON.stringify(detailedResults.some((result) => result.compileOutput))
      : null,
    status: allPassedCases ? "Accepted" : "Wrong Answer",
    memory: averageMemory ? `${averageMemory} KB` : null,
    time: averageTime ? `${averageTime}s` : null,
  };

  if (type === ExecutionTypeEnum.RUN) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          submissionData: submissionData,
          testCases: detailedResults,
        },
        "Code executed successfully",
      ),
    );
  }

  const submission = await db.submission.create({
    data: submissionData,
  });

  // if all passed true mark problem solved to true;

  if (allPassedCases) {
    await db.problemSolved.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId: pid,
        },
      },
      update: {},
      create: {
        userId,
        problemId: pid,
      },
    });
  }

  // save individual test case results using detailedResult
  const testCaseResult = detailedResults.map((result) => ({
    submissionId: submission.id,
    testCase: result.testCases,
    passed: result.passedTestCases,
    stdout: result.stdout,
    expected: result.expected ?? "",
    stderr: result.stderr,
    compileOutput: result.compileOutput,
    status: result.status,
    memory: result.memory,
    time: result.time,
  }));

  await db.testCaseResult.createMany({
    data: testCaseResult,
  });

  const submissionWithTestCase = await db.submission.findUnique({
    where: {
      id: submission.id,
    },
    include: {
      TestCaseResult: true,
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        submissionWithTestCase,
        "Code executed successfully",
      ),
    );
});

export { executeCode };
