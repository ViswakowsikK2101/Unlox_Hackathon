/**
 * CampusFlow Backend - Module 4 (Middleware)
 * File: src/middleware/errorHandler.js
 * Description: Global centralized operational error boundary handling and payload uniform normalization.
 */

const logger = require('../utils/logger');
const responseHelper = require('../utils/response');

/**
 * --- BACKEND PROCESSING ---
 * Global error-catching engine intercepting unhandled middleware throws or asynchronous crashes.
 */
function errorHandler(err, req, res, next) {
  // Extract configuration parameters safely
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected server application exception occurred.';
  
  // Package contextual error trace tracking parameters safely
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  }, 'Global Exception Intercepted');

  /**
   * --- RESPONSE FLOW ---
   * Formats all downstream errors using the established standardized helper layout.
   */
  const contextualErrors = process.env.NODE_ENV === 'development' ? { details: err.stack } : null;
  
  return responseHelper.error(res, message, contextualErrors, statusCode);
}

module.exports = errorHandler;