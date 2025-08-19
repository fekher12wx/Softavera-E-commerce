const fs = require('fs');
const path = require('path');

// Check and create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const logosDir = path.join(uploadsDir, 'logos');

console.log('🔍 Checking uploads directory structure...');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory already exists');
}

// Create logos subdirectory if it doesn't exist
if (!fs.existsSync(logosDir)) {
  console.log('📁 Creating logos subdirectory...');
  fs.mkdirSync(logosDir, { recursive: true });
  console.log('✅ Logos subdirectory created');
} else {
  console.log('✅ Logos subdirectory already exists');
}

console.log('\n📋 Directory structure:');
console.log(`  - ${uploadsDir}`);
console.log(`  - ${logosDir}`);

// Check if directories are writable
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('✅ Uploads directory is writable');
} catch (error) {
  console.log('❌ Uploads directory is not writable');
}

try {
  fs.accessSync(logosDir, fs.constants.W_OK);
  console.log('✅ Logos directory is writable');
} catch (error) {
  console.log('❌ Logos directory is not writable');
}

console.log('\n🎉 Upload directory check completed!');
