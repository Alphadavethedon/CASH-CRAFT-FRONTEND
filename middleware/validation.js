const Joi = require('joi'); // Make sure joi is in package.json dependencies

// Middleware to validate request body against a Joi schema
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false }); // abortEarly: false to get all errors
  if (error) {
    const errors = error.details.map(detail => ({
      message: detail.message,
      path: detail.path,
    }));
    return res.status(400).json({ success: false, message: "Validation error", errors });
  }
  next();
};

// Schema for user registration
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required() // Basic phone number validation
    .messages({ 'string.pattern.base': 'Phone number must be between 10 and 15 digits.' }),
  password: Joi.string().min(6).required(), // Add more complexity if needed: .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})'))
  referralCode: Joi.string().alphanum().min(3).max(10).optional().allow('', null), // Optional referral code
});

// Schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// You can add more schemas here for other routes as needed

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
};
