import express, { Application, Request, Response, NextFunction } from "express";
import dotenvFlow from "dotenv-flow";
import { testConnection } from "./repository/database";

import routes from "./routes";
import { disconnect } from "node:cluster";
import { setupDocs } from "../util/documentation";
import cors from "cors";

dotenvFlow.config();

// Create Express application
const app: Application = express();

/**
 * Sets up CORS handling.
 */
function setupCors() {
  app.use(
    cors({
      origin: "*",

      methods: "GET, PUT, POST, DELETE",

      allowedHeaders: [
        "auth-token",
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
      ],

      credentials: true,
    }),
  );
}

export function startServer() {
  setupCors();

  // Allow larger JSON payloads so base64 images can be posted from the frontend.
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use("/api", routes);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === "entity.too.large" || err?.status === 413) {
      res.status(413).json({
        error: "Uploaded image is too large. Please choose a smaller image.",
      });
      return;
    }

    next(err);
  });

  setupDocs(app);

  testConnection();

  const PORT: number = parseInt(process.env.PORT as string) || 4000;
  app.listen(PORT, function () {
    console.log("Server is running on port:" + PORT);
  });
}
