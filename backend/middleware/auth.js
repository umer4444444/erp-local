require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  // Allow unauthenticated access to public API routes
  if (req.path.startsWith('/api/public')) {
    return next();
  }
  const authHeader = req.header('Authorization') || req.header('authorization');
  const token = authHeader?.split(' ')[1]?.trim();

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact administration.' });
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error('JWT verify error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = { auth, roleCheck };
