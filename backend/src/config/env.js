/**
 * =============================================================================
 * FILE: src/config/env.js
 * =============================================================================
 * PURPOSE:
 *   Central environment variable validation and export.
 *   Uses Zod to validate every required variable at server startup.
 *   If any required variable is missing or malformed, the server exits
 *   immediately with a descriptive error — it never starts in a broken state.
 *
 * INTEGRATION POSITION:
 *   This is the FIRST file loaded by the entire application.
 *   Every other config, middleware, service, and utility imports from here.
 *   Nothing in this project reads process.env directly — all env access
 *   goes through the validated `env` object exported from this file.
 *
 * DEPENDENCY GRAPH (who imports this file):
 *   config/supabase.js          → reads SUPABASE_URL, SUPABASE_ANON_KEY,
 *                                  SUPABASE_SERVICE_ROLE_KEY
 *   config/swagger.js           → reads PORT, NODE_ENV
 *   middleware/auth.js          → reads SUPABASE_ANON_KEY (auth token check)
 *   middleware/rateLimiter.js   → reads RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX
 *   middleware/requestLogger.js → reads LOG_LEVEL, NODE_ENV
 *   utils/logger.js             → reads LOG_LEVEL, NODE_ENV
 *   utils/httpClient.js         → reads PYTHON_AI_BASE_URL
 *   webhooks/deadlineWebhook.js → reads N8N_DEADLINE_WEBHOOK
 *   webhooks/noticeWebhook.js   → reads N8N_NOTICE_WEBHOOK
 *   app.js                      → reads ALLOWED_ORIGINS, NODE_ENV
 *   server.js                   → reads PORT, NODE_ENV
 *   services/health.service.js  → reads PYTHON_AI_BASE_URL, N8N_DEADLINE_WEBHOOK
 * =============================================================================
 */

'use strict';

// Load .env file into process.env before anything else reads it.
// In production (Render), variables are injected directly — dotenv is a no-op.
require('dotenv').config();

const { z } = require('zod');

// =============================================================================
// ENVIRONMENT SCHEMA
// =============================================================================
// Every variable the backend needs is declared here.
// Adding a new variable: add it to this schema, then to .env.example and
// environment.md — those three places are the only places that need updating.
// =============================================================================

const envSchema = z.object({

  // ---------------------------------------------------------------------------
  // SERVER
  // ---------------------------------------------------------------------------

  /**
   * PORT — the port Express will bind to.
   * Render injects this automatically in production.
   * Locally: set in .env or defaults to 3000.
   */
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, {
      message: 'PORT must be a valid port number (1–65535)',
    }),

  /**
   * NODE_ENV — controls logging format, Pino pretty-print, and error detail.
   * Accepted: development | production | test
   */
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      errorMap: () => ({
        message: 'NODE_ENV must be one of: development, production, test',
      }),
    })
    .default('development'),

  // ---------------------------------------------------------------------------
  // SUPABASE
  // ---------------------------------------------------------------------------

  /**
   * SUPABASE_URL — the full project URL from Supabase dashboard.
   * Used by the Supabase JS client for all database operations.
   */
  SUPABASE_URL: z
    .string({ required_error: 'SUPABASE_URL is required' })
    .url({ message: 'SUPABASE_URL must be a valid URL' }),

  /**
   * SUPABASE_ANON_KEY — the public anon key.
   * Dual purpose:
   *   1. Passed to the Supabase client for standard (RLS-respecting) queries.
   *   2. Used by auth.middleware.js to validate the Bearer token the frontend
   *      sends — the frontend sends this exact key as its auth token.
   *
   * SWAP POINT: When upgrading to full Supabase JWT auth, auth.middleware.js
   * will verify a proper JWT instead. This variable stays; its role in auth
   * middleware changes. No other file needs to change.
   */
  SUPABASE_ANON_KEY: z
    .string({ required_error: 'SUPABASE_ANON_KEY is required' })
    .min(10, { message: 'SUPABASE_ANON_KEY appears too short — check your value' }),

  /**
   * SUPABASE_SERVICE_ROLE_KEY — the admin/service role key.
   * Bypasses Row Level Security. Used only for privileged internal operations.
   * NEVER logged, NEVER sent to frontend, NEVER included in any response.
   */
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY is required' })
    .min(10, { message: 'SUPABASE_SERVICE_ROLE_KEY appears too short — check your value' }),

  // ---------------------------------------------------------------------------
  // n8n WEBHOOKS
  // ---------------------------------------------------------------------------

  /**
   * N8N_DEADLINE_WEBHOOK — URL for the deadline reminder n8n workflow.
   * Backend POSTs the deadline payload to this URL.
   * Provided by the n8n teammate after their workflow is deployed.
   *
   * ====================================================
   * N8N WEBHOOK ENTRY POINT
   * =======================
   * This variable is the outbound connection point to the
   * n8n deadline reminder automation workflow.
   * Used by: src/webhooks/deadlineWebhook.js
   * ====================================================
   */
  N8N_DEADLINE_WEBHOOK: z
    .string({ required_error: 'N8N_DEADLINE_WEBHOOK is required' })
    .url({ message: 'N8N_DEADLINE_WEBHOOK must be a valid URL' }),

  /**
   * N8N_NOTICE_WEBHOOK — URL for the notice broadcast n8n workflow.
   * Backend POSTs the notice payload to this URL.
   * Provided by the n8n teammate after their workflow is deployed.
   *
   * ====================================================
   * N8N WEBHOOK ENTRY POINT
   * =======================
   * This variable is the outbound connection point to the
   * n8n notice broadcast automation workflow.
   * Used by: src/webhooks/noticeWebhook.js
   * ====================================================
   */
  N8N_NOTICE_WEBHOOK: z
    .string({ required_error: 'N8N_NOTICE_WEBHOOK is required' })
    .url({ message: 'N8N_NOTICE_WEBHOOK must be a valid URL' }),

  // ---------------------------------------------------------------------------
  // PYTHON AI SERVICE
  // ---------------------------------------------------------------------------

  /**
   * PYTHON_AI_BASE_URL — base URL of the Python FastAPI AI service.
   * Backend forwards AI queries to: <PYTHON_AI_BASE_URL>/query
   * Provided by the AI teammate after their service is deployed.
   *
   * ====================================================
   * PYTHON AI ENTRY POINT
   * =====================
   * This variable is the outbound connection point to the
   * Python AI service. Backend acts as a pass-through proxy.
   * Used by: src/utils/httpClient.js
   *          src/services/health.service.js (liveness check)
   * ====================================================
   */
  PYTHON_AI_BASE_URL: z
    .string({ required_error: 'PYTHON_AI_BASE_URL is required' })
    .url({ message: 'PYTHON_AI_BASE_URL must be a valid URL' }),

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------

  /**
   * ALLOWED_ORIGINS — comma-separated list of origins the frontend runs on.
   * Example: http://localhost:3001,https://campusflow.vercel.app
   *
   * ====================================================
   * FRONTEND ENTRY POINT
   * ====================
   * All CORS-allowed origins come from this variable.
   * Only requests from these origins are accepted.
   * Used by: app.js (CORS middleware)
   * ====================================================
   */
  ALLOWED_ORIGINS: z
    .string({ required_error: 'ALLOWED_ORIGINS is required' })
    .min(1, { message: 'ALLOWED_ORIGINS must not be empty' }),

  // ---------------------------------------------------------------------------
  // RATE LIMITING
  // ---------------------------------------------------------------------------

  /** RATE_LIMIT_WINDOW_MS — sliding window in milliseconds. Default: 15 min. */
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: 'RATE_LIMIT_WINDOW_MS must be a positive integer',
    }),

  /** RATE_LIMIT_MAX — max requests per IP per window. Default: 100. */
  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, {
      message: 'RATE_LIMIT_MAX must be a positive integer',
    }),

  // ---------------------------------------------------------------------------
  // LOGGING
  // ---------------------------------------------------------------------------

  /**
   * LOG_LEVEL — Pino log level.
   * Accepted: trace | debug | info | warn | error | fatal | silent
   */
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'], {
      errorMap: () => ({
        message:
          'LOG_LEVEL must be one of: trace, debug, info, warn, error, fatal, silent',
      }),
    })
    .default('info'),
});

