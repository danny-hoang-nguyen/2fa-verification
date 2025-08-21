const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/generate', authController.generate);
router.post('/verify', authController.verify);

module.exports = router;
