import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// In production, restrict to the Replit-assigned domains (REPLIT_DOMAINS is a
// comma-separated list of hostnames). In development every origin is allowed.
const productionOrigins: string[] = process.env.REPLIT_DOMAINS
  ? process.env.REPLIT_DOMAINS.split(",").flatMap((d) => [
      `https://${d.trim()}`,
      `http://${d.trim()}`,
    ])
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / server-to-server
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (productionOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin "${origin}" not allowed by CORS`));
    },
    credentials: true,
  }),
);

// ── STRUCTURED LOGGING ──────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Express 5 forwards async route errors here automatically.
// The four-argument signature is required for Express to recognise this as an
// error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
});

export default app;
