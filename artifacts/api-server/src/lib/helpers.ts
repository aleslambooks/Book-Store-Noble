import { Request } from "express";

/**
 * Extracts the real client IP address, preferring the X-Forwarded-For header
 * (set by reverse proxies like Nginx, Replit, Vercel, Railway).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "";
}
