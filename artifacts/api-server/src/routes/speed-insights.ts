import { Router, type IRouter } from "express";
import { getSpeedInsightsConfig } from "../lib/speed-insights";

const router: IRouter = Router();

/**
 * GET /speed-insights/config
 * Returns Speed Insights configuration for frontend clients
 * 
 * This endpoint allows frontend applications to retrieve
 * Speed Insights configuration from the API server.
 */
router.get("/speed-insights/config", (_req, res) => {
  const config = getSpeedInsightsConfig();
  
  res.json({
    success: true,
    data: config,
  });
});

export default router;
