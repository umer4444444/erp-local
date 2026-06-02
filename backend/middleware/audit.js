const { AuditLog } = require('../models');

const auditMiddleware = (moduleName) => {
  return async (req, res, next) => {
    // Only audit mutating actions (POST, PUT, DELETE)
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const originalSend = res.send;
    let responseBody = null;

    res.send = function (body) {
      responseBody = body;
      originalSend.apply(res, arguments);
    };

    res.on('finish', async () => {
      try {
        // Only log successful actions
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          let parsedBody;
          try {
            parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
          } catch (e) {
            parsedBody = responseBody;
          }

          // Resolve record ID
          const recordId = parsedBody?.id || req.params.id || null;

          await AuditLog.create({
            userId: req.user.id,
            action: req.method,
            module: moduleName || req.baseUrl.replace('/api/', ''),
            recordId: recordId ? String(recordId) : null,
            oldValue: req.method === 'PUT' ? JSON.stringify(req.body) : null,
            newValue: ['POST', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : null,
            ip: req.ip || req.connection?.remoteAddress || '127.0.0.1'
          });
        }
      } catch (err) {
        console.error('Audit log generation failed:', err);
      }
    });

    next();
  };
};

module.exports = auditMiddleware;
