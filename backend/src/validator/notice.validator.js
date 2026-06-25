/**
 * CampusFlow Backend - Module 5 (Validators)
 * File: src/validators/notice.validator.js
 * Description: Zod schema definitions for academic Notice management mapping exactly to approved contract fields.
 */

const { z } = require('zod');

/**
 * --- FRONTEND INPUT ---
 * Captures explicit request parameters for targeted notice actions.
 */
const noticeIdParamSchema = z.object({
  params: z.object({
    noticeId: z.string({ required_error: 'Notice ID is required' })
               .uuid('Invalid Notice ID format. Must be a valid UUID')
  })
});

/**
 * --- FRONTEND INPUT ---
 * Validates the document structure matching approved notice fields.
 * --- OUTPUT SCHEMA ---
 * Standardized schema bound for the internal pipeline.
 */
const createNoticeSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' })
            .min(1, 'Title cannot be empty')
            .trim(),
    content: z.string({ required_error: 'Content is required' })
              .min(1, 'Content cannot be empty')
              .trim()
  })
});

/**
 * --- FRONTEND INPUT ---
 * Handles query parameter inputs for pulling localized list records.
 */
const listNoticesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10))
  })
});

module.exports = {
  noticeIdParamSchema,
  createNoticeSchema,
  listNoticesQuerySchema
};