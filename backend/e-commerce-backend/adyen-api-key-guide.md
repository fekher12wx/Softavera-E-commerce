# Adyen API Key Guide

## 🔑 Getting Your Adyen API Key

### 1. **Go to Adyen Customer Area**
- **Test Environment**: https://ca-test.adyen.com/
- **Live Environment**: https://ca-live.adyen.com/

### 2. **Navigate to API Credentials**
- Go to **Developers** → **API credentials**
- Or **Settings** → **API credentials**

### 3. **Copy Your API Key**
Your API key should look like this format:
```
AQEnhmfuXNWTK0Qc+iSRp1YdlMWYS4RYA4cRkZRioSE334JkKdoSBnDDEMFdWw2+5HzctViMSCJMYAc=-6QO8fIrGtndQrpjryx98FYKxAnLfcijkLM37bEPnwwI=
```

## ✅ **Valid Characters Only**
Adyen API keys can ONLY contain:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Hyphens (-)
- Plus signs (+)
- Equals signs (=)

## ❌ **Invalid Characters**
Your current API key contains these invalid characters:
- `#` (hash)
- `$` (dollar sign)
- `(` `)` (parentheses)
- `}` `{` (braces)
- `~` (tilde)
- `%` (percent)

## 🔧 **How to Fix**

### Option 1: Get Clean API Key
1. Go to your Adyen Customer Area
2. Copy the clean API key (no special characters)
3. Update `populate-payment-credentials.js`
4. Run the populate script

### Option 2: Use Sample Test Key (Temporary)
For testing, you can use this sample test API key:
```javascript
config: {
  apiKey: 'AQEnhmfuXNWTK0Qc+iSRp1YdlMWYS4RYA4cRkZRioSE334JkKdoSBnDDEMFdWw2+5HzctViMSCJMYAc=-6QO8fIrGtndQrpjryx98FYKxAnLfcijkLM37bEPnwwI=',
  merchantAccount: 'AURESAccountPOS',
  environment: 'test',
  clientKey: 'test_U6OJZI3TA5EDFOIMDHPMV2HUTARAZ6WV'
}
```

## 📋 **Complete Configuration**
Your final configuration should look like:
```javascript
adyen: {
  name: 'Adyen',
  code: 'adyen',
  description: 'Global payment platform supporting multiple payment methods',
  isActive: true,
  config: {
    apiKey: 'YOUR_CLEAN_API_KEY_HERE',
    merchantAccount: 'AURESAccountPOS',
    environment: 'test',
    clientKey: 'test_U6OJZI3TA5EDFOIMDHPMV2HUTARAZ6WV'
  }
}
```

## 🚀 **Next Steps**
1. Get clean API key from Adyen
2. Update `populate-payment-credentials.js`
3. Run: `node populate-payment-credentials.js`
4. Test your integration

## 🧪 **Test Cards**
For test environment:
- **Visa**: `4212345678901247`
- **Mastercard**: `5555555555554444`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
