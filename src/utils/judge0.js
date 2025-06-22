import axios from "axios";
import {env} from "../utils/index.js"

export const getJudge0LanguageById = (language) => {
  const languages = {
    PYTHON: 71,
    JAVA: 62,
    JAVASCRIPT: 63,
    "C++ (GCC 9.2.0)": 54,
  };

  return languages[language.toUpperCase()];
};

export const submitBatch = async(submissions){
   const {data} = await axios.post(`${env.JUDGE0_API_URL}/submissions/batch`,{
    submissions},
    {
        headers:{
            "Content-Type":"application/json",
           
        },
    },
   )
   return data;
}

export const pollBatchResult = async(tokens) =>{
  try {
     
    while(true)
    const {data} = await axios.get(`${env.JUDGE0_API_URL}/submissions/batch`,{
      params:tokens.map((t) =>t.token).join(","),
      base64_encoded:false,
    },
    headers: {
      "Content-Type":"application/json",
    }
  ) 
  
  } catch (error) {
    
  }
}