// =============================================================================
// VALIDATION — FAIL FAST ON STARTUP
// =============================================================================
// Parse process.env against the schema.
// On failure: print every missing/invalid variable and exit with code 1.
// On success: export the validated, type-safe env object.
// =============================================================================

const _parseResult = envSchema.safeParse(process.env);

if (!_parseResult.success) {
  // Format each Zod error into a readable line
  const errors = _parseResult.error.errors
    .map((e) => `  ✗  ${e.path.join('.')} — ${e.message}`)
    .join('\n');

  // Use process.stderr directly — logger is not yet initialized at this point
  process.stderr.write(
    [
      '',
      '╔══════════════════════════════════════════════════════════════╗',
      '║          CAMPUSFLOW BACKEND — STARTUP FAILURE                ║',
      '║          Environment variable validation failed.             ║',
      '║          Fix the errors below and restart the server.        ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      'Missing or invalid environment variables:',
      '',
      errors,
      '',
      'See environment.md for a full description of every variable.',
      'Copy .env.example to .env and fill in all required values.',
      '',
    ].join('\n'),
  );

  process.exit(1);
}

// =============================================================================
// DERIVED / COMPUTED VALUES
// =============================================================================
// Values derived from validated env vars — avoids repeating this logic
// throughout the codebase.
// =============================================================================

const validated = _parseResult.data;

/**
 * Parsed array of allowed CORS origins.
 * Example input:  "http://localhost:3001,https://campusflow.vercel.app"
 * Example output: ["http://localhost:3001", "https://campusflow.vercel.app"]
 */
const allowedOriginsArray = validated.ALLOWED_ORIGINS
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** True when running locally in development mode. */
const isDevelopment = validated.NODE_ENV === 'development';

/** True when running in production (Render). */
const isProduction = validated.NODE_ENV === 'production';

/** True when running inside the Jest test suite. */
const isTest = validated.NODE_ENV === 'test';

// =============================================================================
// EXPORT
// =============================================================================
// All downstream code imports `env` from this file.
// Direct process.env reads elsewhere in the codebase are not permitted.
// =============================================================================

const env = {
  // Server
  PORT:     validated.PORT,
  NODE_ENV: validated.NODE_ENV,

  // Supabase
  SUPABASE_URL:              validated.SUPABASE_URL,
  SUPABASE_ANON_KEY:         validated.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: validated.SUPABASE_SERVICE_ROLE_KEY,

  // n8n webhooks
  N8N_DEADLINE_WEBHOOK: validated.N8N_DEADLINE_WEBHOOK,
  N8N_NOTICE_WEBHOOK:   validated.N8N_NOTICE_WEBHOOK,

  // Python AI service
  PYTHON_AI_BASE_URL: validated.PYTHON_AI_BASE_URL,

  // CORS
  ALLOWED_ORIGINS:       validated.ALLOWED_ORIGINS,
  allowedOriginsArray,   // pre-parsed array — use this in app.js

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: validated.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX:       validated.RATE_LIMIT_MAX,

  // Logging
  LOG_LEVEL: validated.LOG_LEVEL,

  // Derived flags
  isDevelopment,
  isProduction,
  isTest,
};

module.exports = env;
