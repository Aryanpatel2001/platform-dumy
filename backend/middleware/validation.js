import { body, param, query, validationResult } from 'express-validator';
import Joi from 'joi';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Auth validation rules
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

/**
 * Agent validation rules
 */
export const validateAgent = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Agent name must be between 1 and 100 characters'),
  body('type')
    .isIn(['chatbot', 'voice_call'])
    .withMessage('Agent type must be either "chatbot" or "voice_call"'),
  body('systemPrompt')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('System prompt must be between 10 and 5000 characters'),
  body('model')
    .optional()
    .isIn(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'])
    .withMessage('Invalid model selection'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Temperature must be a number between 0 and 1'),
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Max tokens must be between 1 and 4000'),
  body('voice')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Voice must be specified for voice call agents'),
  body('functions')
    .optional()
    .isArray()
    .withMessage('Functions must be an array'),
  body('functions.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Function name must be between 1 and 100 characters'),
  body('functions.*.description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Function description must be between 1 and 500 characters'),
  body('functions.*.endpoint')
    .optional()
    .isURL()
    .withMessage('Function endpoint must be a valid URL'),
  handleValidationErrors
];

export const validateAgentId = [
  param('id')
    .isUUID()
    .withMessage('Invalid agent ID format'),
  handleValidationErrors
];

/**
 * Chat validation rules
 */
export const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('agentId')
    .optional()
    .isUUID()
    .withMessage('Invalid agent ID format'),
  body('conversationId')
    .optional()
    .isUUID()
    .withMessage('Invalid conversation ID format'),
  handleValidationErrors
];

/**
 * Function validation rules
 */
export const validateFunction = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Function name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('Function name must be a valid identifier'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Function description must be between 1 and 500 characters'),
  body('endpoint')
    .isURL()
    .withMessage('Function endpoint must be a valid URL'),
  body('method')
    .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    .withMessage('Invalid HTTP method'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('Parameters must be a valid JSON object'),
  handleValidationErrors
];

/**
 * Twilio validation rules
 */
export const validateTwilioCall = [
  param('id')
    .isUUID()
    .withMessage('Invalid agent ID format'),
  body('phoneNumber')
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
  handleValidationErrors
];

/**
 * Cal.com validation rules
 */
export const validateCalcomBooking = [
  body('eventTypeId')
    .isInt({ min: 1 })
    .withMessage('Event type ID must be a positive integer'),
  body('start')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('end')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('attendee')
    .isObject()
    .withMessage('Attendee information is required'),
  body('attendee.email')
    .isEmail()
    .withMessage('Valid attendee email is required'),
  body('attendee.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Attendee name is required'),
  handleValidationErrors
];

/**
 * Query parameter validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Joi schema for complex validation
 */
export const agentFunctionSchema = Joi.object({
  name: Joi.string().min(1).max(100).pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/).required(),
  description: Joi.string().min(1).max(500).required(),
  endpoint: Joi.string().uri().required(),
  method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').required(),
  parameters: Joi.object().optional(),
  headers: Joi.object().optional(),
  authentication: Joi.object({
    type: Joi.string().valid('none', 'bearer', 'api_key', 'basic').required(),
    token: Joi.string().when('type', {
      is: Joi.string().valid('bearer', 'api_key'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).optional()
});

/**
 * Middleware for Joi validation
 */
export const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};