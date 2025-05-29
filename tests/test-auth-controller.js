const User = require('../models/User');
const authController = require('../controllers/authController');

// Melihat isi dari authController
console.log('Auth controller login function:');
console.log(authController.login.toString());

// Melihat metode yang tersedia di User
console.log('User methods:', Object.getOwnPropertyNames(User));