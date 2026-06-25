/**
 * CampusFlow Backend - Module 4 (Middleware)
 * File: src/middleware/rateLimiter.js
 * Description: Application security layer restricting request abuse using express-rate-limit.
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const responseHelper = require('../utils/response');

/**
 * --- FRONTEND ENTRY POINT ---
 * Global middleware configuration tracking Next.js client invocation thresholds.
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Standard 15 minute observation windows
  max: 100, // Caps maximum allowances dynamically down to 100 executions per frame window block
  standardHeaders: true, // Appends security info parameters on response header properties (X-RateLimit-* headers)
  legacyHeaders: false, // Disables legacy header trackers
  
  handler: (req, res) => {
    logger.warn({ ip: req.ip, url: req.originalUrl }, 'Rate limit window policy threshold reached by client');
    
    /**
     * --- RESPONSE FLOW ---
     * Sends standardized client response tracking block info down the line.
     */
    return responseHelper.error(
      res, 
      'Too many connection request payloads submitted. Please retry again after 15 minutes have elapsed.', 
      null, 
      429
    );
  }
});

module.exports = apiRateLimiter;