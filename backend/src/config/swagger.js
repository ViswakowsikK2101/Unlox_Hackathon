/**
 * =============================================================================
 * FILE: src/config/swagger.js
 * =============================================================================
 * PURPOSE:
 *   Defines the Swagger/OpenAPI 3.0 specification for the entire CampusFlow
 *   backend API and wires up the interactive documentation UI.
 *
 *   Exposed at: GET /api/docs  (HTML interface via swagger-ui-express)
 *               GET /api/docs.json (raw OpenAPI JSON spec)
 *
 * HOW IT WORKS:
 *   swagger-jsdoc scans every route file for JSDoc @openapi annotations
 *   and merges them with the base definition declared here. The combined
 *   spec is served by swagger-ui-express at /api/docs.
 *
 * INTEGRATION POSITION:
 *   This config is applied in app.js after all routes are registered.
 *   It reads from env.js for server URL and port.
 *
 * ====================================================
 * FRONTEND ENTRY POINT
 * ====================
 * The frontend team can use /api/docs to explore all
 * available endpoints, request shapes, and response
 * contracts without reading source code.
 * ====================================================
 *
 * WHO IMPORTS THIS FILE:
 *   app.js — mounts swagger-ui-express using the spec returned here
 *
 * ADDING NEW ENDPOINTS TO SWAGGER:
 *   Add JSDoc @openapi comments directly in the route file.
 *   swagger-jsdoc will pick them up automatically on next restart.
 *   See src/routes/*.routes.js for examples.
 * =============================================================================
 */

'use strict';

const swaggerJsdoc      = require('swagger-jsdoc');
const swaggerUiExpress  = require('swagger-ui-express');
const env               = require('./env');

// =============================================================================
// SERVER URL CONSTRUCTION
// =============================================================================
// Build the server URL shown in the Swagger UI "Servers" dropdown.
// In development: http://localhost:<PORT>
// In production:  the Render service URL (set via SERVER_URL env var if needed,
//                 otherwise falls back to localhost for safety)
// =============================================================================

const serverUrl = env.isProduction
  ? process.env.SERVER_URL || `https://campusflow-backend.onrender.com`
  : `http://localhost:${env.PORT}`;

// =============================================================================
// OPENAPI BASE DEFINITION
// =============================================================================
// This object defines the top-level metadata for the OpenAPI 3.0 document.
// Individual endpoint definitions live as JSDoc annotations in route files.
// =============================================================================

