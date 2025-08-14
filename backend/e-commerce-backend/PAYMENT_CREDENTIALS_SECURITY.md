# 🔐 Payment Credentials Security Guide

## ⚠️ Security Warning

**NEVER commit API keys, credentials, or sensitive configuration files to Git!**

This guide explains how to securely handle payment gateway credentials in your AURES E-Commerce Platform.

## 🚨 What NOT to Commit

- ❌ API keys
- ❌ Merchant IDs
- ❌ Access tokens
- ❌ Private keys
- ❌ Database passwords
- ❌ Environment-specific configs

## ✅ What IS Safe to Commit

- ✅ Template files (`.template.js`)
- ✅ Documentation
- ✅ Example configurations with placeholders
- ✅ Environment variable examples (`.env.example`)

## 🔧 Setting Up Payment Credentials

### **Step 1: Use the Template**
```bash
cd backend/e-commerce-backend
cp populate-payment-credentials.template.js populate-payment-credentials.js
```

### **Step 2: Edit with Real Credentials**
```javascript
// Replace these placeholders with your actual credentials
config: {
  apiKey: 'sk_test_51ABC123...',        // Your real API key
  merchantId: 'merchant_123456',        // Your real merchant ID
  environment: 'test'                    // 'test' or 'live'
}
```

### **Step 3: Run the Setup**
```bash
node populate-payment-credentials.js
```

### **Step 4: Clean Up (IMPORTANT!)**
```bash
rm populate-payment-credentials.js  # Delete the file with real credentials
```

## 🛡️ Security Best Practices

### **1. Environment Variables (Recommended)**
```bash
# .env file (never commit this)
ADYEN_API_KEY=sk_test_51ABC123...
ADYEN_MERCHANT_ID=merchant_123456
PAYMEE_API_TOKEN=your_token_here
KONNECT_API_KEY=your_key_here
```

### **2. Use in Code**
```javascript
const config = {
  apiKey: process.env.ADYEN_API_KEY,
  merchantId: process.env.ADYEN_MERCHANT_ID,
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
};
```

### **3. Database Storage (Encrypted)**
```javascript
// Store encrypted credentials in database
const encryptedConfig = await encryptionService.encrypt(JSON.stringify(config));
await db.query('UPDATE payment_methods SET config = $1 WHERE id = $2', [encryptedConfig, methodId]);
```

## 🔍 Current Security Status

Your repository is now protected with:

- ✅ **Enhanced .gitignore** - Prevents credential files from being committed
- ✅ **Template files** - Safe examples without real data
- ✅ **Security documentation** - Clear guidelines for developers

## 🚀 Quick Security Check

Run this command to check for any sensitive files:
```bash
# Check for potential credential files
find . -name "*credential*" -o -name "*payment*" -o -name "*api*" -o -name "*key*" | grep -v node_modules
```

## 📋 Payment Gateway Setup

### **Adyen**
- Get API key from [Adyen Customer Area](https://ca-test.adyen.com/)
- Use test credentials for development
- Switch to live credentials for production

### **Paymee**
- Register at [Paymee Developer Portal](https://paymee.tn/)
- Get API token and vendor ID
- Test with sandbox environment first

### **Konnect**
- Contact Konnect for API access
- Get merchant ID and API key
- Test thoroughly before going live

## 🔄 Updating Credentials

### **For Development**
```bash
# 1. Copy template
cp populate-payment-credentials.template.js populate-payment-credentials.js

# 2. Edit with new credentials
nano populate-payment-credentials.js

# 3. Run update
node populate-payment-credentials.js

# 4. Clean up
rm populate-payment-credentials.js
```

### **For Production**
```bash
# Use environment variables or encrypted database storage
# Never store credentials in files on production servers
```

## 🚨 Emergency Response

If you accidentally commit credentials:

1. **Immediate Action**
   ```bash
   git reset --hard HEAD~1  # Remove last commit
   git push --force origin main  # Force push (use with caution)
   ```

2. **Rotate Credentials**
   - Generate new API keys
   - Update all systems
   - Monitor for unauthorized usage

3. **Security Audit**
   - Check git history
   - Review access logs
   - Update security policies

## 📞 Support

- **Security Issues**: Create private issue in GitHub
- **Credential Problems**: Contact payment gateway support
- **Development Questions**: Use GitHub Discussions

## 🎯 Summary

✅ **Safe to commit**: Templates, documentation, examples  
❌ **Never commit**: API keys, credentials, sensitive configs  
🔐 **Use**: Environment variables, encrypted storage  
🛡️ **Protect**: Your business, customers, and reputation  

Remember: **Security first, convenience second!**
