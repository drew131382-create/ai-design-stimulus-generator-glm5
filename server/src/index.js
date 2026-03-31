import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/generateRoutes.js";
import { env } from "./utils/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
const normalizeOrigin = (value) =>
  value.trim().replace(/\/$/, "").toLowerCase();

const allowedOrigins = env.ALLOWED_ORIGIN
  ? env.ALLOWED_ORIGIN.split(",").map((origin) => normalizeOrigin(origin))
  : [];

const isHostedFrontend = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".onrender.com")
    );
  } catch {
    return false;
  }
};

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : "";

      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(normalizedOrigin) ||
        isHostedFrontend(origin)
      ) {
        callback(null, true);
        return;
      }

      const corsError = new Error("Origin not allowed by CORS");
      corsError.statusCode = 403;
      callback(corsError);
    }
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
