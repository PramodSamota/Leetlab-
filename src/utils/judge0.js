import axios from "axios";
import { ApiError, env } from "../utils/index.js";

export const getJudge0LanguageById = (language) => {
  const languages = {
    PYTHON: 71,
    JAVA: 62,
    JAVASCRIPT: 63,
  };

  return languages[language.toUpperCase()];
};

export const submitBatch = async (submissions) => {
  const { data } = await axios.post(
    `${env.JUDGE0_API_URL}/submissions/batch`,

    { submissions },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return data;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollBatchResult = async (tokens) => {
  try {
    while (true) {
      const { data } = await axios.get(
        `${env.JUDGE0_API_URL}/submissions/batch`,
        {
          params: {
            tokens: tokens.map((t) => t.token).join(","),
            base64_encoded: false,
          },

          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const results = data.submissions;
      const isAllDone = results.every(
        (res) => res.status.id !== 1 && res.status.id !== 2,
      );

      if (isAllDone) return results;
      // console.log("data :", data);
      await sleep(1000);
    }
  } catch (error) {
    console.log("error", error);
    throw new ApiError(500, "Error while polling Judge0 submission");
  }
};

export const getLanguageNameById = (languageId) => {
  const languages = {
    71: "PYTHON",
    62: "JAVA",
    63: "JAVASCRIPT",
    54: "C++ (GCC 9.2.0)",
  };
  return languages[languageId];
};
