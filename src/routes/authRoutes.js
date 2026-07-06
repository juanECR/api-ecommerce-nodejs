// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login); // POST http://localhost:4000/api/auth/login

module.exports = router;