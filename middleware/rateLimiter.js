const { RateLimiterMemory } = require('rate-limiter-flexible');

// Create rate limiters for different endpoints
const authLimiter = new RateLimiterMemory({
  keyPrefix: 'auth_limiter',
  points: 5, // 5 requests
  duration: 60, // per 60 seconds
  blockDuration: 60 * 15, // block for 15 minutes
});

const generalLimiter = new RateLimiterMemory({
  keyPrefix: 'general_limiter',
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  blockDuration: 60, // block for 1 minute
});

const callLimiter = new RateLimiterMemory({
  keyPrefix: 'call_limiter',
  points: 10, // 10 calls
  duration: 60, // per 60 seconds
  blockDuration: 60 * 5, // block for 5 minutes
});

const createRateLimiter = (limiter, message = 'Too many requests') => {
  return async (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    
    try {
      await limiter.consume(key);
      next();
    } catch (rateLimiterRes) {
      const remainingPoints = rateLimiterRes.remainingPoints || 0;
      const msBeforeNext = rateLimiterRes.msBeforeNext || 0;
      
      res.set({
        'Retry-After': Math.round(msBeforeNext / 1000) || 1,
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext)
      });
      
      res.status(429).json({
        error: message,
        retryAfter: Math.round(msBeforeNext / 1000) || 1
      });
    }
  };
};

module.exports = {
  authRateLimit: createRateLimiter(authLimiter, 'Too many authentication attempts'),
  generalRateLimit: createRateLimiter(generalLimiter, 'Too many requests'),
  callRateLimit: createRateLimiter(callLimiter, 'Too many call attempts')
};
