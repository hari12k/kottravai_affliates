# Zoho SMTP Quick Reference Guide

## 🔑 Credentials
- **SMTP Host:** smtp.zoho.in
- **Port:** 465 (SSL)
- **User:** admin@kottravai.in
- **App Password:** jZfPQCxqJaYQ

## 📧 Email Aliases & Reply-To Routing
| Type | Reply-To |
|------|----------|
| Orders | sales@kottravai.in |
| B2B | b2b@kottravai.in |
| Contact | support@kottravai.in |
| Subscribe | info@kottravai.in |
| Custom | sales@kottravai.in |

## 🧪 Testing
```bash
# Test all email types
cd server
node test-email-system.js
```

## 🔍 Verify Connection
Check server startup logs for:
```
✅ SMTP connection verified successfully
✅ Zoho SMTP ready for sending emails
```

## 📝 Send Email (Code Example)
```javascript
const { sendEmail } = require('./utils/mailer');

await sendEmail({
    to: 'customer@example.com',
    subject: 'Your Subject',
    html: '<h1>HTML Content</h1>',
    type: 'order' // or 'b2b', 'contact', 'subscribe', 'custom'
});
```

## 🚨 Troubleshooting
1. Check `.env` file for correct credentials
2. Verify app password is valid in Zoho
3. Check server logs for SMTP errors
4. Run test script to diagnose issues

## 📊 Monitoring
- Server logs show all email operations
- Each email logs: from, reply-to, to, subject, type, status
- Message IDs confirm successful delivery