const swaggerDefinition = {
  openapi: '3.0.0',

  // ---------------------------------------------------------------------------
  // API Metadata
  // ---------------------------------------------------------------------------
  info: {
    title:   'CampusFlow Backend API',
    version: '1.0.0',
    description: `
## CampusFlow Backend — CampusAI Hackathon 2025

This is the central backend API for the CampusFlow project.
It serves as the communication layer between:

- **Frontend** (Next.js 15 + TypeScript)
- **Supabase PostgreSQL** (database)
- **Python AI Service** (AI query processing)
- **n8n Automation** (WhatsApp reminders + Google Calendar)

### Authentication
All protected endpoints require a Bearer token in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <SUPABASE_ANON_KEY>
\`\`\`

### Response Format
All responses follow a consistent envelope:
\`\`\`json
{
  "success": true | false,
  "message": "Human-readable status message",
  "data": {} | null,
  "errors": [] (only on validation failure)
}
\`\`\`

### Rate Limiting
100 requests per IP per 15-minute window.
Exceeding the limit returns HTTP 429.

### API Versioning
All endpoints are prefixed with \`/api/v1\`.
Breaking changes will be introduced under \`/api/v2\`.
    `,
    contact: {
      name:  'CampusFlow Team',
      email: 'team@campusflow.dev',
    },
    license: {
      name: 'MIT',
    },
  },

  // ---------------------------------------------------------------------------
  // Servers
  // ---------------------------------------------------------------------------
  servers: [
    {
      url:         serverUrl,
      description: env.isProduction ? 'Production (Render)' : 'Local Development',
    },
    {
      url:         'https://campusflow-backend.onrender.com',
      description: 'Production (Render)',
    },
    {
      url:         'http://localhost:3000',
      description: 'Local Development',
    },
  ],

  // ---------------------------------------------------------------------------
  // Security Scheme
  // ---------------------------------------------------------------------------
  components: {
    securitySchemes: {
      /**
       * BearerAuth — the auth scheme used by all protected endpoints.
       * The frontend sends: Authorization: Bearer <SUPABASE_ANON_KEY>
       *
       * ====================================================
       * FRONTEND ENTRY POINT
       * ====================
       * This is the authentication contract between the
       * frontend and the backend. The anon key is the token.
       * See: src/middleware/auth.js for verification logic.
       * ====================================================
       */
      BearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'TOKEN',
        description:  'Pass SUPABASE_ANON_KEY as the Bearer token.',
      },
    },

    // -------------------------------------------------------------------------
    // Reusable Schemas
    // -------------------------------------------------------------------------
    schemas: {

      // -----------------------------------------------------------------------
      // Success Response Envelope
      // -----------------------------------------------------------------------
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string',  example: 'Operation completed successfully' },
          data:    { type: 'object',  nullable: true },
        },
        required: ['success', 'message'],
      },

      // -----------------------------------------------------------------------
      // Error Response Envelope
      // -----------------------------------------------------------------------
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string',  example: 'Something went wrong' },
          errors:  {
            type:  'array',
            items: {
              type: 'object',
              properties: {
                field:   { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
              },
            },
          },
        },
        required: ['success', 'message'],
      },

      // -----------------------------------------------------------------------
      // Student
      // -----------------------------------------------------------------------
      Student: {
        type: 'object',
        properties: {
          id:        { type: 'string',         format: 'uuid',      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          name:      { type: 'string',                              example: 'Arjun Sharma' },
          email:     { type: 'string',         format: 'email',     example: 'arjun@college.edu' },
          phone:     { type: 'string',                              example: '+919876543210',  description: 'E.164 format' },
          branch:    { type: 'string',                              example: 'CSE' },
          year:      { type: 'integer',        minimum: 1, maximum: 6, example: 2 },
          subjects:  { type: 'array', items: { type: 'string' },   example: ['DSA', 'OS', 'DBMS'] },
          createdAt: { type: 'string',         format: 'date-time', example: '2025-01-01T00:00:00Z' },
          updatedAt: { type: 'string',         format: 'date-time', example: '2025-01-01T00:00:00Z' },
        },
        required: ['id', 'name', 'email', 'phone', 'branch', 'year', 'subjects', 'createdAt', 'updatedAt'],
      },

      CreateStudentRequest: {
        type: 'object',
        properties: {
          name:     { type: 'string',                              example: 'Arjun Sharma' },
          email:    { type: 'string',         format: 'email',     example: 'arjun@college.edu' },
          phone:    { type: 'string',                              example: '+919876543210', description: 'Must be E.164 format' },
          branch:   { type: 'string',                              example: 'CSE' },
          year:     { type: 'integer',        minimum: 1, maximum: 6, example: 2 },
          subjects: { type: 'array', items: { type: 'string' },   example: ['DSA', 'OS', 'DBMS'] },
        },
        required: ['name', 'email', 'phone', 'branch', 'year', 'subjects'],
      },

      UpdateStudentRequest: {
        type: 'object',
        description: 'All fields are optional. Only provided fields will be updated.',
        properties: {
          name:     { type: 'string',                              example: 'Arjun Sharma' },
          email:    { type: 'string',         format: 'email',     example: 'arjun@college.edu' },
          phone:    { type: 'string',                              example: '+919876543210' },
          branch:   { type: 'string',                              example: 'CSE' },
          year:     { type: 'integer',        minimum: 1, maximum: 6, example: 2 },
          subjects: { type: 'array', items: { type: 'string' },   example: ['DSA', 'OS'] },
        },
      },

      // -----------------------------------------------------------------------
      // Task
      // -----------------------------------------------------------------------
      Task: {
        type: 'object',
        properties: {
          id:             { type: 'string',  format: 'uuid',      example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
          title:          { type: 'string',                       example: 'Complete DSA Assignment' },
          subject:        { type: 'string',                       example: 'DSA' },
          deadline:       { type: 'string',  format: 'date-time', example: '2025-08-01T18:00:00Z' },
          reminderTime:   { type: 'string',  format: 'date-time', example: '2025-08-01T10:00:00Z', nullable: true },
          addToCalendar:  { type: 'boolean',                      example: true },
          studentId:      { type: 'string',  format: 'uuid',      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          createdAt:      { type: 'string',  format: 'date-time', example: '2025-01-01T00:00:00Z' },
          updatedAt:      { type: 'string',  format: 'date-time', example: '2025-01-01T00:00:00Z' },
        },
        required: ['id', 'title', 'subject', 'deadline', 'addToCalendar', 'studentId', 'createdAt', 'updatedAt'],
      },

      CreateTaskRequest: {
        type: 'object',
        properties: {
          title:         { type: 'string',  example: 'Complete DSA Assignment' },
          subject:       { type: 'string',  example: 'DSA' },
          deadline:      { type: 'string',  format: 'date-time', example: '2025-08-01T18:00:00Z' },
          reminderTime:  { type: 'string',  format: 'date-time', example: '2025-08-01T10:00:00Z', nullable: true },
          addToCalendar: { type: 'boolean', example: true },
          studentId:     { type: 'string',  format: 'uuid',      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        },
        required: ['title', 'subject', 'deadline', 'studentId'],
      },

      UpdateTaskRequest: {
        type: 'object',
        description: 'All fields optional. Only provided fields will be updated.',
        properties: {
          title:         { type: 'string',  example: 'Complete DSA Assignment' },
          subject:       { type: 'string',  example: 'DSA' },
          deadline:      { type: 'string',  format: 'date-time', example: '2025-08-01T18:00:00Z' },
          reminderTime:  { type: 'string',  format: 'date-time', example: '2025-08-01T10:00:00Z', nullable: true },
          addToCalendar: { type: 'boolean', example: true },
        },
      },

      // -----------------------------------------------------------------------
      // Notice
      // -----------------------------------------------------------------------
      Notice: {
        type: 'object',
        properties: {
          id:          { type: 'string', format: 'uuid',       example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' },
          title:       { type: 'string',                       example: 'Mid-term Exam Schedule' },
          noticeText:  { type: 'string',                       example: 'Mid-term exams begin from August 10th.' },
          eventDate:   { type: 'string', format: 'date-time',  example: '2025-08-10T09:00:00Z', nullable: true },
          createdAt:   { type: 'string', format: 'date-time',  example: '2025-01-01T00:00:00Z' },
          updatedAt:   { type: 'string', format: 'date-time',  example: '2025-01-01T00:00:00Z' },
        },
        required: ['id', 'title', 'noticeText', 'createdAt', 'updatedAt'],
      },

      CreateNoticeRequest: {
        type: 'object',
        properties: {
          title:      { type: 'string', example: 'Mid-term Exam Schedule' },
          noticeText: { type: 'string', example: 'Mid-term exams begin from August 10th.' },
          eventDate:  { type: 'string', format: 'date-time', example: '2025-08-10T09:00:00Z', nullable: true },
        },
        required: ['title', 'noticeText'],
      },

      // -----------------------------------------------------------------------
      // Automation
      // -----------------------------------------------------------------------

      /**
       * ====================================================
       * N8N WEBHOOK ENTRY POINT
       * =======================
       * DeadlineTriggerRequest is the exact payload the
       * backend forwards to n8n. The contract is frozen —
       * any change here must also be reflected in the n8n
       * workflow trigger node.
       * ====================================================
       */
      DeadlineTriggerRequest: {
        type: 'object',
        description: 'Payload forwarded verbatim to the n8n deadline reminder webhook.',
        properties: {
          studentName:         { type: 'string',  example: 'Arjun Sharma' },
          phone:               { type: 'string',  example: '+919876543210', description: 'E.164 format' },
          subject:             { type: 'string',  example: 'DSA' },
          taskTitle:           { type: 'string',  example: 'Complete DSA Assignment' },
          deadline:            { type: 'string',  format: 'date-time', example: '2025-08-01T18:00:00Z' },
          reminderOffsetHours: { type: 'integer', example: 24, description: 'Hours before deadline to send reminder' },
        },
        required: ['studentName', 'phone', 'subject', 'taskTitle', 'deadline', 'reminderOffsetHours'],
      },

      NoticeTriggerRequest: {
        type: 'object',
        description: 'Payload forwarded verbatim to the n8n notice broadcast webhook.',
        properties: {
          title:      { type: 'string', example: 'Mid-term Exam Schedule' },
          noticeText: { type: 'string', example: 'Mid-term exams begin from August 10th.' },
          eventDate:  { type: 'string', format: 'date-time', example: '2025-08-10T09:00:00Z', nullable: true },
        },
        required: ['title', 'noticeText'],
      },

      /**
       * ====================================================
       * WAITING FOR CALLBACK
       * ====================
       * AutomationCallbackRequest is the payload n8n sends
       * back to POST /api/v1/automation/callback after the
       * workflow completes (success or failure).
       * ====================================================
       */
      AutomationCallbackRequest: {
        type: 'object',
        description: 'Payload sent by n8n to the backend callback endpoint after workflow completion.',
        properties: {
          logId:           { type: 'string', format: 'uuid', example: 'd4e5f6a7-b8c9-0123-defa-234567890123' },
          workflowName:    { type: 'string', example: 'deadline_reminder' },
          status:          { type: 'string', enum: ['success', 'failed'], example: 'success' },
          responsePayload: { type: 'object', example: { whatsappMessageId: 'wam_xxx' }, nullable: true },
        },
        required: ['logId', 'workflowName', 'status'],
      },

      AutomationLog: {
        type: 'object',
        properties: {
          id:              { type: 'string', format: 'uuid',       example: 'd4e5f6a7-b8c9-0123-defa-234567890123' },
          workflowName:    { type: 'string',                       example: 'deadline_reminder' },
          status:          { type: 'string', enum: ['pending', 'success', 'failed'], example: 'success' },
          requestPayload:  { type: 'object',                       example: { taskTitle: 'Complete DSA Assignment' } },
          responsePayload: { type: 'object', nullable: true,       example: { whatsappMessageId: 'wam_xxx' } },
          executedAt:      { type: 'string', format: 'date-time',  example: '2025-01-01T00:00:00Z' },
          createdAt:       { type: 'string', format: 'date-time',  example: '2025-01-01T00:00:00Z' },
        },
        required: ['id', 'workflowName', 'status', 'requestPayload', 'executedAt', 'createdAt'],
      },

      // -----------------------------------------------------------------------
      // AI
      // -----------------------------------------------------------------------

      /**
       * ====================================================
       * PYTHON AI ENTRY POINT
       * =====================
       * AiQueryRequest is forwarded verbatim to the Python
       * AI service at <PYTHON_AI_BASE_URL>/query.
       * The backend does not modify the request body.
       * ====================================================
       */
      AiQueryRequest: {
        type: 'object',
        description: 'Forwarded verbatim to the Python AI service.',
        properties: {
          query:     { type: 'string', example: 'Summarize my pending tasks' },
          studentId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          context:   { type: 'object', example: {}, description: 'Optional context object', nullable: true },
        },
        required: ['query', 'studentId'],
      },

      // -----------------------------------------------------------------------
      // Health
      // -----------------------------------------------------------------------
      HealthResponse: {
        type: 'object',
        properties: {
          server:    { type: 'string', enum: ['ok', 'degraded'],    example: 'ok' },
          database:  { type: 'string', enum: ['ok', 'unreachable'], example: 'ok' },
          pythonAi:  { type: 'string', enum: ['ok', 'unreachable'], example: 'ok' },
          n8n:       { type: 'string', enum: ['configured', 'not configured'], example: 'configured' },
          timestamp: { type: 'string', format: 'date-time',         example: '2025-01-01T00:00:00Z' },
          uptime:    { type: 'number',                              example: 3600, description: 'Server uptime in seconds' },
        },
        required: ['server', 'database', 'pythonAi', 'n8n', 'timestamp', 'uptime'],
      },
    },

    // -------------------------------------------------------------------------
    // Reusable Response Objects
    // -------------------------------------------------------------------------
    responses: {
      Unauthorized: {
        description: 'Missing or invalid Authorization header.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Unauthorized: missing or invalid token', errors: [] },
          },
        },
      },
      NotFound: {
        description: 'The requested resource does not exist.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Resource not found', errors: [] },
          },
        },
      },
      ValidationError: {
        description: 'Request body failed Zod schema validation.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Validation failed',
              errors:  [{ field: 'email', message: 'Invalid email format' }],
            },
          },
        },
      },
      InternalServerError: {
        description: 'Unexpected server error.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Internal server error', errors: [] },
          },
        },
      },
      Conflict: {
        description: 'Resource already exists (e.g., duplicate email).',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'A student with this email already exists', errors: [] },
          },
        },
      },
    },

    // -------------------------------------------------------------------------
    // Reusable Parameters
    // -------------------------------------------------------------------------
    parameters: {
      IdParam: {
        name:        'id',
        in:          'path',
        required:    true,
        description: 'Resource UUID',
        schema: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Global Security (applied to all endpoints by default)
  // ---------------------------------------------------------------------------
  security: [{ BearerAuth: [] }],

  // ---------------------------------------------------------------------------
  // Tags (groups endpoints in the Swagger UI sidebar)
  // ---------------------------------------------------------------------------
  tags: [
    { name: 'Health',     description: 'Server and dependency health checks' },
    { name: 'Students',   description: 'Student profile management' },
    { name: 'Tasks',      description: 'Task creation, tracking, and deadline management' },
    { name: 'Notices',    description: 'Campus notice board management' },
    { name: 'Automation', description: 'n8n webhook triggers and callback handling' },
    { name: 'AI',         description: 'Python AI service proxy — query forwarding' },
  ],
};

// =============================================================================
// SWAGGER-JSDOC OPTIONS
// =============================================================================
// swagger-jsdoc scans these files for @openapi JSDoc annotations and merges
// them with the base definition above.
// Add new route files to the `apis` array as they are created.
// =============================================================================

const swaggerJsdocOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/health.routes.js',
    './src/routes/student.routes.js',
    './src/routes/task.routes.js',
    './src/routes/notice.routes.js',
    './src/routes/automation.routes.js',
  ],
};

