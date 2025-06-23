import { z } from "zod";
// import { jsonSchema } from "./json.validation";
// import { Prisma } from "@prisma/client";

const Difficulty = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
};

export const testcaseSchema = z.array(
  z.object({
    input: z.string(),
    output: z.string(),
  }),
);

const createProblemSchema = z.object({
  title: z.string().nonempty({ message: "Title is required" }),
  description: z.string().nonempty({ message: "Description is required" }),
  difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD], {
    errorMap: () => ({ message: "Difficulty must be EASY, MEDIUM, or HARD" }),
  }),
  tags: z
    .array(z.string())
    .nonempty({ message: "At least one tag is required" }),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional(),
    }),
  ), // will refine this with a stricter structure
  constraints: z.string().nonempty({ message: "Constraints are required" }),
  editorial: z.string().optional(),
  hints: z.string().optional(),
  testcases: testcaseSchema.nonempty({
    message: "At least one test case is required",
  }),
  codeSnippets: z.any(),
  referenceSolutions: z.any(),
});

const validateCreateProblem = (data) => {
  return createProblemSchema.safeParse(data);
};

export { validateCreateProblem };
