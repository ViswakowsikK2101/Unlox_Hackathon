/**
 * CampusFlow Backend - Module 5 (Validators)
 * File: src/validators/task.validator.js
 * Description: Zod schema definitions for Task Management mapping exactly to the approved contract.
 */

const { z } = require('zod');

/**
 * --- FRONTEND INPUT ---
 * Validates request parameter ID strings across task endpoints.
 * --- VALIDATION FLOW ---
 * Guarantees standard UUID compliance to ensure seamless interaction with Supabase.
 */
const taskIdParamSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' })
             .uuid('Invalid Task ID format. Must be a valid UUID')
  })
});

/**
 * --- FRONTEND INPUT ---
 * Input structure mapping directly from user interaction forms.
 * --- OUTPUT SCHEMA ---
 * Strictly matches the approved API contract structure.
 */
const createTaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' })
            .min(1, 'Title cannot be empty')
            .trim(),
    subject: z.string({ required_error: 'Subject is required' })
              .min(1, 'Subject cannot be empty')
              .trim(),
    deadline: z.string({ required_error: 'Deadline is required' })
               .datetime({ message: 'Deadline must be a valid ISO-8601 string timestamp' }),
    reminderTime: z.string({ required_error: 'Reminder time is required' })
                   .datetime({ message: 'Reminder time must be a valid ISO-8601 string timestamp' }),
    addToCalendar: z.boolean({ required_error: 'addToCalendar flag is required' })
  })
});

/**
 * --- FRONTEND INPUT ---
 * Handles updates to task resources while maintaining exact structural field compliance.
 * --- VALIDATION FLOW ---
 * Validates path parameters while allowing body fields to be optional for partial modifications.
 */
const updateTaskSchema = z.object({
  params: taskIdParamSchema.shape.params,
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').trim().optional(),
    subject: z.string().min(1, 'Subject cannot be empty').trim().optional(),
    deadline: z.string().datetime({ message: 'Deadline must be a valid ISO-8601 string timestamp' }).optional(),
    reminderTime: z.string().datetime({ message: 'Reminder time must be a valid ISO-8601 string timestamp' }).optional(),
    addToCalendar: z.boolean().optional()
  })
});

module.exports = {
  taskIdParamSchema,
  createTaskSchema,
  updateTaskSchema
};