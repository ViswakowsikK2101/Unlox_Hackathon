/**
 * CampusFlow Backend - Module 4 (Middleware)
 * File: src/middleware/validationMiddleware.js
 * Description: Zod schema parsing intercept validation wrapper module.
 */

const logger = require('../utils/logger');
const responseHelper = require('../utils/response');

/**
 * --- REQUEST VALIDATION ---
 * High-order request structural payload validator wrapping execution with Zod schemas.
 * @param {ZodSchema} schema - Zod compilation target blueprint validation object.
 */
const validate = (schema) => async (req, res, next) => {
  try {
    /**
     * --- BACKEND PROCESSING ---
     * Evaluates full target incoming express HTTP boundaries simultaneously.
     */
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Remap parsed execution objects directly to enforce verified contract definitions
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;

    return next();
  } catch (error) {
    /**
     * --- FRONTEND ENTRY POINT ---
     * Detects validation failure and instantly formats execution metadata for the UI layout.
     */
    if (error.errors) {
      logger.warn({ path: req.originalUrl, errors: error.errors }, 'Inbound request parameter payload validation rejected');
      
      const structuredErrors = error.errors.map(err => ({
        field: err.path.slice(1).join('.'),
        rule: err.code,
        message: err.message
      }));

      /**
       * --- RESPONSE FLOW ---
       * Drops handling processing early returning specialized validation structure details.
       */
      return responseHelper.validationError(res, 'Invalid request input parameter criteria constraints encountered.', structuredErrors);
    }

    // Forward unexpected framework compilation exceptions downward into the general error catch boundary
    return next(error);
  }
};

module.exports = validate;