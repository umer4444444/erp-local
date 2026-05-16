const express = require('express');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', auth, roleCheck(['admin']), async (req, res) => {
  res.json({ message: 'Stats endpoint' });
});

module.exports = router;
