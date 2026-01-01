/**
 * Request Logger Middleware
 * Logs all incoming HTTP requests with timing and details
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Store request ID for tracing
  req.requestId = requestId;
  
  // Log incoming request
  const logRequest = () => {
    const method = req.method;
    const path = req.originalUrl || req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const userId = req.user?.id || 'guest';
    
    console.log(`[${new Date().toISOString()}] [${requestId}] REQUEST ${method} ${path}`);
    console.log(`  └─ IP: ${ip} | User: ${userId} | UA: ${userAgent.substring(0, 50)}...`);
    
    // Log body for POST/PUT/PATCH requests (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      const sanitizedBody = sanitizeBody(req.body);
      if (Object.keys(sanitizedBody).length > 0) {
        console.log(`  └─ Body: ${JSON.stringify(sanitizedBody).substring(0, 500)}`);
      }
    }
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = getStatusColor(statusCode);
    
    console.log(`[${new Date().toISOString()}] [${requestId}] RESPONSE ${statusColor}${statusCode}\x1b[0m in ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`  └─ ⚠️ SLOW REQUEST: ${duration}ms`);
    }
  });

  // Log errors
  res.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] [${requestId}] ERROR:`, error.message);
  });

  logRequest();
  next();
};

/**
 * Sanitize request body - remove sensitive fields
 */
const sanitizeBody = (body) => {
  const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'cvv'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Get ANSI color code based on HTTP status
 */
const getStatusColor = (statusCode) => {
  if (statusCode >= 500) return '\x1b[31m'; // Red for 5xx
  if (statusCode >= 400) return '\x1b[33m'; // Yellow for 4xx
  if (statusCode >= 300) return '\x1b[36m'; // Cyan for 3xx
  if (statusCode >= 200) return '\x1b[32m'; // Green for 2xx
  return '\x1b[0m'; // Default
};

/**
 * Error Logger Middleware
 * Should be placed after all routes
 */
const errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  
  console.error(`[${new Date().toISOString()}] [${requestId}] ERROR HANDLER:`);
  console.error(`  └─ Message: ${err.message}`);
  console.error(`  └─ Stack: ${err.stack?.split('\n').slice(0, 3).join('\n    ')}`);
  
  next(err);
};

module.exports = { requestLogger, errorLogger };

