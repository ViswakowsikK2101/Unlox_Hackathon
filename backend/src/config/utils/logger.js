/**
 * CampusFlow Backend - Module 3 (Utilities)
 * File: src/utils/logger.js
 * Description: Centralized logging configuration using Pino.
 */

const pino = require('pino');
const { env } = require('../config/env'); // Assumed exposure from Module 2 env.js

// Configure Pino stream options based on environment
const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'campusflow-backend'
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard'
      }
    }
  })
});

/**
 * ============================================================================
 * ARCHITECTURAL FLOW MARKS
 * ============================================================================
 * * --- BACKEND PROCESSING ---
 * This logger utility serves as the unified engine tracking internal state changes,
 * route executions, performance matrices, and caught errors across the environment.
 * * --- FRONTEND ENTRY POINT ---
 * Tracks payloads coming in from Next.js 15 requests at the middleware/controller line.
 * * --- DATABASE INTEGRATION POINT ---
 * Utilized to log transactions, connection states, and errors with Supabase PostgreSQL.
 * * --- PYTHON AI INTEGRATION POINT ---
 * Logs transactional outbound request vectors and processing results from the Python AI Service.
 * * --- N8N WEBHOOK INTEGRATION POINT ---
 * Traces triggered events dispatched to n8n automation and inbound updates received.
 */

module.exports = logger;