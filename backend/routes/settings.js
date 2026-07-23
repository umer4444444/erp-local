const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth, roleCheck } = require('../middleware/auth');
const router = express.Router();

const SETTINGS_PATH = path.join(__dirname, '../config/settings.json');

// Read settings
router.get('/', async (req, res) => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return res.json({ companyName: 'GlobalAI ERP', officeLat: 31.5204, officeLng: 74.3587 });
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ message: 'Error reading settings' });
  }
});

// Update settings (Admin only)
router.post('/', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { companyName, officeLat, officeLng } = req.body;
    let currentSettings = { companyName: 'GlobalAI ERP', officeLat: 31.5204, officeLng: 74.3587 };
    
    if (fs.existsSync(SETTINGS_PATH)) {
      currentSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }

    const newSettings = {
      ...currentSettings,
      ...(companyName && { companyName }),
      ...(officeLat && { officeLat: parseFloat(officeLat) }),
      ...(officeLng && { officeLng: parseFloat(officeLng) })
    };

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(newSettings, null, 2));
    res.json({ message: 'Settings updated successfully', settings: newSettings });
  } catch (err) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

module.exports = router;