// =============================================================================
// SWAGGER-UI OPTIONS
// =============================================================================
// Customise the look and behaviour of the Swagger UI.
// =============================================================================

const swaggerUiOptions = {
  customSiteTitle: 'CampusFlow API Docs',
  swaggerOptions: {
    // Pre-populate the auth dialog with a reminder of what to paste
    persistAuthorization: true,
    // Display request duration in the response panel
    displayRequestDuration: true,
    // Show the "Try it out" button by default
    tryItOutEnabled: true,
    // Sort endpoints by HTTP method for readability
    operationsSorter: 'method',
    // Collapse all tags by default (expand manually)
    docExpansion: 'list',
    // Show model schemas expanded
    defaultModelsExpandDepth: 2,
  },
};

// =============================================================================
// SPEC GENERATION
// =============================================================================
// Generate the final merged OpenAPI spec. This runs once at module load time.
// =============================================================================

const swaggerSpec = swaggerJsdoc(swaggerJsdocOptions);

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
  /**
   * swaggerSpec — the full OpenAPI 3.0 JSON spec object.
   * Used by app.js to serve the raw JSON at /api/docs.json.
   */
  swaggerSpec,

  /**
   * swaggerUiExpress — the swagger-ui-express middleware module.
   * Re-exported here so app.js only needs to import from one place.
   */
  swaggerUiExpress,

  /**
   * swaggerUiOptions — UI customization options.
   * Passed to swagger-ui-express.setup() in app.js.
   */
  swaggerUiOptions,
};
