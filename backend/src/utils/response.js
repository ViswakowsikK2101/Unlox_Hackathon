/**
 * CampusFlow Backend - Module 3 (Utilities)
 * File: src/utils/response.js
 * Description: Standardized API response format helper for predictable client communication.
 */

/**
 * Format structure for unified REST responses.
 * * @param {boolean} success - Operation status flag
 * @param {string} message - Human-readable informational feedback string
 * @param {Object|Array|null} [data=null] - Payload returned to client
 * @param {Object|null} [errors=null] - Structured validation or contextual errors
 */
const formatResponse = (success, message, data = null, errors = null) => {
  return {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== null && { data }),
    ...(errors !== null && { errors })
  };
};

const responseHelper = {
  /**
   * --- RESPONSE FLOW ---
   * Sends a 200 OK structural response payload back to the requester.
   */
  success: (res, message = 'Operation completed successfully.', data = null, statusCode = 200) => {
    return res.status(statusCode).json(formatResponse(true, message, data));
  },

  /**
   * --- RESPONSE FLOW ---
   * Sends a 201 Created structural response payload back to the requester.
   */
  created: (res, message = 'Resource created successfully.', data = null) => {
    return res.status(201).json(formatResponse(true, message, data));
  },

  /**
   * --- RESPONSE FLOW ---
   * Captures and bubbles errors through a consistent payload interface down to the client tier.
   */
  error: (res, message = 'An unexpected error occurred.', errors = null, statusCode = 500) => {
    return res.status(statusCode).json(formatResponse(false, message, null, errors));
  },

  /**
   * --- FRONTEND ENTRY POINT ---
   * Specifically handles validation error formatting (e.g., Zod compilation lists) 
   * to provide the Next.js UI engine actionable contextual layout rendering info.
   */
  validationError: (res, message = 'Validation constraints breached.', errors = null) => {
    return res.status(400).json(formatResponse(false, message, null, errors));
  }
};

/**
 * ============================================================================
 * ARCHITECTURAL FLOW MARKS
 * ============================================================================
 * * --- BACKEND PROCESSING ---
 * Normalizes all output handlers, bypassing varying local structures to ensure 
 * consistent JSON output signatures for both successful outputs and exceptions.
 */

module.exports = responseHelper;