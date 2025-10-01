const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.type = 'ValidationError';
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.originalError = originalError;
    this.type = 'DatabaseError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.type = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.type = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.type = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.type = 'RateLimitError';
  }
}

// Error handling middleware
const handleDatabaseError = (err) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  if (err.code === 'ER_NO_SUCH_TABLE') {
    message = 'Database table not found';
    statusCode = 500;
  } else if (err.code === 'ER_DUP_ENTRY') {
    const duplicateField = err.sqlMessage.match(/for key '(.+?)'/)?.[1] || 'unknown field';
    message = `Duplicate entry for ${duplicateField}`;
    statusCode = 409;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    message = 'Referenced record not found';
    statusCode = 400;
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    message = 'Cannot delete record - it is referenced by other records';
    statusCode = 409;
  } else if (err.code === 'ECONNREFUSED') {
    message = 'Database connection refused';
    statusCode = 503;
  } else if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    message = 'Database connection lost';
    statusCode = 503;
  }

  return new DatabaseError(message, err);
};

const handleValidationError = (err) => {
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    return new ValidationError('Validation failed', errors);
  }
  return new ValidationError(err.message);
};

const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  return new AuthenticationError('Authentication failed');
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Log the error
  logger.error('Global error handler', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    }
  });

  // Handle different error types
  if (err.code && (err.code.startsWith('ER_') || err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST')) {
    error = handleDatabaseError(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  } else if (!err.isOperational) {
    // Programming errors - don't leak error details
    error = new AppError('Something went wrong', 500);
  }

  // Send error response
  const statusCode = error.statusCode || 500;
  const response = {
    status: error.status || 'error',
    message: error.message
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      stack: err.stack,
      ...err
    };
  }

  // Include validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler
};