/**
 * Speed Insights Configuration
 * 
 * Vercel Speed Insights is primarily designed for frontend applications.
 * This module provides utilities for integrating Speed Insights with this API server.
 * 
 * Note: Speed Insights tracks client-side Web Vitals (LCP, FID, CLS, etc.)
 * For an API server, this is most useful when:
 * - Serving HTML pages that need performance tracking
 * - Providing configuration to frontend clients
 */

/**
 * Speed Insights configuration object
 */
export const speedInsightsConfig = {
  /**
   * Enable debug mode in development
   */
  debug: process.env.NODE_ENV === "development",
  
  /**
   * Sample rate for events (0.0 to 1.0)
   * Default: 1.0 (100% of events)
   */
  sampleRate: 1.0,
  
  /**
   * Framework identifier (if applicable)
   */
  framework: "express",
};

/**
 * Returns the Speed Insights script injection code for HTML responses
 * @returns HTML script tags for Speed Insights
 */
export function getSpeedInsightsScript(): string {
  const analyticsId = process.env.VERCEL_ANALYTICS_ID;
  
  if (!analyticsId) {
    return "";
  }

  return `
    <script>
      window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.${speedInsightsConfig.debug ? 'debug.' : ''}js"></script>
  `.trim();
}

/**
 * Get Speed Insights configuration for frontend clients
 * @returns Configuration object that can be sent to frontend clients
 */
export function getSpeedInsightsConfig() {
  return {
    enabled: !!process.env.VERCEL_ANALYTICS_ID,
    analyticsId: process.env.VERCEL_ANALYTICS_ID,
    config: speedInsightsConfig,
  };
}
