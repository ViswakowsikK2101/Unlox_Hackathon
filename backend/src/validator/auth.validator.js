/**
 * CampusFlow Backend - Module 5 (Validators)
 * File: src/validators/auth.validator.js
 * Description: Zod schema definitions for the established authentication flow.
 */

const { z } = require('zod');

/**
 * --- FRONTEND INPUT ---
 * Captures standard login credentials matching the project's established authentication flow.
 * --- OUTPUT SCHEMA ---
 * Enforces standardized validation shapes for downstream consumption.
 */
const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' })
           .email('Invalid email address format'),
    password: z.string({ required_error: 'Password is required' })
              .min(6, 'Password must be at least 6 characters long')
  })
});

/**
 * --- FRONTEND INPUT ---
 * Captures standard registration fields required by the project's established authentication flow.
 * --- VALIDATION FLOW ---
 * Chains constraints to ensure strict hackathon data consistency.
 */
const registerSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' })
           .email('Invalid email address format'),
    password: z.string({ required_error: 'Password is required' })
              .min(6, 'Password must be at least 6 characters long')
  })
});

module.exports = {
  loginSchema,
  registerSchema
};