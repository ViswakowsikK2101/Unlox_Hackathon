/**
 * =============================================================================
 * FILE: src/config/supabase.js
 * =============================================================================
 * PURPOSE:
 *   Creates and exports two Supabase client instances:
 *
 *   1. `supabase`  — anon/public client.
 *      Uses SUPABASE_ANON_KEY. Respects Row Level Security policies.
 *      Used by repositories for all standard CRUD operations.
 *
 *   2. `supabaseAdmin` — service role / admin client.
 *      Uses SUPABASE_SERVICE_ROLE_KEY. Bypasses Row Level Security.
 *      Used ONLY for privileged operations that cannot be performed
 *      under the anon key (e.g., cross-student admin queries, health checks).
 *      NEVER expose the admin client or its key to the frontend.
 *
 * SINGLETON PATTERN:
 *   Both clients are created once at module load time and reused across
 *   the entire application. This avoids creating a new client per request,
 *   which would be wasteful and could exhaust connection limits.
 *
 * INTEGRATION POSITION:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │                    DATABASE READ / WRITE                    │
 *   │                                                             │
 *   │  repositories/*.repository.js                               │
 *   │       └── imports { supabase } from config/supabase.js      │
 *   │                                                             │
 *   │  services/health.service.js                                 │
 *   │       └── imports { supabaseAdmin } for ping check          │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * DEPENDENCY:
 *   src/config/env.js — must be loaded and validated before this file runs.
 *   (env.js is loaded first in app.js, so this is always guaranteed.)
 *
 * WHO IMPORTS THIS FILE:
 *   src/repositories/student.repository.js    → supabase
 *   src/repositories/task.repository.js       → supabase
 *   src/repositories/notice.repository.js     → supabase
 *   src/repositories/automationLog.repository.js → supabase
 *   src/services/health.service.js            → supabaseAdmin (ping)
 * =============================================================================
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const env             = require('./env');

// =============================================================================
// CLIENT 1 — ANON CLIENT (Standard / RLS-respecting)
// =============================================================================
//
// Use this client for all normal repository operations.
// All queries run under the RLS policies defined in database/supabase/rls.sql.
//
// ====================================================
// DATABASE READ / WRITE ENTRY POINT
// ==================================
// Every repository in this project connects to Supabase
// through this client. RLS policies govern what each
// query can read or modify.
// ====================================================
//
// =============================================================================

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      /**
       * persistSession: false
       * The backend is a stateless REST API — it does not maintain user
       * sessions between requests. Disabling session persistence prevents
       * the Supabase client from attempting to read/write localStorage
       * (which doesn't exist in Node.js) and keeps the client stateless.
       */
      persistSession: false,

      /**
       * autoRefreshToken: false
       * Token refresh is irrelevant for a backend service that uses a
       * static anon key. Disabling it prevents unnecessary background work.
       */
      autoRefreshToken: false,

      /**
       * detectSessionInUrl: false
       * OAuth redirect detection is a browser-only feature. Disabling it
       * prevents the client from trying to parse window.location (which
       * does not exist in Node.js).
       */
      detectSessionInUrl: false,
    },
    db: {
      /**
       * schema: 'public'
       * All CampusFlow tables live in the default public schema.
       * Explicitly setting this makes the intent clear and avoids
       * accidental queries against other schemas.
       */
      schema: 'public',
    },
    global: {
      headers: {
        /**
         * Custom header to identify all backend requests in Supabase logs.
         * Useful when debugging which requests came from this service
         * versus direct frontend calls.
         */
        'x-application-name': 'campusflow-backend',
      },
    },
  },
);

// =============================================================================
// CLIENT 2 — ADMIN CLIENT (Service Role / RLS-bypassing)
// =============================================================================
//
// Use this client ONLY when RLS policies would block a legitimate operation
// that the backend needs to perform with elevated privileges.
//
// Current uses:
//   - health.service.js: pings the database to confirm connectivity
//     (the anon key's RLS policies may prevent a bare SELECT 1)
//
// ⚠️  SECURITY WARNING:
//   The service role key bypasses ALL Row Level Security policies.
//   Misusing this client could expose data from other users/rows.
//   Always prefer `supabase` (anon client) in repositories.
//   Only reach for `supabaseAdmin` when there is no alternative.
//
// ====================================================
// DATABASE ADMIN ENTRY POINT
// ==========================
// This client is used only for privileged internal
// operations. It is NEVER used to process frontend
// requests directly. Never send its responses to the
// frontend without scrubbing for sensitive fields.
// ====================================================
//
// =============================================================================

const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession:    false,
      autoRefreshToken:  false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'campusflow-backend-admin',
      },
    },
  },
);

// =============================================================================
// CONNECTION VERIFICATION (non-blocking)
// =============================================================================
// Perform a lightweight check at startup to confirm the Supabase project
// is reachable. This is advisory only — it logs a warning but does NOT
// prevent the server from starting, because the database might recover
// within seconds of startup (e.g., cold start on free-tier Supabase).
//
// A definitive health status is available at: GET /health
// =============================================================================

(async () => {
  try {
    // Use the admin client for this check since the anon client's RLS
    // policies might reject a bare query against system tables.
    // We query a single row from the students table with a limit of 0
    // just to verify the connection is alive — we don't need any data.
    const { error } = await supabaseAdmin
      .from('students')
      .select('id')
      .limit(0);

    if (error) {
      // Log the warning but do not throw — the server can still start.
      // Health endpoint will reflect this as degraded.
      process.stderr.write(
        `[supabase] ⚠  Startup connectivity check failed: ${error.message}\n` +
        `[supabase]    The server will continue starting. ` +
        `Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.\n`,
      );
    } else {
      process.stdout.write('[supabase] ✓  Database connection verified.\n');
    }
  } catch (err) {
    // Network-level failure (e.g., bad SUPABASE_URL, no internet).
    process.stderr.write(
      `[supabase] ⚠  Could not reach Supabase at startup: ${err.message}\n`,
    );
  }
})();

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
  /**
   * supabase — the standard anon client.
   * Import this in ALL repositories for CRUD operations.
   *
   * @example
   * const { supabase } = require('../config/supabase');
   * const { data, error } = await supabase.from('students').select('*');
   */
  supabase,

  /**
   * supabaseAdmin — the service role client.
   * Import ONLY when elevated privileges are explicitly required.
   * Do NOT use in controllers or routes — only in services or health checks.
   *
   * @example
   * const { supabaseAdmin } = require('../config/supabase');
   * const { error } = await supabaseAdmin.from('students').select('id').limit(0);
   */
  supabaseAdmin,
};
