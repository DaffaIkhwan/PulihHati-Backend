const User = require('./models/User');

async function testPasswordCompare() {
  console.log('Available User methods:', Object.getOwnPropertyNames(User));
  
  try {
    // Test dengan password dummy
    const result = await User.comparePassword('test123', '$2a$10$someHashedPasswordHere');
    console.log('Password comparison result:', result);
  } catch (error) {
    console.error('Error testing password comparison:', error);
  }
}

testPasswordCompare();