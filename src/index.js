import { app } from "./app.js";
import dotenv from "dotenv";
import { env } from "./utils/env.js";

dotenv.config();

const PORT = env.PORT ?? 1000;

app.listen(PORT, () => {
  console.log(`App is listen on Port: ${PORT}`);
});
