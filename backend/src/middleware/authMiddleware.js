/**
 * CampusFlow Backend - Module 4 (Middleware)
 * File: src/middleware/authMiddleware.js
 * Description: Authentication middleware handling isolation for the hackathon MVP.
 */

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const responseHelper = require('../utils/response');

/**
 * --- AUTHENTICATION ENTRY POINT ---
 * Intercepts incoming requests to validate user identity.
 * This is structurally isolated so that the temporary hackathon extraction code 
 * can be seamlessly replaced with a production Supabase JWT verification payload later.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication attempt blocked: Missing or malformed authorization header');
    return responseHelper.error(res, 'Authentication token required.', null, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    /**
     * --- DATABASE ENTRY POINT ---
     * Temporary isolated verification strategy for the hackathon MVP.
     * Retreives the session user context directly utilizing the Supabase client.
     */
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error({ error: error?.message }, 'Supabase auth validation failure');
      return responseHelper.error(res, 'Invalid or expired authentication token.', null, 401);
    }

    // Bind user context globally across the remaining request processing pipeline
    req.user = user;

    /**
     * --- BACKEND PROCESSING ---
     * Request validated safely. Handing over to subsequent middleware or controllers.
     */
    return next();
  } catch (err) {
    logger.error({ err: err.message }, 'Unexpected exception caught during authentication lifecycle');
    return responseHelper.error(res, 'Internal authentication verification error.', null, 500);
  }
}

module.exports = authMiddleware;