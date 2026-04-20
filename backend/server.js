import express from "express";
import cors from "cors";
import { config } from "./config/config.js";
import router from "./routes/index.js";
import { logger } from "./logs/logger.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);

app.listen(config.port, () => {
  logger.info(`Tally Middleware server running on http://localhost:${config.port}`);
  logger.info(`Tally endpoint: ${config.tally.url}`);
  logger.info(`Run POST /api/middleware/check to validate all Tally data`);
});
